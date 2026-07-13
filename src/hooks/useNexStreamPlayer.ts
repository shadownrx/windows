import { useCallback, useEffect, useRef, useState } from 'react';
import type { NexAudioSettings } from './useNexAudioEnhance';
import type { DspEngine } from './useNexDspEngine';

export type StreamResolveResult = {
  url: string;
  mimeType: string;
  quality: string;
  kind: 'audio' | 'muxed';
  title?: string;
  duration?: number;
  source: string;
};

export type PlaybackMode = 'idle' | 'dsp' | 'youtube';
export type PlayVideoResult = 'ok' | 'abort' | 'fail';

const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.ducks.party',
  'https://pipedapi.owo.si',
  'https://pipedapi.leptons.xyz',
];

type PipedStream = {
  url?: string;
  bitrate?: number;
  mimeType?: string;
  quality?: string;
  videoOnly?: boolean;
};

function pickFromPiped(data: {
  title?: string;
  duration?: number;
  audioStreams?: PipedStream[];
  videoStreams?: PipedStream[];
}, source: string): StreamResolveResult | null {
  const audios = (data.audioStreams || [])
    .filter((s) => s.url && s.videoOnly !== true)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  if (audios[0]?.url) {
    return {
      url: audios[0].url,
      mimeType: audios[0].mimeType || 'audio/mp4',
      quality: audios[0].quality || 'audio',
      kind: 'audio',
      title: data.title,
      duration: data.duration,
      source,
    };
  }
  const muxed = (data.videoStreams || [])
    .filter(
      (s) =>
        s.url &&
        s.videoOnly === false &&
        typeof s.mimeType === 'string' &&
        s.mimeType.includes('mp4') &&
        !String(s.quality || '').toUpperCase().includes('LBRY'),
    )
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  if (muxed[0]?.url) {
    return {
      url: muxed[0].url,
      mimeType: muxed[0].mimeType || 'video/mp4',
      quality: muxed[0].quality || '360p',
      kind: 'muxed',
      title: data.title,
      duration: data.duration,
      source,
    };
  }
  // Last resort: any muxed with url (incl. LBRY mirrors — rare but playable)
  const any = (data.videoStreams || []).find(
    (s) => s.url && s.videoOnly === false && String(s.mimeType || '').includes('mp4'),
  );
  if (any?.url) {
    return {
      url: any.url,
      mimeType: any.mimeType || 'video/mp4',
      quality: any.quality || 'mirror',
      kind: 'muxed',
      title: data.title,
      duration: data.duration,
      source,
    };
  }
  return null;
}

async function resolveFromPipedClient(videoId: string, signal: AbortSignal): Promise<StreamResolveResult> {
  const errors: string[] = [];
  const tasks = PIPED_INSTANCES.map(async (base) => {
    const res = await fetch(`${base}/streams/${encodeURIComponent(videoId)}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      errors.push(`${base}:${res.status}`);
      throw new Error(`piped ${res.status}`);
    }
    const data = await res.json();
    const picked = pickFromPiped(data, base);
    if (!picked) {
      errors.push(`${base}:empty`);
      throw new Error('empty');
    }
    return picked;
  });
  try {
    return await Promise.any(tasks);
  } catch {
    throw new Error(errors.slice(0, 3).join(',') || 'piped fail');
  }
}

async function resolveFromApi(videoId: string, signal: AbortSignal): Promise<StreamResolveResult> {
  const res = await fetch(`/api/youtube/search?stream=${encodeURIComponent(videoId)}`, { signal });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Stream HTTP ${res.status}`);
  }
  return res.json() as Promise<StreamResolveResult>;
}

async function resolveFromMusicServer(videoId: string, signal: AbortSignal): Promise<StreamResolveResult | null> {
  const base = (import.meta.env.VITE_MUSIC_SERVER_URL as string | undefined)?.replace(/\/$/, '');
  if (!base) return null;
  const res = await fetch(`${base}/stream/${encodeURIComponent(videoId)}`, { signal });
  if (!res.ok) return null;
  return res.json() as Promise<StreamResolveResult>;
}

async function resolveStream(videoId: string, signal?: AbortSignal): Promise<StreamResolveResult> {
  const ac = signal ?? new AbortController().signal;
  // 1) Optional self-hosted resolver (yt-dlp etc.)
  try {
    const custom = await resolveFromMusicServer(videoId, ac);
    if (custom?.url) return custom;
  } catch {
    /* ignore */
  }
  // 2) Browser → Piped (same network as playback; best chance when instance works)
  try {
    return await resolveFromPipedClient(videoId, ac);
  } catch {
    /* fall through */
  }
  // 3) Our Vercel API (same Piped backends, cached)
  return resolveFromApi(videoId, ac);
}

function waitForMedia(el: HTMLMediaElement, signal: AbortSignal, timeoutMs = 14000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      resolve();
      return;
    }

    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(el.error?.message || 'media error'));
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('media timeout'));
    }, timeoutMs);

    const cleanup = () => {
      window.clearTimeout(timer);
      el.removeEventListener('canplay', onReady);
      el.removeEventListener('loadeddata', onReady);
      el.removeEventListener('error', onError);
      signal.removeEventListener('abort', onAbort);
    };

    el.addEventListener('canplay', onReady);
    el.addEventListener('loadeddata', onReady);
    el.addEventListener('error', onError);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Hidden media element + DSP. Falls back to caller (YouTube iframe) on failure.
 */
