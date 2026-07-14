import React, { useCallback, useState } from 'react';
import DeckPanel from './virtual-dj/DeckPanel';
import LibraryPanel from './virtual-dj/LibraryPanel';
import MixerPanel from './virtual-dj/MixerPanel';
import { useDjDeck } from './virtual-dj/useDjDeck';
import { useDjMaster } from './virtual-dj/useDjMaster';
import type { DjTrackRef } from './virtual-dj/types';

const ACCENT_A = '#ff6b4a';
const ACCENT_B = '#2ec4b6';

const VirtualDj: React.FC = () => {
  const {
    ensureMaster,
    crossfader,
    masterVolume,
    setCrossfader,
    setMasterVolume,
    cuePreview,
    setCuePreview,
  } = useDjMaster();

  const getMaster = useCallback(() => ensureMaster(), [ensureMaster]);
  const deckA = useDjDeck('A', getMaster);
  const deckB = useDjDeck('B', getMaster);
  const [masterDeck, setMasterDeck] = useState<'A' | 'B'>('A');

  const onLoad = useCallback(
    (deck: 'A' | 'B', track: DjTrackRef) => {
      void (deck === 'A' ? deckA.loadTrack(track) : deckB.loadTrack(track));
    },
    [deckA, deckB],
  );

  const syncSlave = useCallback(() => {
    if (masterDeck === 'A') deckB.syncRateFrom(deckA.state.rate);
    else deckA.syncRateFrom(deckB.state.rate);
  }, [deckA, deckB, masterDeck]);

  return (
    <div className="vdj-root">
      <header className="vdj-header">
        <div className="vdj-brand">
          <span className="vdj-mark">NEX</span>
          <div>
            <div className="vdj-title">VIRTUAL DJ</div>
            <div className="vdj-sub">Dual platter · YouTube · Web Audio console</div>
          </div>
        </div>
        <div className="vdj-header-right">
          <span className={`vdj-live ${deckA.state.playing || deckB.state.playing ? 'on' : ''}`}>
            ● LIVE
          </span>
        </div>
      </header>

      <div className="vdj-main">
        <LibraryPanel onLoad={onLoad} />

        <div className="vdj-booth">
          <div className="vdj-chassis">
            <DeckPanel
              deck={deckA}
              label="A"
              accent={ACCENT_A}
              isMaster={masterDeck === 'A'}
              onMakeMaster={() => setMasterDeck('A')}
              cuePreview={cuePreview.A}
              onCuePreview={(enabled) => setCuePreview('A', enabled)}
            />
            <MixerPanel
              crossfader={crossfader}
              masterVolume={masterVolume}
              onCrossfader={setCrossfader}
              onMasterVolume={setMasterVolume}
              onSyncSlave={syncSlave}
              masterDeck={masterDeck}
              channelA={deckA}
              channelB={deckB}
            />
            <DeckPanel
              deck={deckB}
              label="B"
              accent={ACCENT_B}
              isMaster={masterDeck === 'B'}
              onMakeMaster={() => setMasterDeck('B')}
              cuePreview={cuePreview.B}
              onCuePreview={(enabled) => setCuePreview('B', enabled)}
              mirror
            />
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@500;600&display=swap');

        .vdj-root {
          --vdj-bg: #05070a;
          --vdj-metal: #12171f;
          --vdj-metal-2: #1a222e;
          --vdj-line: rgba(220, 235, 255, 0.1);
          --vdj-text: #eef4fa;
          --vdj-muted: rgba(190, 210, 230, 0.55);
          --vdj-orange: #ff6b4a;
          --vdj-teal: #2ec4b6;
          height: 100%;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(ellipse 50% 35% at 12% -5%, rgba(255, 107, 74, 0.16), transparent 55%),
            radial-gradient(ellipse 45% 30% at 88% 0%, rgba(46, 196, 182, 0.14), transparent 50%),
            linear-gradient(180deg, #0a0e14 0%, var(--vdj-bg) 40%);
          color: var(--vdj-text);
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        .vdj-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid var(--vdj-line);
          background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent);
          flex-shrink: 0;
        }
        .vdj-brand { display: flex; align-items: center; gap: 12px; }
        .vdj-mark {
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 0.16em;
          font-size: 18px;
          padding: 6px 10px 4px;
          border: 1px solid rgba(255, 107, 74, 0.65);
          color: var(--vdj-orange);
          background: rgba(255, 107, 74, 0.08);
        }
        .vdj-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          letter-spacing: 0.08em;
          line-height: 1;
        }
        .vdj-sub { font-size: 11px; color: var(--vdj-muted); margin-top: 2px; }
        .vdj-live {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: var(--vdj-muted);
        }
        .vdj-live.on { color: #ff5a5a; text-shadow: 0 0 12px rgba(255, 90, 90, 0.55); }

        .vdj-main {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: 260px 1fr;
        }

        .vdj-booth {
          min-height: 0;
          overflow: auto;
          padding: 12px;
          display: flex;
        }
        .vdj-chassis {
          flex: 1;
          display: grid;
          grid-template-columns: minmax(280px, 1fr) 220px minmax(280px, 1fr);
          gap: 12px;
          padding: 14px;
          border-radius: 18px;
          background:
            linear-gradient(145deg, rgba(255,255,255,0.04), transparent 40%),
            linear-gradient(180deg, #161c26, #0c1016 70%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.06),
            0 20px 50px rgba(0,0,0,0.45);
          min-height: 0;
        }

        /* ── Library ── */
        .vdj-lib {
          border-right: 1px solid var(--vdj-line);
          background: rgba(8, 12, 18, 0.92);
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .vdj-lib-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 14px 8px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 0.14em;
        }
        .vdj-dsp-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid var(--vdj-line);
          letter-spacing: 0.04em;
          font-weight: 600;
        }
        .vdj-dsp-pill.ok { color: var(--vdj-teal); border-color: rgba(46,196,182,0.45); }
        .vdj-dsp-pill.warn { color: #ff9f1c; border-color: rgba(255,159,28,0.4); }
        .vdj-lib-search {
          display: flex;
          gap: 6px;
          padding: 0 12px 8px;
        }
        .vdj-lib-search input {
          flex: 1;
          background: #05070a;
          border: 1px solid var(--vdj-line);
          color: var(--vdj-text);
          border-radius: 6px;
          padding: 9px 10px;
          font-size: 13px;
          outline: none;
          font-family: inherit;
        }
        .vdj-lib-search input:focus { border-color: rgba(46,196,182,0.5); }
        .vdj-lib-note, .vdj-lib-error, .vdj-lib-empty {
          padding: 0 14px 10px;
          font-size: 11px;
          color: var(--vdj-muted);
          line-height: 1.45;
        }
        .vdj-lib-error { color: var(--vdj-orange); }
        .vdj-lib-note code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          background: rgba(255,255,255,0.06);
          padding: 1px 4px;
          border-radius: 3px;
        }
        .vdj-lib-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 8px 12px;
        }
        .vdj-lib-row {
          display: grid;
          grid-template-columns: 42px 1fr auto auto;
          gap: 8px;
          align-items: center;
          padding: 8px;
          border-radius: 8px;
        }
        .vdj-lib-row:hover { background: rgba(255,255,255,0.04); }
        .vdj-lib-row img, .vdj-lib-ph {
          width: 42px;
          height: 42px;
          border-radius: 6px;
          object-fit: cover;
          background: #15202b;
        }
        .vdj-lib-title {
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vdj-lib-ch { font-size: 11px; color: var(--vdj-muted); }

        /* ── Deck ── */
        .vdj-deck {
          background: linear-gradient(180deg, var(--vdj-metal-2), var(--vdj-metal));
          border: 1px solid var(--vdj-line);
          border-radius: 14px;
          padding: 12px;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .vdj-deck-head {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: center;
        }
        .vdj-deck-badge {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 2px solid var(--a);
          color: var(--a);
          background: color-mix(in srgb, var(--a) 14%, transparent);
          line-height: 1;
          padding-top: 2px;
        }
        .vdj-track-title {
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .vdj-track-artist { font-size: 11px; color: var(--vdj-muted); }
        .vdj-deck-leds { display: flex; gap: 4px; }
        .vdj-led {
          border: 1px solid var(--vdj-line);
          background: #0a0e14;
          color: var(--vdj-muted);
          border-radius: 4px;
          padding: 5px 7px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
        }
        .vdj-led.on {
          color: #fff;
          border-color: var(--vdj-orange);
          background: rgba(255, 107, 74, 0.25);
          box-shadow: 0 0 10px rgba(255, 107, 74, 0.35);
        }
        .vdj-led.on.teal {
          border-color: var(--vdj-teal);
          background: rgba(46, 196, 182, 0.22);
          box-shadow: 0 0 10px rgba(46, 196, 182, 0.35);
        }

        .vdj-wave-wrap {
          position: relative;
          height: 64px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--vdj-line);
          background: #05080c;
        }
        .vdj-wave-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(5, 8, 12, 0.78);
          font-size: 12px;
          color: var(--vdj-muted);
          padding: 12px;
          text-align: center;
        }

        .vdj-deck-body {
          display: grid;
          grid-template-columns: 1fr 44px;
          gap: 8px;
          align-items: center;
          flex: 1;
        }
        .vdj-deck.mirror .vdj-deck-body {
          grid-template-columns: 44px 1fr;
        }
        .vdj-deck.mirror .vdj-platter-col { order: 2; }
        .vdj-deck.mirror .vdj-pitch-col { order: 1; }

        .vdj-platter-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .vdj-pitch-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          height: 100%;
          min-height: 200px;
        }
        .vdj-fader-cap {
          font-size: 9px;
          letter-spacing: 0.12em;
          color: var(--vdj-muted);
          font-weight: 700;
        }

        /* ── Platter ── */
        .vdj-platter {
          width: min(100%, 250px);
          aspect-ratio: 1;
          cursor: crosshair;
          user-select: none;
          position: relative;
        }
        .vdj-platter-chassis {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background:
            radial-gradient(circle at 35% 30%, rgba(255,255,255,0.08), transparent 40%),
            radial-gradient(circle at 50% 50%, #1c2430, #070a0e 70%);
          border: 3px solid #2a3340;
          box-shadow:
            inset 0 0 30px rgba(0,0,0,0.65),
            0 8px 24px rgba(0,0,0,0.5),
            0 0 0 1px rgba(255,255,255,0.05);
          position: relative;
          display: grid;
          place-items: center;
        }
        .vdj-platter-ring {
          position: absolute;
          inset: 4%;
          width: 92%;
          height: 92%;
          pointer-events: none;
          z-index: 3;
        }
        .vdj-platter-progress {
          filter: drop-shadow(0 0 4px var(--accent));
          transition: stroke-dasharray 0.08s linear;
        }
        .vdj-platter-disc {
          width: 78%;
          height: 78%;
          border-radius: 50%;
          position: relative;
          z-index: 1;
          will-change: transform;
          background: #0a0c10;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
        }
        .vdj-platter-grooves {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background:
            repeating-radial-gradient(
              circle at center,
              transparent 0,
              transparent 2px,
              rgba(255,255,255,0.035) 2px,
              rgba(255,255,255,0.035) 3px
            );
          opacity: 0.9;
        }
        .vdj-platter-label {
          position: absolute;
          inset: 28%;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid color-mix(in srgb, var(--accent) 55%, #333);
          box-shadow: 0 0 0 4px rgba(0,0,0,0.45);
          background: #111;
        }
        .vdj-platter-label img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
        }
        .vdj-platter-empty {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          background: radial-gradient(circle, color-mix(in srgb, var(--accent) 25%, #151515), #0a0a0a);
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px;
          color: color-mix(in srgb, var(--accent) 80%, white);
          letter-spacing: 0.05em;
        }
        .vdj-platter-spindle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 12%;
          height: 12%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #ddd, #666 55%, #222);
          box-shadow: 0 1px 3px rgba(0,0,0,0.6);
          z-index: 2;
        }
        .vdj-platter-tonearm {
          position: absolute;
          top: 8%;
          right: 10%;
          width: 4px;
          height: 38%;
          background: linear-gradient(180deg, #8a93a0, #3a4250);
          border-radius: 2px;
          transform: rotate(18deg);
          transform-origin: top center;
          z-index: 4;
          box-shadow: 1px 2px 4px rgba(0,0,0,0.4);
          opacity: 0.55;
          pointer-events: none;
        }
        .vdj-platter-tonearm::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          width: 14px;
          height: 14px;
          margin-left: -7px;
          border-radius: 50% 50% 40% 40%;
          background: #c4cad3;
        }

        .vdj-time-row {
          display: flex;
          justify-content: space-between;
          width: 100%;
          max-width: 250px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--vdj-muted);
        }
        .vdj-pitch { color: var(--a, var(--vdj-text)); font-weight: 600; }

        .vdj-transport {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        .vdj-pad {
          border: 1px solid var(--vdj-line);
          background: linear-gradient(180deg, #243041, #151b24);
          color: var(--vdj-text);
          border-radius: 8px;
          padding: 10px 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          font-family: inherit;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .vdj-pad:hover { border-color: rgba(255,255,255,0.22); }
        .vdj-pad:active { transform: translateY(1px); }
        .vdj-pad.play {
          background: linear-gradient(180deg, color-mix(in srgb, var(--a) 45%, #243041), color-mix(in srgb, var(--a) 18%, #151b24));
          border-color: color-mix(in srgb, var(--a) 55%, white);
          font-size: 14px;
        }
        .vdj-pad.play.active, .vdj-pad.active {
          background: color-mix(in srgb, var(--vdj-teal) 28%, #151b24);
          border-color: var(--vdj-teal);
          color: #b8fff6;
        }
        .vdj-pad.cue { letter-spacing: 0.12em; }

        .vdj-cues {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .vdj-cue {
          height: 40px;
          border-radius: 8px;
          border: 1px solid var(--vdj-line);
          background: #0c1118;
          color: var(--vdj-muted);
          font-weight: 700;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
        }
        .vdj-cue.set {
          border-color: var(--c);
          color: #fff;
          background: color-mix(in srgb, var(--c) 28%, #0c1118);
          box-shadow: 0 0 12px color-mix(in srgb, var(--c) 35%, transparent);
        }

        .vdj-btn {
          border: 1px solid var(--vdj-line);
          background: rgba(255,255,255,0.04);
          color: var(--vdj-text);
          border-radius: 6px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          cursor: pointer;
          font-family: inherit;
        }
        .vdj-btn:hover { border-color: rgba(255,255,255,0.25); }
        .vdj-btn.primary {
          background: color-mix(in srgb, var(--vdj-teal) 22%, transparent);
          border-color: color-mix(in srgb, var(--vdj-teal) 50%, white);
        }
        .vdj-btn.slim { padding: 6px 8px; min-width: 34px; }
        .vdj-btn.tiny {
          padding: 4px 6px;
          min-width: 28px;
          font-size: 10px;
        }

        /* Vertical faders (no invalid HTML orient attr) */
        .vdj-vert-fader {
          writing-mode: vertical-lr;
          direction: rtl;
          width: 28px;
          height: 160px;
          flex: 1;
          accent-color: var(--a, var(--vdj-orange));
          cursor: pointer;
        }
        .vdj-vert-fader.ch { accent-color: var(--ch); height: 110px; }
        .vdj-vert-fader.master { accent-color: #e8f1f8; height: 120px; }

        /* ── Mixer ── */
        .vdj-mixer {
          background: linear-gradient(180deg, #1c2430, #10151c);
          border: 1px solid var(--vdj-line);
          border-radius: 14px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: stretch;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .vdj-mixer-title {
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 0.2em;
          font-size: 18px;
          text-align: center;
          color: var(--vdj-muted);
        }
        .vdj-mixer-channels {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 6px;
          flex: 1;
          min-height: 0;
        }
        .vdj-ch {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 8px 4px;
          border-radius: 10px;
          background: rgba(0,0,0,0.25);
          border: 1px solid color-mix(in srgb, var(--ch) 25%, transparent);
        }
        .vdj-ch-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          color: var(--ch);
          line-height: 1;
        }
        .vdj-knob-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-size: 9px;
          letter-spacing: 0.08em;
          color: var(--vdj-muted);
          font-weight: 700;
          width: 100%;
        }
        .vdj-knob-wrap em {
          font-style: normal;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--vdj-text);
        }
        .vdj-knob {
          width: 100%;
          accent-color: var(--ch);
          height: 18px;
        }
        .vdj-ch-gain {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: var(--vdj-muted);
          font-weight: 700;
        }
        .vdj-ch-gain em {
          font-style: normal;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--vdj-text);
        }
        .vdj-mixer-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 4px 0;
        }
        .vdj-meter-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: var(--vdj-muted);
          font-weight: 700;
        }
        .vdj-meter-block em {
          font-style: normal;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--vdj-text);
        }
        .vdj-sync-btn {
          border: 1px solid rgba(46,196,182,0.45);
          background: rgba(46,196,182,0.12);
          color: #9ff0e6;
          border-radius: 8px;
          padding: 10px 8px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 0.12em;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.1;
        }
        .vdj-sync-btn small {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0;
          opacity: 0.8;
        }
        .vdj-xfade-block { margin-top: auto; }
        .vdj-xfade-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: var(--vdj-muted);
          margin-bottom: 6px;
          font-weight: 700;
        }
        .vdj-xfade-rail {
          padding: 10px 8px;
          border-radius: 10px;
          background: rgba(0,0,0,0.35);
          border: 1px solid var(--vdj-line);
        }
        .vdj-xfade {
          width: 100%;
          accent-color: #e8f1f8;
          height: 22px;
          cursor: pointer;
        }

        @media (max-width: 1100px) {
          .vdj-main { grid-template-columns: 1fr; }
          .vdj-lib { max-height: 200px; border-right: none; border-bottom: 1px solid var(--vdj-line); }
          .vdj-chassis { grid-template-columns: 1fr; }
          .vdj-platter { width: min(100%, 220px); }
        }
      `}</style>
    </div>
  );
};

export default VirtualDj;
