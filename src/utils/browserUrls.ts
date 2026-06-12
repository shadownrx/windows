export type SlidesMode = 'embed' | 'present';

export interface ResolvedUrl {
  /** URL shown in the address bar */
  displayUrl: string;
  /** URL loaded inside the iframe */
  iframeUrl: string;
  /** Human-readable page title hint */
  titleHint: string;
  contentType: 'slides' | 'docs' | 'sheets' | 'youtube' | 'generic';
  slidesMode?: SlidesMode;
}

const SLIDES_ID_RE = /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/;
const DOCS_ID_RE = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;
const SHEETS_ID_RE = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
const YOUTUBE_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;

function normalizeInput(raw: string): string {
  const input = raw.trim();
  if (!input) return '';

  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }

  if (/^(?!-)[A-Za-z0-9-]+(\.[a-z0-9]+)+\.[A-Za-z]{2,}(:[0-9]{1,5})?(\/.*)?$/.test(input)) {
    return `https://${input}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(input)}&igu=1`;
}

function slidesUrls(id: string, mode: SlidesMode): { iframeUrl: string; titleHint: string } {
  if (mode === 'present') {
    return {
      iframeUrl: `https://docs.google.com/presentation/d/${id}/present?rm=minimal`,
      titleHint: 'Google Slides — Presentación',
    };
  }
  return {
    iframeUrl: `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`,
    titleHint: 'Google Slides',
  };
}

/** Resolve a raw address into display + iframe URLs. */
export function resolveBrowserUrl(raw: string, options?: { slidesMode?: SlidesMode }): ResolvedUrl {
  const displayUrl = normalizeInput(raw);
  const slidesMode = options?.slidesMode ?? 'embed';

  if (!displayUrl) {
    return { displayUrl: '', iframeUrl: '', titleHint: 'Nueva pestaña', contentType: 'generic' };
  }

  const ytMatch = displayUrl.match(YOUTUBE_RE);
  if (ytMatch) {
    return {
      displayUrl,
      iframeUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0`,
      titleHint: 'YouTube',
      contentType: 'youtube',
    };
  }

  const slidesMatch = displayUrl.match(SLIDES_ID_RE);
  if (slidesMatch) {
    const canonical = `https://docs.google.com/presentation/d/${slidesMatch[1]}/edit`;
    const { iframeUrl, titleHint } = slidesUrls(slidesMatch[1], slidesMode);
    return {
      displayUrl: canonical,
      iframeUrl,
      titleHint,
      contentType: 'slides',
      slidesMode,
    };
  }

  const docsMatch = displayUrl.match(DOCS_ID_RE);
  if (docsMatch) {
    const id = docsMatch[1];
    return {
      displayUrl: `https://docs.google.com/document/d/${id}/edit`,
      iframeUrl: `https://docs.google.com/document/d/${id}/preview`,
      titleHint: 'Google Docs',
      contentType: 'docs',
    };
  }

  const sheetsMatch = displayUrl.match(SHEETS_ID_RE);
  if (sheetsMatch) {
    const id = sheetsMatch[1];
    return {
      displayUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
      iframeUrl: `https://docs.google.com/spreadsheets/d/${id}/preview?rm=minimal`,
      titleHint: 'Google Sheets',
      contentType: 'sheets',
    };
  }

  try {
    const hostname = new URL(displayUrl).hostname.replace(/^www\./, '');
    return {
      displayUrl,
      iframeUrl: displayUrl,
      titleHint: hostname,
      contentType: 'generic',
    };
  } catch {
    return {
      displayUrl,
      iframeUrl: displayUrl,
      titleHint: 'Página web',
      contentType: 'generic',
    };
  }
}

export function isGoogleSlides(url: string): boolean {
  return SLIDES_ID_RE.test(url);
}

export function getSlidesPresentUrl(url: string): string | null {
  const match = url.match(SLIDES_ID_RE);
  if (!match) return null;
  return `https://docs.google.com/presentation/d/${match[1]}/present?rm=minimal`;
}

export function getSlidesEmbedUrl(url: string): string | null {
  const match = url.match(SLIDES_ID_RE);
  if (!match) return null;
  return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
}

const BLOCKED_SITES = [
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'steamcommunity.com',
  'counter-strike.net',
];

export function isBlockedByIframe(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return BLOCKED_SITES.some((site) => lower.includes(site));
}

export function getFavicon(url: string): string | null {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}
