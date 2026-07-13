/**
 * GET /api/spotify/playlist?id=... | ?url=...
 * Importa metadata de una playlist pública de Spotify (Client Credentials).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSpotifyAccessToken } from './_token';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const MAX_TRACKS = 500;
const PAGE_SIZE = 100;

const requestLog = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > MAX_REQUESTS;
}

function parsePlaylistId(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;

  if (/^[a-zA-Z0-9]{10,30}$/.test(input)) return input;

  try {
    const url = new URL(input);
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('playlist');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].split('?')[0];
  } catch {
    /* not a URL */
  }

  const uriMatch = input.match(/^spotify:playlist:([a-zA-Z0-9]+)$/i);
  if (uriMatch) return uriMatch[1];

  return null;
}

interface SpotifyPlaylistTrackItem {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
    duration_ms: number;
    uri: string;
  } | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes, esperá un momento.' });
  }

  const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const urlParam = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const playlistId = parsePlaylistId(String(idParam || urlParam || ''));

  if (!playlistId) {
    return res.status(400).json({
      error: 'URL o ID de playlist inválido. Ej: https://open.spotify.com/playlist/...',
    });
  }

  try {
    const token = await getSpotifyAccessToken();

    const metaRes = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}?market=from_token`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (metaRes.status === 404) {
      return res.status(404).json({ error: 'Playlist no encontrada o no es pública' });
    }
    if (!metaRes.ok) {
      const body = await metaRes.text();
      console.error('Spotify playlist meta:', metaRes.status, body);
      return res.status(502).json({ error: 'No se pudo leer la playlist en Spotify' });
    }

    const meta = (await metaRes.json()) as {
      name: string;
      images: { url: string }[];
      tracks: { total: number };
    };

    const tracks: {
      id: string;
      title: string;
      artist: string;
      cover: string;
      duration: number;
      uri: string;
    }[] = [];

    let offset = 0;
    while (tracks.length < MAX_TRACKS) {
      const itemsRes = await fetch(
        `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=${PAGE_SIZE}&offset=${offset}&market=from_token`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!itemsRes.ok) {
        console.error('Spotify playlist tracks:', itemsRes.status);
        break;
      }

      const page = (await itemsRes.json()) as {
        items: SpotifyPlaylistTrackItem[];
        next: string | null;
      };

      for (const item of page.items) {
        if (!item.track?.id) continue;
        tracks.push({
          id: item.track.id,
          title: item.track.name,
          artist: item.track.artists.map((a) => a.name).join(', '),
          cover: item.track.album.images[0]?.url || meta.images[0]?.url || '',
          duration: item.track.duration_ms,
          uri: item.track.uri,
        });
        if (tracks.length >= MAX_TRACKS) break;
      }

      if (!page.next || page.items.length === 0) break;
      offset += PAGE_SIZE;
    }

    if (tracks.length === 0) {
      return res.status(404).json({ error: 'La playlist no tiene canciones disponibles' });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      id: playlistId,
      name: meta.name,
      cover: meta.images[0]?.url || tracks[0]?.cover || '',
      trackCount: meta.tracks?.total ?? tracks.length,
      importedCount: tracks.length,
      truncated: (meta.tracks?.total ?? tracks.length) > tracks.length,
      tracks,
    });
  } catch (err) {
    console.error('Error importando playlist Spotify:', err);
    return res.status(500).json({ error: 'Error interno al importar playlist' });
  }
}
