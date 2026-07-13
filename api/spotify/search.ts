/**
 * Vercel Serverless Function for Spotify Search
 * Se sirve automáticamente en: /api/spotify/search
 * 
 * Configuración necesaria en Vercel:
 *   1. Project Settings -> Environment Variables
 *   2. Agregar: 
 *      - SPOTIFY_CLIENT_ID = tu_client_id
 *      - SPOTIFY_CLIENT_SECRET = tu_client_secret
 *   3. Redeploy
 * 
 * En desarrollo local con `vercel dev`, agregar a .env.local:
 *   SPOTIFY_CLIENT_ID=tu_client_id
 *   SPOTIFY_CLIENT_SECRET=tu_client_secret
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSpotifyAccessToken } from '../../lib/spotifyToken';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Rate limiting simple en memoria
const requestLog = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > MAX_REQUESTS;
}

interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  uri: string;
  duration_ms: number;
}

interface SimplifiedSpotifyResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  thumbnail: string;
  duration: number;
  uri: string;
  service: 'spotify';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiadas búsquedas, esperá un momento.' });
  }

  const query = (Array.isArray(req.query.q) ? req.query.q[0] : req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro de búsqueda "q"' });
  }
  if (query.length > 100) {
    return res.status(400).json({ error: 'Búsqueda demasiado larga' });
  }

try {
    const token = await getSpotifyAccessToken();
    console.log('🔑 Token obtenido (primeros 15 chars):', token.slice(0, 15));

    const params = new URLSearchParams();
    params.append('q', query);
    params.append('type', 'track');
    params.append('limit', '10');

    const url = `${SPOTIFY_API_BASE}/search?${params.toString()}`;
    console.log('🔎 URL completa a Spotify:', url);

    const spotifyResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!spotifyResponse.ok) {
      const errBody = await spotifyResponse.text();
      console.error('❌ Status:', spotifyResponse.status, '| Body:', errBody);
      return res.status(502).json({ error: 'No se pudo completar la búsqueda' });
    }

    // 👇 ESTA LÍNEA FALTABA
    const data = await spotifyResponse.json() as { tracks: { items: SpotifyTrackItem[] } };

    const results: SimplifiedSpotifyResult[] = data.tracks.items.map((item) => ({
      id: item.id,
      title: item.name,
      artist: item.artists.map(a => a.name).join(', '),
      album: item.album.name,
      thumbnail: item.album.images[0]?.url || '',
      duration: item.duration_ms,
      uri: item.uri,
      service: 'spotify',
    }));

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({ results });
  } catch (err) {
    console.error('Error inesperado consultando Spotify:', err);
    return res.status(500).json({ error: 'Error interno al buscar' });
  }
}

