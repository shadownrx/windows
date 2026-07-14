import React from 'react';
import type { DjDeckApi } from './useDjDeck';
import { CUE_COLORS } from './types';
import Platter from './Platter';
import Waveform from './Waveform';

type Props = {
  deck: DjDeckApi;
  accent: string;
  label: string;
  isMaster?: boolean;
  onMakeMaster?: () => void;
  onCuePreview: (enabled: boolean) => void;
  cuePreview: boolean;
  /** Mirror layout for deck B (pitch fader on the left). */
  mirror?: boolean;
};

function fmt(t: number) {
  if (!Number.isFinite(t) || t < 0) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const DeckPanel: React.FC<Props> = ({
  deck,
  accent,
  label,
  isMaster,
  onMakeMaster,
  onCuePreview,
  cuePreview,
  mirror = false,
}) => {
  const { state } = deck;
  const pitchPct = (state.rate - 1) * 100;

  return (
    <div className={`vdj-deck ${mirror ? 'mirror' : ''}`} style={{ ['--a' as string]: accent }}>
      <div className="vdj-deck-head">
        <div className="vdj-deck-badge">{label}</div>
        <div className="vdj-deck-meta">
          {state.track ? (
            <>
              <div className="vdj-track-title">{state.track.title}</div>
              <div className="vdj-track-artist">{state.track.artist}</div>
            </>
          ) : (
            <div className="vdj-track-artist">Vacío — cargá un tema desde Library</div>
          )}
        </div>
        <div className="vdj-deck-leds">
          <button
            type="button"
            className={`vdj-led ${isMaster ? 'on' : ''}`}
            onClick={onMakeMaster}
            title="Master para SYNC"
          >
            MST
          </button>
          <button
            type="button"
            className={`vdj-led ${cuePreview ? 'on teal' : ''}`}
            onClick={() => onCuePreview(!cuePreview)}
            title="PFL / cue preview"
          >
            PFL
          </button>
        </div>
      </div>

      <div className="vdj-wave-wrap">
        <Waveform
          peaks={state.peaks}
          currentTime={state.currentTime}
          duration={state.duration}
          cues={state.cues}
          loop={state.loop}
          accent={accent}
          onSeek={deck.seek}
        />
        {(state.loading || state.error) && (
          <div className="vdj-wave-overlay">
            {state.loading ? 'Resolviendo stream…' : state.error}
          </div>
        )}
      </div>

      <div className="vdj-deck-body">
        <div className="vdj-platter-col">
          <Platter
            accent={accent}
            label={label}
            cover={state.track?.cover}
            title={state.track?.title}
            playing={state.playing}
            rate={state.rate}
            currentTime={state.currentTime}
            duration={state.duration}
            onSeek={deck.seek}
          />
          <div className="vdj-time-row">
            <span>{fmt(state.currentTime)}</span>
            <span className="vdj-pitch">
              {pitchPct >= 0 ? '+' : ''}
              {pitchPct.toFixed(1)}%
            </span>
            <span>{fmt(state.duration)}</span>
          </div>
        </div>

        <div className="vdj-pitch-col">
          <span className="vdj-fader-cap">PITCH</span>
          <input
            type="range"
            className="vdj-vert-fader"
            min={-15}
            max={15}
            step={0.1}
            value={pitchPct}
            onChange={(e) => deck.setRate(1 + Number(e.target.value) / 100)}
            aria-label={`Pitch deck ${label}`}
          />
          <button type="button" className="vdj-btn tiny" onClick={() => deck.setRate(1)} title="Reset pitch">
            0
          </button>
        </div>
      </div>

      <div className="vdj-transport">
        <button type="button" className="vdj-pad cue" onClick={() => deck.cueJump()}>
          CUE
        </button>
        <button type="button" className={`vdj-pad play ${state.playing ? 'active' : ''}`} onClick={() => void deck.toggle()}>
          {state.playing ? '❚❚' : '▶'}
        </button>
        <button type="button" className="vdj-pad" onClick={deck.setLoopIn}>
          IN
        </button>
        <button type="button" className="vdj-pad" onClick={deck.setLoopOut}>
          OUT
        </button>
        <button type="button" className={`vdj-pad ${state.loop?.enabled ? 'active' : ''}`} onClick={deck.toggleLoop}>
          LOOP
        </button>
      </div>

      <div className="vdj-cues">
        {[1, 2, 3, 4].map((slot) => {
          const has = state.cues.some((c) => c.id === slot);
          return (
            <button
              key={slot}
              type="button"
              className={`vdj-cue ${has ? 'set' : ''}`}
              style={{ ['--c' as string]: CUE_COLORS[slot - 1] }}
              title={has ? 'Click: jump · Shift: clear · Alt: set' : 'Set hot cue'}
              onClick={(e) => {
                if (e.shiftKey && has) {
                  deck.clearHotCue(slot);
                  return;
                }
                if (e.altKey || e.metaKey || !has) {
                  deck.setHotCue(slot);
                  return;
                }
                deck.jumpHotCue(slot);
              }}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DeckPanel;
