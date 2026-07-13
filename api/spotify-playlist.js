/**
 * GET /api/spotify-playlist?id=... | ?url=...
 */

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const MAX_TRACKS = 500;
const PAGE_SIZE = 100;

let accessToken = null;
let tokenExpiresAt = 0;

function parsePlaylistId(raw) {
  const input = String(raw || '').trim();
  if (!input) return null;
  if (/^[a-zA-Z0-9]{10,30}$/.test(input)) return input;
  try {
    const url = new URL(input);
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('playlist');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].split('?')[0];
  } catch {}
  const uriMatch = input.match(/^spotify:playlist:([a-zA-Z0-9]+)$/i);
  return uriMatch ? uriMatch[1] : null;
}

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const err = new Error('MISSING_CREDENTIALS');
    throw err;
  }
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) {
    const t = await response.text();
    throw new Error(`TOKEN_FAILED:${response.status}:${t.slice(0, 120)}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000;
  return accessToken;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  // health / debug
  if (req.query.debug === '1') {
    return res.status(200).json({
      ok: true,
      hasClientId: Boolean(process.env.SPOTIFY_CLIENT_ID),
      hasClientSecret: Boolean(process.env.SPOTIFY_CLIENT_SECRET),
    });
  }

  const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const urlParam = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const playlistId = parsePlaylistId(idParam || urlParam || '');

  if (!playlistId) {
    return res.status(400).json({
      error: 'URL o ID de playlist inválido. Ej: https://open.spotify.com/playlist/...',
    });
  }

  try {
    const token = await getSpotifyAccessToken();

    const metaRes = await fetch(`${SPOTIFY_API_BASE}/playlists/${encodeURIComponent(playlistId)}?market=AR`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!metaRes.ok) {
      const body = await metaRes.text();
      console.error('Spotify playlist meta:', metaRes.status, body);
      // Usar 502 (no 404) para que no se confunda con "ruta no encontrada"
      return res.status(502).json({
        error:
          metaRes.status === 404
            ? 'Playlist no encontrada o no es pública en Spotify'
            : `Spotify respondió ${metaRes.status}`,
        spotifyStatus: metaRes.status,
        details: body.slice(0, 300),
        playlistId,
      });
    }

    const meta = await metaRes.json();
    const tracks = [];
    let offset = 0;

    while (tracks.length < MAX_TRACKS) {
      const itemsRes = await fetch(
        `${SPOTIFY_API_BASE}/playlists/${encodeURIComponent(playlistId)}/tracks?limit=${PAGE_SIZE}&offset=${offset}&market=AR`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!itemsRes.ok) {
        console.error('tracks page fail', itemsRes.status);
        break;
      }

      const page = await itemsRes.json();
      for (const item of page.items || []) {
        const track = item.track;
        if (!track || !track.id) continue;
        tracks.push({
          id: track.id,
          title: track.name,
          artist: (track.artists || []).map((a) => a.name).join(', '),
          cover: (track.album && track.album.images && track.album.images[0] && track.album.images[0].url) ||
            (meta.images && meta.images[0] && meta.images[0].url) ||
            '',
          duration: track.duration_ms,
          uri: track.uri,
        });
        if (tracks.length >= MAX_TRACKS) break;
      }
      if (!page.next || !(page.items || []).length) break;
      offset += PAGE_SIZE;
    }

    if (tracks.length === 0) {
      return res.status(502).json({
        error: 'La playlist no tiene canciones disponibles',
        playlistId,
        name: meta.name || null,
      });
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      id: playlistId,
      name: meta.name,
      cover: (meta.images && meta.images[0] && meta.images[0].url) || tracks[0].cover || '',
      trackCount: (meta.tracks && meta.tracks.total) || tracks.length,
      importedCount: tracks.length,
      truncated: ((meta.tracks && meta.tracks.total) || tracks.length) > tracks.length,
      tracks,
    });
  } catch (err) {
    console.error('Error importando playlist Spotify:', err);
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'MISSING_CREDENTIALS') {
      return res.status(503).json({
        error: 'Faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET en Vercel → Environment Variables',
      });
    }
    return res.status(500).json({ error: message });
  }
}
