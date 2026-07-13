import type { Track } from '../types/music';

export function trackNeedsYoutubeResolution(track: Track): boolean {
  return track.service === 'spotify' || !track.videoId;
}

export async function resolveTrackForPlayback(track: Track): Promise<Track | null> {
  if (!trackNeedsYoutubeResolution(track)) return track;

  const searchQuery = `${track.title} ${track.artist}`.trim();
  if (!searchQuery) return null;

  try {
    const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
    if (!res.ok) return null;

    const data = await res.json();
    const first = data.results?.[0];
    if (!first?.id) return null;

    return {
      id: first.id,
      title: track.title || first.title,
      artist: track.artist || first.channelTitle,
      cover: track.cover || first.thumbnail,
      url: '',
      service: 'youtube',
      kind: first.kind ?? 'video',
      videoId: first.id,
    };
  } catch {
    return null;
  }
}
