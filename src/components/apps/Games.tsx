import React, { useMemo, useState } from 'react';
import { Games24Regular, Play24Filled } from '@fluentui/react-icons';
import { useWindowManager } from '../../context/WindowManager';
import { useIsPhone } from '../../hooks/useMobileAppShell';

type GameCard = {
  id: string;
  appId: string;
  title: string;
  genre: string;
  blurb: string;
  accent: string;
  icon: React.ReactNode;
  featured?: boolean;
  scoreKey?: string;
};

const CATALOG: GameCard[] = [
  {
    id: 'tetris',
    appId: 'tetris',
    title: 'Tetris',
    genre: 'Puzzle',
    blurb: 'Encajá líneas, subí de nivel y rompé tu récord. Controles táctiles en el celular.',
    accent: '#22d3ee',
    icon: <span aria-hidden>🧱</span>,
    featured: true,
    scoreKey: 'nex_tetris_best',
  },
  {
    id: 'counter-strike',
    appId: 'counter-strike',
    title: 'Counter-Strike 1.6',
    genre: 'Shooter',
    blurb: 'El clásico de NEX. Abrilo y a las bombas.',
    accent: '#ef6c00',
    icon: <Games24Regular />,
  },
];

const Games: React.FC = () => {
  const { openWindow } = useWindowManager();
  const isPhone = useIsPhone();
  const [query, setQuery] = useState('');

  const games = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter(
      (g) => !q || g.title.toLowerCase().includes(q) || g.genre.toLowerCase().includes(q),
    );
  }, [query]);

  const play = (game: GameCard) => {
    openWindow(game.id, game.appId, game.title, game.icon);
  };

  return (
    <div className={`nx-games ${isPhone ? 'is-phone' : ''}`}>
      <header className="nx-games-hero">
        <div>
          <div className="nx-games-kicker">NEX Arcade</div>
          <h1>Games</h1>
          <p>Tus juegos del sistema. Tocá Jugar y se abre en su propia ventana.</p>
        </div>
        <label className="nx-games-search">
          <input
            type="search"
            placeholder="Buscar juegos"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </header>

      <div className="nx-games-grid">
        {games.map((game) => {
          const best = game.scoreKey ? Number(localStorage.getItem(game.scoreKey) || 0) : 0;
          return (
            <article
              key={game.id}
              className={`nx-games-card ${game.featured ? 'featured' : ''}`}
              style={{ ['--g-accent' as string]: game.accent }}
            >
              <div className="nx-games-icon">{game.icon}</div>
              <div className="nx-games-body">
                <div className="nx-games-meta">
                  <h2>{game.title}</h2>
                  <span>{game.genre}</span>
                </div>
                <p>{game.blurb}</p>
                {game.scoreKey != null && (
                  <div className="nx-games-score">Mejor: {best.toLocaleString()}</div>
                )}
              </div>
              <button type="button" onClick={() => play(game)}>
                <Play24Filled />
                Jugar
              </button>
            </article>
          );
        })}
        {games.length === 0 && <div className="nx-games-empty">No hay juegos con “{query}”</div>}
      </div>

      <style>{`
        .nx-games {
          height: 100%;
          min-height: 0;
          overflow: auto;
          padding: 22px 20px 18px;
          box-sizing: border-box;
          color: #eef6ff;
          font-family: Outfit, Inter, system-ui, sans-serif;
          background:
            radial-gradient(circle at 12% -10%, rgba(34, 211, 238, 0.18), transparent 42%),
            radial-gradient(circle at 90% 10%, rgba(239, 108, 0, 0.1), transparent 36%),
            #0b0f16;
        }
        .nx-games-hero {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-end;
          margin-bottom: 20px;
        }
        .nx-games-kicker {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.55;
        }
        .nx-games-hero h1 {
          margin: 4px 0 6px;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.03em;
        }
        .nx-games-hero p {
          margin: 0;
          opacity: 0.68;
          font-size: 14px;
          max-width: 420px;
        }
        .nx-games-search input {
          height: 40px;
          width: min(240px, 100%);
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: #fff;
          border-radius: 12px;
          padding: 0 12px;
          font-size: 16px;
          outline: none;
        }
        .nx-games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }
        .nx-games-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 18px;
          border-radius: 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .nx-games-card.featured {
          grid-column: 1 / -1;
          flex-direction: row;
          align-items: center;
          background:
            linear-gradient(120deg, color-mix(in srgb, var(--g-accent) 18%, transparent), rgba(255,255,255,0.03));
          border-color: color-mix(in srgb, var(--g-accent) 45%, transparent);
        }
        .nx-games-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 32px;
          background: color-mix(in srgb, var(--g-accent) 22%, #111);
          color: var(--g-accent);
          flex-shrink: 0;
        }
        .nx-games-body { flex: 1; min-width: 0; }
        .nx-games-meta { display: flex; align-items: baseline; gap: 10px; }
        .nx-games-meta h2 { margin: 0; font-size: 20px; }
        .nx-games-meta span {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.55;
        }
        .nx-games-body p { margin: 6px 0 0; font-size: 13px; opacity: 0.72; line-height: 1.45; }
        .nx-games-score { margin-top: 8px; font-size: 12px; color: var(--g-accent); font-weight: 650; }
        .nx-games-card button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 44px;
          min-width: 112px;
          padding: 0 16px;
          border: none;
          border-radius: 12px;
          background: var(--g-accent);
          color: #041016;
          font-weight: 750;
          font-size: 14px;
        }
        .nx-games-card button:active { transform: scale(0.96); }
        .nx-games-empty { opacity: 0.6; padding: 24px 4px; }
        .nx-games.is-phone .nx-games-hero { flex-direction: column; align-items: stretch; }
        .nx-games.is-phone .nx-games-search input { width: 100%; }
        .nx-games.is-phone .nx-games-card.featured { flex-direction: column; align-items: stretch; }
        .nx-games.is-phone .nx-games-card button { width: 100%; height: 48px; }
        .nx-games.is-phone .nx-games-hero h1 { font-size: 28px; }
      `}</style>
    </div>
  );
};

export default Games;
