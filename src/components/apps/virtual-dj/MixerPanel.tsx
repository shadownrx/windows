import React from 'react';
import type { DjDeckApi } from './useDjDeck';

type Props = {
  crossfader: number;
  masterVolume: number;
  onCrossfader: (v: number) => void;
  onMasterVolume: (v: number) => void;
  onSyncSlave: () => void;
  masterDeck: 'A' | 'B';
  channelA: DjDeckApi;
  channelB: DjDeckApi;
};

function ChannelStrip({
  deck,
  label,
  accent,
}: {
  deck: DjDeckApi;
  label: string;
  accent: string;
}) {
  const { state } = deck;
  return (
    <div className="vdj-ch" style={{ ['--ch' as string]: accent }}>
      <div className="vdj-ch-label">{label}</div>
      {(['high', 'mid', 'low'] as const).map((band) => (
        <label key={band} className="vdj-knob-wrap">
          <span>{band === 'high' ? 'HI' : band === 'mid' ? 'MID' : 'LOW'}</span>
          <input
            type="range"
            className="vdj-knob"
            min={-12}
            max={12}
            step={0.5}
            value={state.eq[band]}
            onChange={(e) => deck.setEq({ [band]: Number(e.target.value) })}
          />
          <em>
            {state.eq[band] > 0 ? '+' : ''}
            {state.eq[band]}
          </em>
        </label>
      ))}
      <div className="vdj-ch-gain">
        <span>GAIN</span>
        <input
          type="range"
          className="vdj-vert-fader ch"
          min={0}
          max={1}
          step={0.01}
          value={state.volume}
          onChange={(e) => deck.setVolume(Number(e.target.value))}
          aria-label={`Gain deck ${label}`}
        />
        <em>{Math.round(state.volume * 100)}</em>
      </div>
    </div>
  );
}

export const MixerPanel: React.FC<Props> = ({
  crossfader,
  masterVolume,
  onCrossfader,
  onMasterVolume,
  onSyncSlave,
  masterDeck,
  channelA,
  channelB,
}) => {
  return (
    <div className="vdj-mixer">
      <div className="vdj-mixer-title">MIXER</div>

      <div className="vdj-mixer-channels">
        <ChannelStrip deck={channelA} label="A" accent="#ff6b4a" />
        <div className="vdj-mixer-center">
          <div className="vdj-meter-block">
            <span>MASTER</span>
            <input
              type="range"
              className="vdj-vert-fader master"
              min={0}
              max={1}
              step={0.01}
              value={masterVolume}
              onChange={(e) => onMasterVolume(Number(e.target.value))}
              aria-label="Master volume"
            />
            <em>{Math.round(masterVolume * 100)}</em>
          </div>
          <button
            type="button"
            className="vdj-sync-btn"
            onClick={onSyncSlave}
            title="Match pitch del otro deck al master"
          >
            SYNC
            <small>→ {masterDeck === 'A' ? 'B' : 'A'}</small>
          </button>
        </div>
        <ChannelStrip deck={channelB} label="B" accent="#2ec4b6" />
      </div>

      <div className="vdj-xfade-block">
        <div className="vdj-xfade-labels">
          <span>A</span>
          <span>CROSSFADER</span>
          <span>B</span>
        </div>
        <div className="vdj-xfade-rail">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={crossfader}
            onChange={(e) => onCrossfader(Number(e.target.value))}
            className="vdj-xfade"
            aria-label="Crossfader"
          />
        </div>
      </div>
    </div>
  );
};

export default MixerPanel;
