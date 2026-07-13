import { useCallback, useEffect, useRef } from 'react';
import type { AudioPreset, NexAudioSettings } from './useNexAudioEnhance';
import { mapUiVolumeToPlayer } from './useNexAudioEnhance';

/** EQ gains (dB) per preset — FxSound-inspired colour. */
const PRESET_EQ: Record<AudioPreset, { bass: number; mid: number; treble: number }> = {
  flat: { bass: 0, mid: 0, treble: 0 },
  clear: { bass: -1, mid: 2.5, treble: 4 },
  bass: { bass: 7, mid: 0, treble: -1 },
  loud: { bass: 3.5, mid: 2, treble: 2.5 },
  club: { bass: 8, mid: 1.5, treble: 3.5 },
  night: { bass: -2, mid: 0, treble: -3.5 },
};

export type DspEngine = {
  ensureContext: () => AudioContext;
  attachElement: (el: HTMLMediaElement) => void;
  applySettings: (settings: NexAudioSettings, uiVolume: number) => void;
  setUiVolume: (uiVolume: number, settings: NexAudioSettings) => void;
  disconnect: () => void;
};

/**
 * Real output chain (FxSound-style): media → EQ → compressor → gain → 8D pan → speakers.
 * Requires crossOrigin media with CORS * (Piped proxy).
 */
export function createNexDspEngine(): DspEngine {
  let ctx: AudioContext | null = null;
  let source: MediaElementAudioSourceNode | null = null;
  let bass: BiquadFilterNode | null = null;
  let mid: BiquadFilterNode | null = null;
  let treble: BiquadFilterNode | null = null;
  let compressor: DynamicsCompressorNode | null = null;
  let makeup: GainNode | null = null;
  let master: GainNode | null = null;
  let panner: StereoPannerNode | null = null;
  let attachedEl: HTMLMediaElement | null = null;
  let spatialRaf: number | null = null;
  let spatialEnabled = false;
  let spatialSpeed = 0.18;

  const ensureGraph = () => {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (!bass) {
      bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 90;
      mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 0.9;
      treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 7500;
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -22;
      compressor.knee.value = 18;
      compressor.ratio.value = 10;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.22;
      makeup = ctx.createGain();
      master = ctx.createGain();
      panner = ctx.createStereoPanner();
      bass.connect(mid!);
      mid!.connect(treble!);
      treble!.connect(compressor!);
      compressor!.connect(makeup!);
      makeup!.connect(master!);
      master!.connect(panner!);
      panner!.connect(ctx.destination);
    }
    return ctx;
  };

  const stopSpatial = () => {
    if (spatialRaf != null) {
      cancelAnimationFrame(spatialRaf);
      spatialRaf = null;
    }
    if (panner) panner.pan.value = 0;
  };

  const tickSpatial = () => {
    if (!spatialEnabled || !panner || !ctx) {
      stopSpatial();
      return;
    }
    const t = ctx.currentTime;
    panner.pan.value = Math.sin(t * Math.PI * 2 * spatialSpeed) * 0.92;
    spatialRaf = requestAnimationFrame(tickSpatial);
  };

  const applySettings = (settings: NexAudioSettings, uiVolume: number) => {
    ensureGraph();
    if (!bass || !mid || !treble || !compressor || !makeup || !master || !panner) return;

    const power = Math.max(0, Math.min(100, settings.power)) / 100;
    const eq = PRESET_EQ[settings.preset] ?? PRESET_EQ.flat;
    const bassExtra = settings.boost ? power * 2.5 : 0;
    const trebleExtra = settings.boost ? power * 1.2 : 0;

    bass.gain.value = eq.bass + bassExtra + (settings.eqBass ?? 0);
    mid.gain.value = eq.mid + (settings.eqMid ?? 0);
    treble.gain.value = eq.treble + trebleExtra + (settings.eqTreble ?? 0);

    compressor.threshold.value = -18 - power * 10;
    compressor.ratio.value = 6 + power * 8;
    makeup.gain.value = 1 + power * 0.55 + (settings.boost ? 0.15 : 0);

    const ytVol = mapUiVolumeToPlayer(uiVolume, settings) / 100;
    // Extra DSP headroom — soft ceiling ~1.15 into compressor
    master.gain.value = Math.min(1.2, ytVol * (1 + power * 0.35));

    spatialEnabled = Boolean(settings.spatial8d);
    spatialSpeed = 0.12 + (settings.spatialSpeed ?? 40) / 100 * 0.35;
    if (spatialEnabled) {
      if (spatialRaf == null) tickSpatial();
    } else {
      stopSpatial();
    }
  };

  return {
    ensureContext: () => {
      const c = ensureGraph();
      if (c.state === 'suspended') void c.resume();
      return c;
    },
    attachElement: (el: HTMLMediaElement) => {
      ensureGraph();
      // createMediaElementSource may only be called once per HTMLMediaElement
      if (attachedEl === el && source) return;
      if (attachedEl && attachedEl !== el) {
        try {
          source?.disconnect();
        } catch {
          /* ignore */
        }
        source = null;
        attachedEl = null;
      }
      if (attachedEl === el) return;
      el.crossOrigin = 'anonymous';
      el.volume = 1;
      source = ctx!.createMediaElementSource(el);
      source.connect(bass!);
      attachedEl = el;
    },
    applySettings,
    setUiVolume: (uiVolume, settings) => applySettings(settings, uiVolume),
    disconnect: () => {
      stopSpatial();
      try {
        source?.disconnect();
      } catch {
        /* ignore */
      }
      source = null;
      attachedEl = null;
    },
  };
}

export function useNexDspEngine() {
  const engineRef = useRef<DspEngine | null>(null);
  if (!engineRef.current) engineRef.current = createNexDspEngine();

  useEffect(() => {
    return () => {
      engineRef.current?.disconnect();
    };
  }, []);

  const getEngine = useCallback(() => engineRef.current!, []);
  return { getEngine, engineRef };
}
