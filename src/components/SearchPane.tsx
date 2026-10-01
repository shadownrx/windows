import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search24Regular,
  Apps24Filled,
  History24Regular,
  Document24Regular,
  Folder24Regular,
  Globe24Regular,
  ChevronRight24Regular,
  Grid24Filled,
} from '@fluentui/react-icons';
import { type AppItem } from '../constants/apps';
import { useLauncherApps } from '../hooks/useLauncherApps';
import { useWindowManager } from '../context/WindowManager';
import { useFileSystem } from '../context/FileSystemContext';
import { recentAppsWithIcons } from '../utils/recentApps';
import { resolveDefaultOpen } from '../utils/fileAssociations';

interface SearchPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchPane: React.FC<SearchPaneProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const { openWindow } = useWindowManager();
  const { files } = useFileSystem();
  const apps = useLauncherApps();
  const listRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();

  const filteredApps = useMemo(() => {
    if (!q) return [];
    return apps.filter(app =>
      app.label.toLowerCase().includes(q) || app.id.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [q, apps]);

  const filteredFiles = useMemo(() => {
    if (!q) return [];
    return files.filter(f =>
      (f.type === 'file' || f.type === 'folder') &&
      f.name.toLowerCase().includes(q)
    ).slice(0, 4);
  }, [q, files]);

  const recents = useMemo(() => (isOpen ? recentAppsWithIcons().slice(0, 4) : []), [isOpen]);

  const openApp = (app: AppItem) => {
    openWindow(app.id, app.appId, app.label, app.icon);
    onClose();
  };

  const openFile = (id: string) => {
    const f = files.find((x) => x.id === id);
    if (!f) return;
    if (f.type === 'folder' || f.type === 'drive') {
      openWindow('file-explorer', 'file-explorer', 'Explorador de archivos', <Folder24Regular />);
    } else if (f.ext === 'nex' && f.nexPayload) {
      openWindow(f.nexPayload.appId, f.nexPayload.appId, f.nexPayload.title, f.nexPayload.appId);
    } else {
      const target = resolveDefaultOpen({ id: f.id, name: f.name, ext: f.ext, imageUrl: f.imageUrl });
      if (target) openWindow(target.windowId, target.appId, target.title, target.icon, target.appProps);
    }
    onClose();
  };

  const flatCount = filteredApps.length + filteredFiles.length;

  const updateQuery = (v: string) => {
    setQuery(v);
    setActive(0);
  };

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && flatCount > 0) {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flatCount - 1));
    } else if (e.key === 'ArrowUp' && flatCount > 0) {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && flatCount > 0) {
      e.preventDefault();
      if (active < filteredApps.length) openApp(filteredApps[active]);
      else openFile(filteredFiles[active - filteredApps.length].id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay-mask" onClick={onClose}>
      <motion.div 
        className="search-pane mica premium-shadow"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* SEARCH HEADER */}
        <div className="search-header">
          <Search24Regular className="search-icon-header" />
          <input
            autoFocus
            type="text"
            placeholder="Escribe aquí para buscar"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={onInputKey}
            className="search-input-main"
          />
        </div>

        <div className="search-body custom-scrollbar" ref={listRef}>
          {!query ? (
            <>
              {/* TOP APPS */}
              <div className="search-section">
                <div className="section-title">Aplicaciones principales</div>
                <div className="top-apps-grid">
                  {apps.slice(0, 5).map((app: AppItem) => (
                    <div key={app.id} className="top-app-item" onClick={() => { openWindow(app.id, app.appId, app.label, app.icon); onClose(); }}>
                      <div className="top-app-icon">{app.icon}</div>
                      <div className="top-app-label">{app.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECENT APPS (reales) */}
              {recents.length > 0 && (
                <div className="search-section">
                  <div className="section-title">Recientes</div>
                  <div className="quick-search-list">
                    {recents.map((r) => (
                      <div key={r.id + r.appId} className="quick-item" onClick={() => { openWindow(r.id, r.appId, r.title, r.icon); onClose(); }}>
                        <span className="quick-icon">{r.icon}</span>
                        <span>{r.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* QUICK SEARCHES */}
              <div className="search-section">
                <div className="section-title">Búsquedas rápidas</div>
                <div className="quick-search-list">
                  <div className="quick-item" onClick={() => { openWindow('control-panel', 'control-panel', 'Configuración', <Apps24Filled />); onClose(); }}>
                    <History24Regular className="quick-icon" />
                    <span>Configuración de pantalla</span>
                  </div>
                  <div className="quick-item" onClick={() => updateQuery('fondo')}>
                    <History24Regular className="quick-icon" />
                    <span>Fondo de pantalla</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="search-results">
              <div className="section-title">Mejor coincidencia</div>
              {flatCount > 0 ? (
                <>
                  {filteredApps.map((app: AppItem, i) => (
                    <div
                      key={app.id}
                      data-active={i === active}
                      className={`result-item${i === active ? ' result-active' : ''}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => openApp(app)}
                    >
                      <div className="result-left">
                         <div className="result-icon">{app.icon}</div>
                         <div className="result-info">
                           <div className="result-name">{app.label}</div>
                           <div className="result-type">Aplicación</div>
                         </div>
                      </div>
                      <ChevronRight24Regular className="result-arrow" />
                    </div>
                  ))}
                  {filteredFiles.length > 0 && <div className="section-title" style={{ marginTop: 16 }}>Archivos</div>}
                  {filteredFiles.map((f, j) => {
                    const idx = filteredApps.length + j;
                    const isFolder = f.type === 'folder' || f.type === 'drive';
                    return (
                      <div
                        key={f.id}
                        data-active={idx === active}
                        className={`result-item${idx === active ? ' result-active' : ''}`}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => openFile(f.id)}
                      >
                        <div className="result-left">
                           <div className="result-icon">{isFolder ? <Folder24Regular /> : <Document24Regular />}</div>
                           <div className="result-info">
                             <div className="result-name">{f.name}</div>
                             <div className="result-type">{isFolder ? 'Carpeta' : `Archivo${f.ext ? ` · ${f.ext}` : ''}`}</div>
                           </div>
                        </div>
                        <ChevronRight24Regular className="result-arrow" />
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="no-results">
                  <Globe24Regular style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }} />
                  <div>Buscar "{query}" en la web</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="search-footer">
          <div className="footer-item active"><Apps24Filled /><span>Todo</span></div>
          <div className="footer-item"><Grid24Filled /><span>Apps</span></div>
          <div className="footer-item"><Document24Regular /><span>Documentos</span></div>
          <div className="footer-item"><Globe24Regular /><span>Web</span></div>
        </div>
      </motion.div>

      <style>{`
        .search-overlay-mask {
          position: fixed;
          inset: 0;
          z-index: 1400;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding-bottom: calc(var(--taskbar-height) + 12px);
          background: rgba(0,0,0,0.01);
        }

        .search-pane {
          width: 740px;
          height: 640px;
          border-radius: 12px;
          background: var(--mica-bg);
          backdrop-filter: blur(50px) saturate(200%);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .search-header {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 2px solid var(--win-accent);
          background: rgba(0,0,0,0.2);
        }

        .search-icon-header { color: var(--win-accent); }
        .search-input-main {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-size: 15px;
          outline: none;
        }

        .search-body {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
          opacity: 0.9;
        }

        .top-apps-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }

        .top-app-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 16px;
          border-radius: 8px;
          transition: background 0.2s;
          cursor: pointer;
        }
        .top-app-item:hover { background: var(--hover-bg); }
        .top-app-icon { font-size: 32px; }
        .top-app-label { font-size: 12px; text-align: center; }

        .quick-search-list { display: flex; flex-direction: column; gap: 4px; }
        .quick-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }
        .quick-item:hover { background: var(--hover-bg); }
        .quick-icon { opacity: 0.6; display: inline-flex; font-size: 18px; }

        .search-results { display: flex; flex-direction: column; gap: 8px; }
        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .result-item:hover { background: var(--hover-bg); transform: scale(1.01); }
        .result-item.result-active { background: var(--hover-bg); outline: 1px solid var(--win-accent); }
        .result-left { display: flex; align-items: center; gap: 16px; }
        .result-icon { font-size: 28px; }
        .result-name { font-size: 14px; font-weight: 500; }
        .result-type { font-size: 11px; opacity: 0.6; }
        .result-arrow { opacity: 0.4; }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          opacity: 0.8;
          font-size: 14px;
        }

        .search-footer {
          height: 48px;
          background: rgba(0,0,0,0.1);
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 12px;
        }
        .footer-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          opacity: 0.7;
        }
        .footer-item:hover { background: var(--hover-bg); opacity: 1; }
        .footer-item.active { background: rgba(255,255,255,0.05); opacity: 1; font-weight: 600; }
        .footer-item span { margin-top: 2px; }
      `}</style>
    </div>
  );
};

export default SearchPane;
