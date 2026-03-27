import React, { useState, useRef, useCallback } from 'react';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

// Well-known sites that block iframes get a workaround message
const BLOCKED_DOMAINS = ['twitter.com', 'x.com', 'facebook.com', 'instagram.com'];
// YouTube uses embed format
const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;

function resolveUrl(raw: string): { url: string; isYouTubeEmbed: boolean; videoId?: string } {
  let url = raw.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = url.includes('.') ? `https://${url}` : `https://www.google.com/search?q=${encodeURIComponent(url)}&igu=1`;
  }
  const ytMatch = url.match(YOUTUBE_REGEX);
  if (ytMatch) {
    return { url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`, isYouTubeEmbed: true, videoId: ytMatch[1] };
  }
  return { url, isYouTubeEmbed: false };
}

const BOOKMARKS = [
  { label: 'YouTube', favicon: 'https://www.youtube.com/favicon.ico', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { label: 'Google', favicon: 'https://www.google.com/favicon.ico', url: 'https://www.google.com' },
  { label: 'GitHub', favicon: 'https://github.com/favicon.ico', url: 'https://github.com' },
  { label: 'Wikipedia', favicon: 'https://wikipedia.org/favicon.ico', url: 'https://wikipedia.org' },
  { label: 'Maps', favicon: 'https://maps.google.com/favicon.ico', url: 'https://maps.google.com' },
];

const QUICK_LINKS = [
  { label: 'YouTube', bg: '#ff0000', favicon: 'https://www.youtube.com/favicon.ico', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { label: 'Gmail', bg: '#ea4335', favicon: 'https://mail.google.com/favicon.ico', url: 'https://mail.google.com' },
  { label: 'Maps', bg: '#34a853', favicon: 'https://maps.google.com/favicon.ico', url: 'https://maps.google.com' },
  { label: 'GitHub', bg: '#24292e', favicon: 'https://github.com/favicon.ico', url: 'https://github.com' },
  { label: 'Wikipedia', bg: '#3268cc', favicon: 'https://en.wikipedia.org/favicon.ico', url: 'https://en.wikipedia.org' },
  { label: 'Netflix', bg: '#e50914', favicon: 'https://www.netflix.com/favicon.ico', url: 'https://www.netflix.com' },
  { label: 'Reddit', bg: '#ff4500', favicon: 'https://www.reddit.com/favicon.ico', url: 'https://www.reddit.com' },
  { label: 'Twitter/X', bg: '#000', favicon: 'https://x.com/favicon.ico', url: 'https://x.com' },
];

export const ChromeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="12" fill="#fff"/>
    <path d="M24 12A12 12 0 0 1 35.5 18H24z" fill="#EA4335"/>
    <path d="M35.5 18A12 12 0 0 1 35.5 30H24z" fill="#FBBC05"/>
    <path d="M35.5 30A12 12 0 0 1 12.5 30H24z" fill="#34A853"/>
    <path d="M12.5 30A12 12 0 0 1 12.5 18H24z" fill="#4285F4"/>
    <circle cx="24" cy="24" r="5" fill="#fff"/>
    <path d="M24 12h12a12 12 0 0 0-12-12 12 12 0 0 0-12 12z" fill="#EA4335"/>
    <path d="M24 12a12 12 0 0 1 10.4 6H48A24 24 0 0 0 24 0z" fill="#EA4335"/>
    <path d="M34.4 18L41 6A24 24 0 0 0 0 24h14.4A12 12 0 0 1 24 12z" fill="#4285F4" opacity=".1"/>
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 272 92" width="92" height="32">
    <path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
    <path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
    <path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
    <path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/>
    <path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
    <path fill="#4285F4" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>
  </svg>
);

const NewTabPage: React.FC<{ onNavigate: (url: string) => void }> = ({ onNavigate }) => {
  const [q, setQ] = useState('');
  const handleSearch = () => {
    if (!q.trim()) return;
    onNavigate(q.includes('.') ? `https://${q}` : `https://www.google.com/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="gnt-root">
      <GoogleLogo />
      <div className="gnt-search-box">
        <svg className="gnt-search-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#9aa0a6" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          className="gnt-input"
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Busca en Google o escribe una URL"
          autoFocus
        />
        {q && (
          <button className="gnt-clear" onClick={() => setQ('')}>✕</button>
        )}
        <div className="gnt-divider" />
        <button className="gnt-mic" title="Buscar por voz">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285f4" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path fill="#34a853" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
      </div>

      <div className="gnt-quick">
        {QUICK_LINKS.map(l => (
          <div key={l.label} className="gnt-quick-item" onClick={() => onNavigate(l.url)}>
            <div className="gnt-quick-icon">
              <img src={l.favicon} alt="" width="24" height="24" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            </div>
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        .gnt-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #202124;
          color: rgba(255,255,255,0.87);
          gap: 32px;
          font-family: 'Roboto', arial, sans-serif;
          user-select: none;
        }
        .gnt-search-box {
          display: flex;
          align-items: center;
          background: #303134;
          border: 1px solid #5f6368;
          border-radius: 24px;
          width: 560px;
          height: 48px;
          padding: 0 14px;
          gap: 8px;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
        }
        .gnt-search-box:focus-within {
          background: #303134;
          border-color: transparent;
          box-shadow: 0 1px 6px rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.08);
        }
        .gnt-search-icon { flex-shrink: 0; }
        .gnt-input {
          flex: 1;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.87);
          font-size: 16px;
          outline: none;
          font-family: inherit;
        }
        .gnt-input::placeholder { color: #9aa0a6; }
        .gnt-clear {
          background: transparent;
          border: none;
          color: #9aa0a6;
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
        }
        .gnt-divider { width: 1px; height: 24px; background: #5f6368; margin: 0 4px; }
        .gnt-mic { background: transparent; border: none; cursor: pointer; display: flex; align-items: center; }
        .gnt-quick {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 640px;
        }
        .gnt-quick-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          width: 72px;
          transition: background 0.1s;
        }
        .gnt-quick-item:hover { background: rgba(255,255,255,0.07); }
        .gnt-quick-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #303134;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: white;
          overflow: hidden;
        }
        .gnt-quick-item span {
          font-size: 11px;
          color: rgba(255,255,255,0.65);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

const BlockedPage: React.FC<{ url: string }> = ({ url }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', background:'#202124', color:'rgba(255,255,255,0.8)', gap:16, fontFamily:'sans-serif', textAlign:'center', padding:32 }}>
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#5f6368" strokeWidth="1.5"/>
      <path d="M4.93 4.93l14.14 14.14" stroke="#5f6368" strokeWidth="1.5"/>
    </svg>
    <div style={{ fontSize:18, fontWeight:500 }}>Este sitio no puede mostrarse dentro de la ventana</div>
    <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', maxWidth:400 }}>
      <strong>{url}</strong> no permite ser embebido por razones de seguridad (X-Frame-Options).
    </div>
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ marginTop:8, padding:'10px 24px', background:'#1a73e8', color:'white', borderRadius:20, textDecoration:'none', fontSize:13, fontWeight:500 }}>
      Abrir en ventana externa ↗
    </a>
  </div>
);

const BrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([{ id: '1', title: 'Nueva pestaña', url: '' }]);
  const [activeTab, setActiveTab] = useState('1');
  const [addressVal, setAddressVal] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const nextId = useRef(2);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTab = tabs.find(t => t.id === activeTab);
  const isNewTab = !currentTab?.url;
  const displayUrl = currentTab?.url || '';
  const resolved = displayUrl ? resolveUrl(displayUrl) : null;
  const isDomainBlocked = resolved && !resolved.isYouTubeEmbed &&
    BLOCKED_DOMAINS.some(d => resolved.url.includes(d));

  const addTab = () => {
    const id = String(nextId.current++);
    setTabs(prev => [...prev, { id, title: 'Nueva pestaña', url: '' }]);
    setActiveTab(id);
    setAddressVal('');
    setEditing(false);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (next.length === 0) {
        const newId = String(nextId.current++);
        const newTab = { id: newId, title: 'Nueva pestaña', url: '' };
        setTimeout(() => { setActiveTab(newId); setAddressVal(''); }, 0);
        return [newTab];
      }
      if (activeTab === id) setActiveTab(next[next.length - 1].id);
      return next;
    });
  };

  const navigate = useCallback((rawUrl: string) => {
    if (!rawUrl.trim()) return;
    const { url, isYouTubeEmbed } = resolveUrl(rawUrl);
    const finalUrl = isYouTubeEmbed ? rawUrl.trim() : url;
    setLoading(true);
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTab) return t;
      let title = 'Nueva pestaña';
      try { title = new URL(url).hostname.replace('www.', ''); } catch {}
      return { ...t, url: finalUrl, title };
    }));
    setAddressVal(finalUrl);
    setEditing(false);
    setTimeout(() => setLoading(false), 1500);
  }, [activeTab]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigate(addressVal);
    if (e.key === 'Escape') { setEditing(false); setAddressVal(displayUrl); }
  };

  const getIframeSrc = () => {
    if (!displayUrl) return '';
    const { url, isYouTubeEmbed } = resolveUrl(displayUrl);
    return isYouTubeEmbed ? url : url;
  };

  const isYT = resolved?.isYouTubeEmbed ?? false;
  const iframeSrc = getIframeSrc();

  const getDomainDisplay = () => {
    if (!displayUrl) return '';
    try {
      const { url, isYouTubeEmbed } = resolveUrl(displayUrl);
      const host = new URL(isYouTubeEmbed ? displayUrl : url).hostname;
      return host;
    } catch { return displayUrl; }
  };

  return (
    <div className="chr-root">
      {/* Tab bar */}
      <div className="chr-tabbar">
        <div className="chr-tabs">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`chr-tab ${tab.id === activeTab ? 'chr-tab-active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setAddressVal(tab.url); }}
            >
              <ChromeIcon />
              <span className="chr-tab-title">{tab.title}</span>
              <button
                className="chr-tab-close"
                onClick={e => closeTab(tab.id, e)}
                title="Cerrar pestaña"
              >✕</button>
            </div>
          ))}
          <button className="chr-newtab" onClick={addTab} title="Nueva pestaña">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>
        </div>
        <div className="chr-tab-actions">
          <button className="chr-icon-btn" title="Minimizar">—</button>
          <button className="chr-icon-btn" title="Restaurar">⬜</button>
          <button className="chr-icon-btn chr-close-win" title="Cerrar">✕</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="chr-toolbar">
        <button className="chr-nav-btn" onClick={() => iframeRefs.current[activeTab]?.contentWindow?.history.back()} title="Atrás">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <button className="chr-nav-btn" onClick={() => iframeRefs.current[activeTab]?.contentWindow?.history.forward()} title="Adelante">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>
        </button>
        <button
          className={`chr-nav-btn ${loading ? 'chr-spinning' : ''}`}
          onClick={() => { if (currentTab?.url) navigate(currentTab.url); }}
          title="Actualizar"
        >
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        </button>

        {/* Address bar */}
        <div
          className={`chr-omnibox ${editing ? 'chr-omnibox-focus' : ''}`}
          onClick={() => { setEditing(true); setAddressVal(displayUrl); setTimeout(() => inputRef.current?.select(), 10); }}
        >
          {!isNewTab && !editing && (
            <svg className="chr-lock" viewBox="0 0 24 24" width="13" height="13"><path fill="#9aa0a6" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          )}
          {editing ? (
            <input
              ref={inputRef}
              autoFocus
              className="chr-omnibox-input"
              value={addressVal}
              onChange={e => setAddressVal(e.target.value)}
              onKeyDown={handleKey}
              onBlur={() => { setTimeout(() => setEditing(false), 150); }}
              placeholder="Busca en Google o escribe una URL"
            />
          ) : (
            <span className="chr-omnibox-text">
              {isNewTab && <span className="chr-omnibox-ph">Busca en Google o escribe una URL</span>}
              {!isNewTab && (
                <>
                  <span className="chr-omnibox-domain">{getDomainDisplay()}</span>
                </>
              )}
            </span>
          )}
          <button className="chr-fav-btn" title="Agregar a favoritos">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#9aa0a6" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </button>
        </div>

        <button className="chr-nav-btn" title="Extensiones">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5A2.5 2.5 0 0 0 10.5 1 2.5 2.5 0 0 0 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>
        </button>
        <button className="chr-nav-btn" title="Menu de Chrome">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>
      </div>

      {/* Bookmarks bar */}
      <div className="chr-bookmarks">
        {BOOKMARKS.map(bm => (
          <button key={bm.label} className="chr-bookmark" onClick={() => navigate(bm.url)}>
            <img src={bm.favicon} alt="" width="14" height="14"
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
            <span>{bm.label}</span>
          </button>
        ))}
        <div className="chr-bookmark-sep" />
        <span className="chr-bookmark-other">Otras páginas favoritas</span>
      </div>

      {/* Content */}
      <div className="chr-content">
        {loading && <div className="chr-progress" />}
        {isNewTab ? (
          <NewTabPage onNavigate={navigate} />
        ) : isDomainBlocked ? (
          <BlockedPage url={iframeSrc} />
        ) : isYT ? (
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            className="chr-iframe"
            title="YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <iframe
            key={iframeSrc}
            ref={el => { iframeRefs.current[activeTab] = el; }}
            src={iframeSrc}
            className="chr-iframe"
            title={currentTab?.title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
            onLoad={() => setLoading(false)}
          />
        )}
      </div>

      <style>{`
        .chr-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #292a2d;
          color: rgba(255,255,255,0.87);
          font-family: -apple-system, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          user-select: none;
        }

        /* Tab bar */
        .chr-tabbar {
          display: flex;
          align-items: stretch;
          background: #202124;
          padding: 8px 0 0;
          min-height: 40px;
        }
        .chr-tabs {
          display: flex;
          align-items: flex-end;
          flex: 1;
          overflow: hidden;
          padding: 0 8px;
          gap: 0;
        }
        .chr-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px 7px 10px;
          border-radius: 8px 8px 0 0;
          max-width: 240px;
          min-width: 80px;
          cursor: pointer;
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          background: transparent;
          position: relative;
          flex: 1;
          transition: color 0.1s;
          overflow: hidden;
        }
        .chr-tab:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
        .chr-tab-active {
          background: #292a2d !important;
          color: rgba(255,255,255,0.95) !important;
        }
        .chr-tab-title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
        }
        .chr-tab-close {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          cursor: pointer;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: background 0.1s, opacity 0.1s;
          flex-shrink: 0;
          padding: 0;
          line-height: 1;
        }
        .chr-tab:hover .chr-tab-close,
        .chr-tab-active .chr-tab-close { opacity: 1; }
        .chr-tab-close:hover { background: rgba(255,255,255,0.15); color: white; }
        .chr-newtab {
          width: 28px;
          height: 28px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin: 0 2px;
          align-self: center;
          transition: background 0.1s;
          flex-shrink: 0;
        }
        .chr-newtab:hover { background: rgba(255,255,255,0.1); color: white; }
        .chr-tab-actions {
          display: flex;
          align-items: center;
          padding: 0 4px;
          gap: 0;
        }
        .chr-icon-btn {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.6);
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 11px;
          border-radius: 4px;
          transition: background 0.1s;
        }
        .chr-icon-btn:hover { background: rgba(255,255,255,0.1); }
        .chr-close-win:hover { background: #e81123 !important; color: white !important; }

        /* Toolbar */
        .chr-toolbar {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #292a2d;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .chr-nav-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.1s;
        }
        .chr-nav-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .chr-spinning svg { animation: chr-spin 0.7s linear infinite; }
        @keyframes chr-spin { to { transform: rotate(360deg); } }

        /* Omnibox */
        .chr-omnibox {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 12px;
          background: #303134;
          border: 1px solid transparent;
          border-radius: 24px;
          cursor: text;
          transition: background 0.15s, box-shadow 0.15s;
          min-width: 0;
        }
        .chr-omnibox:hover { background: #3c3d40; }
        .chr-omnibox-focus {
          background: #303134 !important;
          border-color: #8ab4f8;
          box-shadow: 0 1px 6px rgba(138,180,248,0.2);
        }
        .chr-lock { flex-shrink: 0; }
        .chr-omnibox-input {
          flex: 1;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.87);
          font-size: 14px;
          outline: none;
          min-width: 0;
          font-family: inherit;
        }
        .chr-omnibox-input::placeholder { color: #9aa0a6; }
        .chr-omnibox-text { flex: 1; font-size: 14px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .chr-omnibox-ph { color: #9aa0a6; }
        .chr-omnibox-domain { color: rgba(255,255,255,0.87); }
        .chr-fav-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          padding: 0;
          flex-shrink: 0;
        }
        .chr-fav-btn:hover svg path { fill: #8ab4f8; }

        /* Bookmarks */
        .chr-bookmarks {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 2px 12px;
          background: #292a2d;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          overflow-x: auto;
          scrollbar-width: none;
          flex-shrink: 0;
        }
        .chr-bookmarks::-webkit-scrollbar { display: none; }
        .chr-bookmark {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 4px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.1s;
          font-family: inherit;
        }
        .chr-bookmark:hover { background: rgba(255,255,255,0.08); color: white; }
        .chr-bookmark-sep {
          width: 1px;
          height: 16px;
          background: rgba(255,255,255,0.1);
          margin: 0 6px;
          flex-shrink: 0;
        }
        .chr-bookmark-other {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          white-space: nowrap;
          cursor: pointer;
          padding: 3px 8px;
          border-radius: 4px;
          transition: background 0.1s;
        }
        .chr-bookmark-other:hover { background: rgba(255,255,255,0.06); }

        /* Content */
        .chr-content {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: #fff;
        }
        .chr-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
          background: #fff;
        }
        .chr-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 3px;
          background: #1a73e8;
          border-radius: 0 2px 2px 0;
          animation: chr-prog 1.5s ease-out forwards;
          z-index: 10;
        }
        @keyframes chr-prog {
          0%  { width: 0%; opacity: 1; }
          70% { width: 85%; }
          100%{ width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default BrowserApp;
