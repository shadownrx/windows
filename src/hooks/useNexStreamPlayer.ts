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

async function resolveStream(videoId: string, signal?: AbortSignal): Promise<StreamResolveResult> {
  const res = await fetch(`/api/youtube/search?stream=${encodeURIComponent(videoId)}`, { signal });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Stream HTTP ${res.status}`);
  }
  return res.json() as Promise<StreamResolveResult>;
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
  const activeVideoIdRef = useRef<string | null>(null);
  const [mode, setMode] = useState<PlaybackMode>('idle');
  const [dspReady, setDspReady] = useState(false);
  const progressTimerRef = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const ensureMedia = useCallback(() => {
    if (mediaRef.current) return mediaRef.current;
    const el = document.createElement('video');
    el.setAttribute('playsinline', '1');
    el.setAttribute('webkit-playsinline', '1');
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    el.style.cssText =
      'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9px;top:-9px;';
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
      if (!el) return;
      const dur = el.duration;
      if (Number.isFinite(dur) && dur > 0) {
        optsRef.current.onTime(el.currentTime, dur);
      }
    }, 500);
  }, [stopProgress]);

  const pauseYtSafe = () => {
    /* caller mutes YT when DSP wins */
  };

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
    activeVideoIdRef.current = null;
    setDspReady(false);
  }, [stopProgress]);

  const playVideoId = useCallback(
    async (videoId: string): Promise<boolean> => {
      const settings = optsRef.current.getSettings();
      if (settings.preferDsp === false) {
        stopDsp();
        setMode('youtube');
        return false;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const resolved = await resolveStream(videoId, ac.signal);
        if (ac.signal.aborted) return false;

        const el = ensureMedia();
        const engine = optsRef.current.getEngine();
        engine.ensureContext();
        engine.attachElement(el);
        engine.applySettings(optsRef.current.getSettings(), optsRef.current.getUiVolume());

        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error('media error'));
          };
          const cleanup = () => {
            el.removeEventListener('canplay', onCanPlay);
            el.removeEventListener('error', onError);
          };
          el.addEventListener('canplay', onCanPlay, { once: true });
          el.addEventListener('error', onError, { once: true });
          el.src = resolved.url;
          el.load();
        });

        if (ac.signal.aborted) return false;

        await el.play();
        activeVideoIdRef.current = videoId;
        setDspReady(true);
        setMode('dsp');
        startProgress();
        pauseYtSafe();
        optsRef.current.onPlayingChange(true);
        if (Number.isFinite(el.duration) && el.duration > 0) {
          optsRef.current.onTime(el.currentTime, el.duration);
        }
        return true;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return false;
        console.warn('[NEX DSP] stream fallback → YouTube', err);
        stopDsp();
        setMode('youtube');
        return false;
      }
    },
    [ensureMedia, startProgress, stopDsp],
  );

  const play = useCallback(async () => {
    const el = mediaRef.current;
    if (!el || mode !== 'dsp') return false;
    optsRef.current.getEngine().ensureContext();
    await el.play();
    startProgress();
    return true;
  }, [mode, startProgress]);

  const pause = useCallback(() => {
    mediaRef.current?.pause();
    stopProgress();
  }, [stopProgress]);

  const seekTo = useCallback((seconds: number) => {
    const el = mediaRef.current;
    if (!el || mode !== 'dsp') return;
    el.currentTime = Math.max(0, seconds);
  }, [mode]);

  const getCurrentTime = useCallback(() => mediaRef.current?.currentTime ?? 0, []);
  const getDuration = useCallback(() => mediaRef.current?.duration ?? 0, []);

  const syncSettings = useCallback(() => {
    if (mode !== 'dsp') return;
    optsRef.current.getEngine().applySettings(optsRef.current.getSettings(), optsRef.current.getUiVolume());
  }, [mode]);

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