export function useNexStreamPlayer(opts: {
  getEngine: () => DspEngine;
  getSettings: () => NexAudioSettings;
  getUiVolume: () => number;
  onEnded: () => void;
  onPlayingChange: (playing: boolean) => void;
  onTime: (current: number, duration: number) => void;
}) {
  const mediaRef = useRef<HTMLVideoElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const modeRef = useRef<PlaybackMode>('idle');
  const [mode, setModeState] = useState<PlaybackMode>('idle');
  const [dspReady, setDspReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const setMode = useCallback((next: PlaybackMode) => {
    modeRef.current = next;
    setModeState(next);
  }, []);

  const ensureMedia = useCallback(() => {
    if (mediaRef.current && document.body.contains(mediaRef.current)) return mediaRef.current;
    const el = document.createElement('video');
    el.setAttribute('playsinline', '1');
    el.setAttribute('webkit-playsinline', '1');
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    el.muted = false;
    el.style.cssText =
      'position:fixed;width:2px;height:2px;opacity:0.01;pointer-events:none;left:0;top:0;z-index:-1;';
    el.addEventListener('ended', () => optsRef.current.onEnded());
    el.addEventListener('play', () => optsRef.current.onPlayingChange(true));
    el.addEventListener('pause', () => {
      if (!el.ended) optsRef.current.onPlayingChange(false);
    });
    document.body.appendChild(el);
    mediaRef.current = el;
    return el;
  }, []);

  const stopProgress = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const startProgress = useCallback(() => {
    stopProgress();
    progressTimerRef.current = window.setInterval(() => {
      const el = mediaRef.current;
      if (!el || modeRef.current !== 'dsp') return;
      const dur = el.duration;
      if (Number.isFinite(dur) && dur > 0) {
        optsRef.current.onTime(el.currentTime, dur);
      }
    }, 500);
  }, [stopProgress]);

  const stopDsp = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    stopProgress();
    const el = mediaRef.current;
    if (el) {
      try {
        el.pause();
        el.removeAttribute('src');
        el.load();
      } catch {
        /* ignore */
      }
    }
    setDspReady(false);
  }, [stopProgress]);

  const playVideoId = useCallback(
    async (videoId: string): Promise<PlayVideoResult> => {
      const settings = optsRef.current.getSettings();
      if (settings.preferDsp === false) {
        stopDsp();
        setMode('youtube');
        setLastError('preferDsp off');
        return 'fail';
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const resolved = await resolveStream(videoId, ac.signal);
        if (ac.signal.aborted) return 'abort';

        const el = ensureMedia();
        const engine = optsRef.current.getEngine();
        engine.ensureContext();
        engine.attachElement(el);

        el.crossOrigin = 'anonymous';
        el.src = resolved.url;
        el.load();

        await waitForMedia(el, ac.signal);
        if (ac.signal.aborted) return 'abort';

        engine.ensureContext();
        engine.applySettings(optsRef.current.getSettings(), optsRef.current.getUiVolume());

        await el.play();
        if (ac.signal.aborted) {
          try {
            el.pause();
          } catch {
            /* ignore */
          }
          return 'abort';
        }

        setDspReady(true);
        setMode('dsp');
        setLastError(null);
        startProgress();
        optsRef.current.onPlayingChange(true);
        if (Number.isFinite(el.duration) && el.duration > 0) {
          optsRef.current.onTime(el.currentTime, el.duration);
        }
        engine.applySettings(optsRef.current.getSettings(), optsRef.current.getUiVolume());
        return 'ok';
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return 'abort';
        const msg = (err as Error)?.message || 'stream fail';
        console.warn('[NEX DSP] stream fallback → YouTube', msg);
        stopDsp();
        setMode('youtube');
        setLastError(msg);
        return 'fail';
      }
    },
    [ensureMedia, setMode, startProgress, stopDsp],
  );

  const play = useCallback(async () => {
    const el = mediaRef.current;
    if (!el || modeRef.current !== 'dsp') return false;
    optsRef.current.getEngine().ensureContext();
    await el.play();
    startProgress();
    return true;
  }, [startProgress]);

  const pause = useCallback(() => {
    mediaRef.current?.pause();
    stopProgress();
  }, [stopProgress]);

  const seekTo = useCallback((seconds: number) => {
    const el = mediaRef.current;
    if (!el || modeRef.current !== 'dsp') return;
    el.currentTime = Math.max(0, seconds);
  }, []);

  const getCurrentTime = useCallback(() => mediaRef.current?.currentTime ?? 0, []);
  const getDuration = useCallback(() => mediaRef.current?.duration ?? 0, []);

  const syncSettings = useCallback(() => {
    if (modeRef.current !== 'dsp') return;
    optsRef.current.getEngine().applySettings(optsRef.current.getSettings(), optsRef.current.getUiVolume());
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      stopProgress();
      const el = mediaRef.current;
      if (el) {
        try {
          el.pause();
          el.remove();
        } catch {
          /* ignore */
        }
        mediaRef.current = null;
      }
    };
  }, [stopProgress]);

  return {
    mode,
    dspReady,
    lastError,
    playVideoId,
    play,
    pause,
    seekTo,
    getCurrentTime,
    getDuration,
    stopDsp,
    syncSettings,
    isDspActive: mode === 'dsp' && dspReady,
  };
}
