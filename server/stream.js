import { spawn } from 'child_process';
import { createRequire } from 'module';
import { Readable } from 'stream';

const require = createRequire(import.meta.url);

/** @type {Map<string, { url: string; expires: number; mimeType: string; title?: string }>} */
const cache = new Map();
const CACHE_TTL_MS = 45 * 60 * 1000;

function findYtDlpBinary() {
  if (process.env.YT_DLP_PATH) return process.env.YT_DLP_PATH;
  try {
    const ytdl = require('youtube-dl-exec');
    const fromConstants = ytdl?.constants?.YOUTUBE_DL_PATH;
    if (fromConstants) return fromConstants;
  } catch {
    /* ignore */
  }
  return null;
}

function runYtDlp(args, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const bin = findYtDlpBinary() || 'yt-dlp';
    const child = spawn(bin, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('yt-dlp timeout'));
    }, timeoutMs);
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(stderr.trim().slice(0, 400) || `yt-dlp exit ${code}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Resolve a direct audio media URL via yt-dlp.
 * @param {string} videoId
 */
export async function resolveAudioUrl(videoId) {
  const cached = cache.get(videoId);
  if (cached && cached.expires > Date.now()) return cached;

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  // -f ba = best audio; -g = print URL only; --no-playlist
  const raw = await runYtDlp([
    '-f',
    'ba/bestaudio/best',
    '-g',
    '--no-playlist',
    '--no-warnings',
    watchUrl,
  ]);
  const url = raw.split(/\r?\n/).map((l) => l.trim()).find((l) => l.startsWith('http'));
  if (!url) throw new Error('yt-dlp no devolvió URL');

  let title;
  try {
    title = await runYtDlp(['--print', '%(title)s', '--no-playlist', '--no-warnings', watchUrl], 15000);
  } catch {
    title = undefined;
  }

  const mimeType = url.includes('mime=audio%2Fwebm') || url.includes('webm')
    ? 'audio/webm'
    : 'audio/mp4';

  const entry = {
    url,
    mimeType,
    title: title || undefined,
    expires: Date.now() + CACHE_TTL_MS,
  };
  cache.set(videoId, entry);
  return entry;
}

export function ytDlpAvailable() {
  return new Promise((resolve) => {
    const bin = findYtDlpBinary() || 'yt-dlp';
    const child = spawn(bin, ['--version'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.on('error', () => resolve({ ok: false, bin }));
    child.on('close', (code) => resolve({ ok: code === 0, bin, version: out.trim() || null }));
  });
}

/**
 * Pipe upstream media to Express response with CORS + Range.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {string} upstreamUrl
 * @param {string} mimeType
 */
export async function proxyMedia(req, res, upstreamUrl, mimeType) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: '*/*',
  };
  if (req.headers.range) headers.Range = req.headers.range;

  const upstream = await fetch(upstreamUrl, { headers, redirect: 'follow' });
  if (!upstream.ok && upstream.status !== 206) {
    res.status(upstream.status).json({ error: 'Upstream media failed', status: upstream.status });
    return;
  }

  res.status(upstream.status);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes');
  res.setHeader('Content-Type', upstream.headers.get('content-type') || mimeType);
  const len = upstream.headers.get('content-length');
  if (len) res.setHeader('Content-Length', len);
  const cr = upstream.headers.get('content-range');
  if (cr) res.setHeader('Content-Range', cr);
  res.setHeader('Cache-Control', 'private, max-age=60');

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  if (!upstream.body) {
    res.end();
    return;
  }

  // Node 18+ fetch body → Web ReadableStream → Node Readable
  // @ts-expect-error undici stream
  const nodeStream = Readable.fromWeb(upstream.body);
  nodeStream.pipe(res);
  nodeStream.on('error', () => {
    try {
      res.destroy();
    } catch {
      /* ignore */
    }
  });
}

/**
 * @param {import('express').Express} app
 * @param {{ publicBase: string }} opts
 */
export function mountStreamRoutes(app, opts) {
  const publicBase = opts.publicBase.replace(/\/$/, '');

  app.options('/stream/:videoId', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Accept');
    res.status(204).end();
  });

  app.options('/stream/:videoId/audio', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Accept');
    res.status(204).end();
  });

  /** JSON resolve — browser points MediaElement at our CORS proxy. */
  app.get('/stream/:videoId', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const videoId = String(req.params.videoId || '').trim();
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      res.status(400).json({ error: 'videoId inválido' });
      return;
    }
    try {
      const resolved = await resolveAudioUrl(videoId);
      res.json({
        url: `${publicBase}/stream/${videoId}/audio`,
        mimeType: resolved.mimeType,
        quality: 'bestaudio',
        kind: 'audio',
        title: resolved.title,
        source: 'yt-dlp',
      });
    } catch (err) {
      console.error('[stream] resolve failed', videoId, err);
      res.status(502).json({
        error: 'No se pudo resolver audio con yt-dlp',
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.get('/stream/:videoId/audio', async (req, res) => {
    const videoId = String(req.params.videoId || '').trim();
    if (!/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      res.status(400).json({ error: 'videoId inválido' });
      return;
    }
    try {
      const resolved = await resolveAudioUrl(videoId);
      await proxyMedia(req, res, resolved.url, resolved.mimeType);
    } catch (err) {
      console.error('[stream] proxy failed', videoId, err);
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Proxy de audio falló',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  });
}
