import React from 'react';
import { ArrowUp24Regular, Delete24Regular, Play24Filled } from '@fluentui/react-icons';
import type { DjModeState, DjVoteEntry } from '../../types/music';

interface DjVotePanelProps {
  djMode: DjModeState;
  djPool: DjVoteEntry[];
  isHost: boolean;
  onToggleDj: (enabled: boolean) => void;
  onToggleAutoPlay: (autoPlay: boolean) => void;
  onVote: (entryId: string) => void;
  onPlayTop: () => void;
  onClear: () => void;
}

export const DjVotePanel: React.FC<DjVotePanelProps> = ({
  djMode,
  djPool,
  isHost,
  onToggleDj,
  onToggleAutoPlay,
  onVote,
  onPlayTop,
  onClear,
}) => {
  return (
    <div className="dj-panel">
      <div className="dj-panel-header">
        <span className="dj-badge">🎧 Modo DJ</span>
        {isHost && (
          <label className="dj-toggle">
            <input
              type="checkbox"
              checked={djMode.enabled}
              onChange={(e) => onToggleDj(e.target.checked)}
            />
            {djMode.enabled ? 'Activo' : 'Inactivo'}
          </label>
        )}
      </div>

      {!djMode.enabled ? (
        <p className="dj-hint">
          {isHost
            ? 'Activá el modo DJ para que la audiencia sugiera canciones y vote cuál suena después.'
            : 'El anfitrión aún no activó el modo DJ.'}
        </p>
      ) : (
        <>
          {isHost && (
            <div className="dj-host-controls">
              <label className="dj-autoplay">
                <input
                  type="checkbox"
                  checked={djMode.autoPlay}
                  onChange={(e) => onToggleAutoPlay(e.target.checked)}
                />
                Auto-reproducir ganadora al terminar
              </label>
              <div className="dj-host-actions">
                <button type="button" className="dj-btn primary" onClick={onPlayTop} disabled={!djPool.length}>
                  <Play24Filled /> Reproducir top
                </button>
                <button type="button" className="dj-btn" onClick={onClear} disabled={!djPool.length}>
                  <Delete24Regular /> Limpiar
                </button>
              </div>
            </div>
          )}

          <p className="dj-hint active">
            {isHost
              ? 'La audiencia vota desde la búsqueda con “Sugerir al DJ”.'
              : 'Buscá una canción y tocá “Sugerir al DJ” para proponerla.'}
          </p>

          {djPool.length === 0 ? (
            <div className="dj-empty">Sin sugerencias todavía — ¡sé el primero!</div>
          ) : (
            <ul className="dj-vote-list">
              {djPool.map((entry, index) => (
                <li key={entry.entryId} className={index === 0 ? 'leading' : ''}>
                  <div className="dj-vote-rank">{index + 1}</div>
                  {entry.track.cover && (
                    <img src={entry.track.cover} alt="" className="dj-vote-cover" />
                  )}
                  <div className="dj-vote-info">
                    <div className="dj-vote-title">{entry.track.title}</div>
                    <div className="dj-vote-meta">
                      {entry.track.artist} · por {entry.suggestedByName}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`dj-vote-btn ${entry.votedByMe ? 'voted' : ''}`}
                    onClick={() => onVote(entry.entryId)}
                    title={entry.votedByMe ? 'Quitar voto' : 'Votar'}
                  >
                    <ArrowUp24Regular />
                    {entry.voteCount}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <style>{`
        .dj-panel {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .dj-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .dj-badge {
          font-size: 13px;
          font-weight: 800;
          color: #fbbf24;
        }

        .dj-toggle, .dj-autoplay {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
        }

        .dj-host-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dj-host-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .dj-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .dj-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .dj-btn.primary { background: #1db954; border-color: #1db954; color: #000; }
        .dj-btn svg { width: 16px; height: 16px; }

        .dj-hint {
          margin: 0;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          line-height: 1.45;
        }

        .dj-hint.active { color: rgba(255,255,255,0.65); }

        .dj-empty {
          text-align: center;
          padding: 16px;
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          border: 1px dashed rgba(255,255,255,0.12);
          border-radius: 8px;
        }

        .dj-vote-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 220px;
          overflow-y: auto;
        }

        .dj-vote-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 10px;
          background: rgba(0,0,0,0.25);
          border: 1px solid transparent;
        }

        .dj-vote-list li.leading {
          border-color: rgba(29,185,84,0.45);
          background: rgba(29,185,84,0.08);
        }

        .dj-vote-rank {
          width: 22px;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          color: rgba(255,255,255,0.45);
        }

        .dj-vote-list li.leading .dj-vote-rank { color: #1db954; }

        .dj-vote-cover {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .dj-vote-info {
          flex: 1;
          min-width: 0;
        }

        .dj-vote-title {
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dj-vote-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dj-vote-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          min-width: 44px;
          padding: 6px 8px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .dj-vote-btn.voted {
          background: #1db954;
          border-color: #1db954;
          color: #000;
        }

        .dj-vote-btn svg { width: 14px; height: 14px; }
      `}</style>
    </div>
  );
};

export default DjVotePanel;
