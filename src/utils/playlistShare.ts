import type { Playlist, Track } from '../types/music';

/** Compact hash payload: [name, [[id, title, artist, cover, videoId], ...]] */
export type CompactPlaylistPayload = [string, Array<[string, string, string, string, string | undefined]>];

export function encodePlaylistShareCode(playlist: Pick<Playlist, 'name' | 'tracks'>): string {
  const compact: CompactPlaylistPayload = [
    playlist.name,
    playlist.tracks.map((tr) => [
      tr.id,
      tr.title,
      tr.artist,
      tr.cover,
      tr.videoId,
    ]),
  ];
  return btoa(encodeURIComponent(JSON.stringify(compact)));
}

export function buildPlaylistHashShareUrl(playlist: Pick<Playlist, 'name' | 'tracks'>): string {
  const code = encodePlaylistShareCode(playlist);
  const slug = encodeURIComponent(playlist.name.toLowerCase().replace(/\s+/g, '-'));
  const path = typeof window !== 'undefined' && window.location.pathname.includes('nex-music')
    ? window.location.pathname
    : '/nex-music';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://anex-os.vercel.app';
  return `${origin}${path}#${slug}/${code}`;
}

export function decodePlaylistShareCode(code: string): Playlist | null {
  try {
    const decoded = JSON.parse(decodeURIComponent(atob(code)));
    if (Array.isArray(decoded)) {
      return {
        id: Date.now().toString(),
        name: decoded[0],
        tracks: (decoded[1] || []).map((tr: unknown[]) => ({
          id: String(tr[0]),
          title: String(tr[1]),
          artist: String(tr[2] ?? ''),
          cover: String(tr[3] ?? ''),
          url: '',
          service: 'youtube' as const,
          kind: 'video' as const,
          videoId: tr[4] ? String(tr[4]) : undefined,
        })),
        createdAt: Date.now(),
        isPrivate: false,
        ownerName: 'Anonymous',
        votes: [],
      };
    }

    return {
      id: Date.now().toString(),
      name: decoded.name || decoded.n,
      tracks: (decoded.tracks || decoded.t || []).map((tr: Record<string, unknown>) => ({
        id: String(tr.id || tr.i),
        title: String(tr.title || tr.ti),
        artist: String(tr.artist || tr.a || ''),
        cover: String(tr.cover || tr.c || ''),
        url: String(tr.url || ''),
        service: (tr.service as Track['service']) || 'youtube',
        kind: (tr.kind as Track['kind']) || 'video',
        videoId: tr.videoId || tr.v ? String(tr.videoId || tr.v) : undefined,
      })),
      createdAt: Date.now(),
      isPrivate: Boolean(decoded.isPrivate),
      ownerName: String(decoded.ownerName || decoded.o || 'Anonymous'),
      votes: Array.isArray(decoded.votes) ? decoded.votes : [],
    };
  } catch {
    return null;
  }
}

export function extractPlaylistShareCodeFromInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.includes('#')) {
      const hash = trimmed.split('#')[1] || '';
      const parts = hash.split('/');
      return parts[parts.length - 1] || null;
    }
    const url = new URL(trimmed, 'https://anex-os.vercel.app');
    const playlist = url.searchParams.get('playlist');
    if (playlist) return playlist;
  } catch {
    /* not a URL — treat as raw code */
  }
  return trimmed;
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{4,6}$/i.test(code.trim());
}
