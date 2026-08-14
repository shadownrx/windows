import React from 'react';
import { Search24Regular } from '@fluentui/react-icons';
import type { AppItem } from '../../constants/apps';
import { colorForApp } from './appColors';

export function AppGlyph({ app }: { app: AppItem }) {
  return (
    <span className="nex-m-icon" style={{ background: colorForApp(app.id) }}>
      <span className="nex-m-icon-glyph">{app.icon}</span>
    </span>
  );
}

interface MobileHomeProps {
  apps: AppItem[];
  query: string;
  onQuery: (q: string) => void;
  onLaunch: (app: AppItem) => void;
  userName: string;
  now: Date;
}

const MobileHome: React.FC<MobileHomeProps> = ({ apps, query, onQuery, onLaunch, userName, now }) => {
  const filtered = apps.filter((a) =>
    a.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="nex-m-home">
      <div className="nex-m-clock">
        <time dateTime={now.toISOString()}>
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
        <div className="nex-m-date">
          {new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)}
        </div>
        <div className="nex-m-hello">Hola, {userName}</div>
      </div>

      <label className="nex-m-search">
        <Search24Regular />
        <input
          type="search"
          enterKeyHint="search"
          placeholder="Buscar apps en NEX"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </label>

      <div className="nex-m-grid-wrap">
        {filtered.length === 0 ? (
          <div className="nex-m-empty">Nada coincide con “{query}”</div>
        ) : (
          <div className="nex-m-grid">
            {filtered.map((app) => (
              <button
                key={app.id}
                type="button"
                className="nex-m-app-btn"
                onClick={() => onLaunch(app)}
              >
                <AppGlyph app={app} />
                <span className="nex-m-app-label">{app.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileHome;
