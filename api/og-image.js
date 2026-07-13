/**
 * GET /api/og-image?title=&subtitle=&kind=room|playlist
 * SVG Open Graph image (no @vercel/og dependency).
 */
function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const title = esc((req.query.title || 'NEX Music').toString().slice(0, 60));
  const subtitle = esc((req.query.subtitle || 'Escuchá juntos').toString().slice(0, 80));
  const kind = (req.query.kind || 'playlist').toString();
  const accent = kind === 'room' ? '#60cdff' : '#1db954';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="100%" stop-color="#0d1f14"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1040" cy="120" r="220" fill="${accent}" fill-opacity="0.18"/>
  <circle cx="160" cy="520" r="180" fill="${accent}" fill-opacity="0.12"/>
  <text x="80" y="120" fill="${accent}" font-family="Arial, sans-serif" font-size="36" font-weight="700">NEX MUSIC</text>
  <text x="80" y="300" fill="#ffffff" font-family="Arial, sans-serif" font-size="64" font-weight="800">${title}</text>
  <text x="80" y="380" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="32">${subtitle}</text>
  <text x="80" y="560" fill="rgba(255,255,255,0.45)" font-family="Arial, sans-serif" font-size="24">anex-os.vercel.app/nex-music</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(svg);
}
