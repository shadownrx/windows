/**
 * GET /share?room=CODE | /share?cloud=UUID | /api/og-nex-music?...
 * Serves Open Graph HTML for social crawlers; redirects humans to /nex-music.
 */

const BOT_UA =
  /bot|crawl|slurp|spider|facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|Discordbot|LinkedInBot|SkypeUriPreview|Slackbot|vkShare|W3C_Validator|redditbot|Applebot/i;

function isBot(ua = '') {
  return BOT_UA.test(ua);
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function appBase(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'anex-os.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

async function supabaseCreds() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPBASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPBASE_PUBLISHABLE_KEY;
  return { url, key };
}

async function fetchCloudMeta(id) {
  const { url, key } = await supabaseCreds();
  if (!url || !key || !id) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/global_playlists?id=eq.${encodeURIComponent(id)}&select=name,cover,owner_nickname`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

async function fetchShortShareMeta(code) {
  const { url, key } = await supabaseCreds();
  if (!url || !key || !code) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/playlist_shares?code=eq.${encodeURIComponent(code)}&select=name,cover,owner_nickname&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

function ogHtml({ title, description, image, url, redirect }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(url);
  const safeRedirect = escapeHtml(redirect);
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="NEX Music" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${safeUrl}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImage}" />
  <meta http-equiv="refresh" content="0;url=${safeRedirect}" />
  <link rel="canonical" href="${safeRedirect}" />
</head>
<body style="margin:0;background:#020208;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">
  <p>Abriendo NEX Music… <a href="${safeRedirect}" style="color:#1db954">Continuar</a></p>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const base = appBase(req);
  const room = typeof req.query.room === 'string' ? req.query.room.trim().toUpperCase() : '';
  const cloud = typeof req.query.cloud === 'string' ? req.query.cloud.trim() : '';
  const shortCode = typeof req.query.p === 'string' ? req.query.p.trim() : '';

  let title = 'NEX Music';
  let description = 'Escuchá juntos · YouTube + Spotify · salas en vivo y listas globales.';
  let image = `${base}/api/og-image?title=${encodeURIComponent('NEX Music')}&subtitle=${encodeURIComponent('Escuchá juntos')}&kind=playlist`;
  let appTarget = `${base}/nex-music`;

  if (room && /^[A-Z0-9]{4,6}$/.test(room)) {
    title = `Unite a mi sala ${room} · NEX Music`;
    description = `Escuchá en vivo conmigo en NEX Music. Código: ${room}`;
    appTarget = `${base}/nex-music?room=${encodeURIComponent(room)}`;
    image = `${base}/api/og-image?title=${encodeURIComponent(`Sala ${room}`)}&subtitle=${encodeURIComponent('Unite en un tap')}&kind=room`;
  } else if (shortCode && /^[A-Za-z0-9]{6,12}$/.test(shortCode)) {
    const meta = await fetchShortShareMeta(shortCode);
    if (meta?.name) {
      title = `${meta.name} · NEX Music`;
      description = meta.owner_nickname
        ? `Lista de ${meta.owner_nickname} en NEX Music. Tocá para escuchar.`
        : 'Lista compartida en NEX Music. Tocá para escuchar.';
      image = meta.cover
        || `${base}/api/og-image?title=${encodeURIComponent(meta.name)}&subtitle=${encodeURIComponent(meta.owner_nickname || 'Lista compartida')}&kind=playlist`;
    } else {
      title = 'Lista compartida · NEX Music';
      description = 'Abrí esta lista en NEX Music y escuchá al toque.';
    }
    appTarget = `${base}/nex-music?p=${encodeURIComponent(shortCode)}`;
  } else if (cloud) {
    const meta = await fetchCloudMeta(cloud);
    if (meta?.name) {
      title = `${meta.name} · NEX Music`;
      description = meta.owner_nickname
        ? `Lista de ${meta.owner_nickname} en NEX Music. Tocá para escuchar.`
        : 'Lista compartida en NEX Music. Tocá para escuchar.';
      image = meta.cover
        || `${base}/api/og-image?title=${encodeURIComponent(meta.name)}&subtitle=${encodeURIComponent(meta.owner_nickname || 'Lista')}&kind=playlist`;
    } else {
      title = 'Lista compartida · NEX Music';
      description = 'Abrí esta lista en NEX Music y escuchá al toque.';
    }
    appTarget = `${base}/nex-music?cloud=${encodeURIComponent(cloud)}`;
  }

  const shareUrl =
    shortCode && /^[A-Za-z0-9]{6,12}$/.test(shortCode)
      ? `${base}/p/${shortCode}`
      : `${base}/share${req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`;

  if (!isBot(req.headers['user-agent'] || '')) {
    res.writeHead(302, { Location: appTarget, 'Cache-Control': 'public, max-age=60' });
    return res.end();
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).send(
    ogHtml({
      title,
      description,
      image,
      url: shareUrl,
      redirect: appTarget,
    }),
  );
}
