/**
 * Vercel Serverless Function
 * Se sirve automáticamente en: /api/youtube/search
 *
 * Por qué existe: la API key de YouTube nunca debe llegar al navegador.
 * Esta función vive en el servidor de Vercel, lee la key desde una
 * variable de entorno, y el frontend solo le habla a ESTA ruta.
 *
 * Configuración necesaria en Vercel:
 *   1. Project Settings -> Environment Variables
 *   2. Agregar: YOUTUBE_API_KEY = tu_api_key_de_google_cloud
 *   3. Redeploy para que tome la variable
 *
 * En desarrollo local con `vercel dev`, crear un archivo .env.local:
 *   YOUTUBE_API_KEY=tu_api_key_aqui
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeSearchItem {
  id: { videoId?: string; playlistId?: string; kind: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: { medium?: { url: string }; high?: { url: string } };
    description: string;
  };
}

interface SimplifiedResult {
  id: string;
  kind: 'video' | 'playlist';
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
}

// Rate limiting simple en memoria. En serverless cada instancia tiene su
// propia memoria, así que esto es una protección básica, no exacta.
// Para algo más robusto, usar Vercel KV o Upstash Redis.
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiadas búsquedas, esperá un momento.' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY no está configurada en las variables de entorno de Vercel');
    return res.status(500).json({ error: 'Servicio de búsqueda no disponible' });
  }

  const query = (Array.isArray(req.query.q) ? req.query.q[0] : req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Falta el parámetro de búsqueda "q"' });
  }
  if (query.length > 100) {
    return res.status(400).json({ error: 'Búsqueda demasiado larga' });
  }

  const pageToken = Array.isArray(req.query.pageToken) ? req.query.pageToken[0] : req.query.pageToken;

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video,playlist',
      maxResults: '12',
      safeSearch: 'moderate',
      key: apiKey,
    });
    if (pageToken) params.set('pageToken', pageToken);

    const ytResponse = await fetch(`${YOUTUBE_API_BASE}/search?${params.toString()}`);

    if (!ytResponse.ok) {
      const errBody = await ytResponse.text();
      console.error('Error de YouTube API:', ytResponse.status, errBody);
      return res.status(502).json({ error: 'No se pudo completar la búsqueda' });
    }

    const data = (await ytResponse.json()) as {
      items: YouTubeSearchItem[];
      nextPageToken?: string;
    };

    const results: SimplifiedResult[] = data.items
      .filter((item) => item.id.videoId || item.id.playlistId)
      .map((item) => ({
        id: (item.id.videoId || item.id.playlistId) as string,
        kind: item.id.videoId ? 'video' : 'playlist',
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
        description: item.snippet.description,
      }));

    // Cache corto en el edge de Vercel: reduce llamadas repetidas a la
    // misma búsqueda y ahorra cuota de la API.
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

    return res.status(200).json({
      results,
      nextPageToken: data.nextPageToken || null,
    });
  } catch (err) {
    console.error('Error inesperado consultando YouTube:', err);
    return res.status(500).json({ error: 'Error interno al buscar' });
  }
}