import { useCallback, useEffect, useRef, useState } from 'react';

export type AudioPreset = 'flat' | 'bass' | 'loud' | 'night';

export interface NexAudioSettings {
  hd: boolean;
  crossfadeSec: number;
  normalize: boolean;
  boost: boolean;
  preset: AudioPreset;
}

const STORAGE_KEY = 'nexMusicAudioEnhance';

export const DEFAULT_AUDIO_SETTINGS: NexAudioSettings = {
  hd: true,
  crossfadeSec: 3,
  normalize: true,
  boost: true,
  preset: 'loud',
};

export function loadAudioSettings(): NexAudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
    return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(settings: NexAudioSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

/** Curva de volumen más agradable + boost opcional (YouTube suele sonar bajo). */
export function mapUiVolumeToPlayer(uiVolume: number, settings: NexAudioSettings): number {
  const v = Math.max(0, Math.min(100, uiVolume)) / 100;
  let curved = Math.pow(v, settings.boost ? 0.65 : 0.85);

  if (settings.preset === 'bass' || settings.preset === 'loud') {
    curved = Math.min(1, curved * 1.08);
  } else if (settings.preset === 'night') {
    curved = curved * 0.72;
  }

  if (settings.normalize) {
    curved = Math.min(1, Math.max(0.12, curved));
  }

  return Math.round(curved * 100);
}

type YtPlayerLike = {
  setVolume?: (n: number) => void;
  getVolume?: () => number;
  setPlaybackQuality?: (q: string) => void;
  getAvailableQualityLevels?: () => string[];
  loadVideoById?: (opts: string | { videoId: string; suggestedQuality?: string }) => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
};

export function applyHdQuality(player: YtPlayerLike | null | undefined) {
  if (!player?.setPlaybackQuality) return;
  try {
    const levels = player.getAvailableQualityLevels?.() ?? [];
    const preferred = ['highres', 'hd2160', 'hd1440', 'hd1080', 'hd720'];
    const pick = preferred.find((q) => levels.includes(q)) || levels[0];
    if (pick) player.setPlaybackQuality(pick);
    else player.setPlaybackQuality('hd1080');
  } catch {
    try {
      player.setPlaybackQuality?.('hd1080');
    } catch {
      /* ignore */
    }
  }
}

export function useNexAudioEnhance() {
  const [settings, setSettingsState] = useState<NexAudioSettings>(() => loadAudioSettings());
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const fadeTimerRef = useRef<number | null>(null);
  const fadingRef = useRef(false);

  useEffect(() => {
    saveAudioSettings(settings);
  }, [settings]);

  const setSettings = useCallback((patch: Partial<NexAudioSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyVolume = useCallback((player: YtPlayerLike | null | undefined, uiVolume: number) => {
    if (!player?.setVolume) return;
    const mapped = mapUiVolumeToPlayer(uiVolume, settingsRef.current);
    player.setVolume(mapped);
  }, []);

  const stopFade = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    fadingRef.current = false;
  }, []);

  const fadeVolume = useCallback(
    (player: YtPlayerLike | null | undefined, from: number, to: number, ms: number) =>
      new Promise<void>((resolve) => {
        if (!player?.setVolume || ms <= 0) {
          player?.setVolume?.(to);
          resolve();
          return;
        }
        stopFade();
        fadingRef.current = true;
        const steps = Math.max(8, Math.floor(ms / 40));
        let i = 0;
        fadeTimerRef.current = window.setInterval(() => {
          i += 1;
          const t = i / steps;
          const vol = Math.round(from + (to - from) * t);
          player.setVolume?.(vol);
          if (i >= steps) {
            stopFade();
            player.setVolume?.(to);
            resolve();
          }
        }, ms / steps);
      }),
    [stopFade],
  );

  const crossfadeToNext = useCallback(
    async (
      player: YtPlayerLike | null | undefined,
      uiVolume: number,
      loadNext: () => void | Promise<void>,
    ) => {
      const sec = settingsRef.current.crossfadeSec;
      const target = mapUiVolumeToPlayer(uiVolume, settingsRef.current);
      if (!player?.setVolume || sec <= 0) {
        await loadNext();
        applyVolume(player, uiVolume);
        applyHdQuality(player);
        return;
      }

      const current = player.getVolume?.() ?? target;
      await fadeVolume(player, current, 0, (sec * 1000) / 2);
      await loadNext();
      applyHdQuality(player);
      player.playVideo?.();
      await fadeVolume(player, 0, target, (sec * 1000) / 2);
    },
    [applyVolume, fadeVolume],
  );

  return {
    settings,
    setSettings,
    applyVolume,
    applyHdQuality,
    crossfadeToNext,
    stopFade,
    mapVolume: (ui: number) => mapUiVolumeToPlayer(ui, settings),
  };
}
