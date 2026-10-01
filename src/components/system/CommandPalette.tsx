import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search24Regular,
  Document24Regular,
  Folder24Regular,
  Apps24Regular,
  Flash24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { useLauncherApps } from '../../hooks/useLauncherApps';
import { useWindowManager } from '../../context/WindowManager';
import { useFileSystem } from '../../context/FileSystemContext';
import { useSettings } from '../../context/SettingsContext';
import { useUI } from '../../context/UIContext';
import { resolveDefaultOpen } from '../../utils/fileAssociations';
import { recentAppsWithIcons } from '../../utils/recentApps';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onShutdown: () => void;
  onRestart: () => void;
}

type Entry = {
  key: string;
  section: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  run: () => void;
};

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onShutdown, onRestart }) => {
  const apps = useLauncherApps();
  const { openWindow, minimizeAllWindows } = useWindowManager();
  const { files } = useFileSystem();
  const {
    setIsTaskViewOpen,
    lockSystem,
    setIsDoNotDisturb,
    isDoNotDisturb,
    setIsPerformanceMode,
    isPerformanceMode,
    toggleTheme,
    addNotification,
  } = useSettings();
  const { toggleAssistant } = useUI();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // El padre monta el componente solo al abrir (mount → estado fresco).
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [isOpen]);

  const updateQuery = (v: string) => {
    setQuery(v);
    setActive(0);
  };

  const actions: Entry[] = useMemo(
    () => [
      { key: 'act-assistant', section: 'Acciones', label: 'Abrir Nex Assistant', sub: 'IA del sistema', icon: <Flash24Regular />, run: () => toggleAssistant() },
      { key: 'act-taskview', section: 'Acciones', label: 'Vista de tareas', sub: 'Ctrl+Alt+T', icon: <Apps24Regular />, run: () => setIsTaskViewOpen(true) },
      { key: 'act-desktop', section: 'Acciones', label: 'Mostrar escritorio', sub: 'Minimizar todo', icon: <Apps24Regular />, run: () => minimizeAllWindows() },
      { key: 'act-dnd', section: 'Acciones', label: isDoNotDisturb ? 'Desactivar No molestar' : 'Activar No molestar', sub: 'Notificaciones', icon: <Dismiss24Regular />, run: () => { setIsDoNotDisturb(!isDoNotDisturb); addNotification('No molestar', isDoNotDisturb ? 'Notificaciones activadas' : 'Notificaciones silenciadas'); } },
      { key: 'act-perf', section: 'Acciones', label: isPerformanceMode ? 'Desactivar modo rendimiento' : 'Activar modo rendimiento', sub: 'Desactiva 3D y animaciones', icon: <Flash24Regular />, run: () => setIsPerformanceMode(!isPerformanceMode) },
      { key: 'act-theme', section: 'Acciones', label: 'Cambiar tema claro / oscuro', sub: 'Apariencia', icon: <Apps24Regular />, run: () => toggleTheme() },
      { key: 'act-lock', section: 'Acciones', label: 'Bloquear equipo', sub: 'Ir a login', icon: <Dismiss24Regular />, run: () => lockSystem() },
      { key: 'act-restart', section: 'Acciones', label: 'Reiniciar', sub: 'Sistema', icon: <Dismiss24Regular />, run: () => onRestart() },
      { key: 'act-shutdown', section: 'Acciones', label: 'Apagar', sub: 'Sistema', icon: <Dismiss24Regular />, run: () => onShutdown() },
    ],
    [toggleAssistant, setIsTaskViewOpen, minimizeAllWindows, isDoNotDisturb, setIsDoNotDisturb, addNotification, isPerformanceMode, setIsPerformanceMode, toggleTheme, lockSystem, onRestart, onShutdown],
  );

  // Recientes frescos en cada apertura (el padre monta al abrir).
  // Lista corta (máx. 8): recalcular por render es despreciable.
  const recents: Entry[] = recentAppsWithIcons().map((r) => ({
    key: `recent-${r.id}-${r.appId}`,
    section: 'Recientes',
    label: r.title,
    sub: 'App reciente',
    icon: r.icon,
    run: () => openWindow(r.id, r.appId, r.title, r.icon),
  }));

  const results: Entry[] = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return [...recents.slice(0, 5), ...actions.slice(0, 4)];
    const out: Entry[] = [];
    const match = (label: string, extra = '') => {
      const hay = norm(`${label} ${extra}`);
      if (hay.startsWith(q)) return 0;
      if (hay.includes(q)) return 1;
      return -1;
    };
    apps.forEach((app) => {
      const score = match(app.label, app.id);
      if (score >= 0) {
        out.push({
          key: `app-${app.id}`,
          section: 'Aplicaciones',
          label: app.label,
          sub: score === 0 ? 'App · coincidencia exacta' : 'Aplicación',
          icon: app.icon,
          run: () => openWindow(app.id, app.appId, app.label, app.icon),
        });
      }
    });
    files
      .filter((f) => f.type === 'file' || f.type === 'folder')
      .forEach((f) => {
        const score = match(f.name, f.ext || '');
        if (score >= 0 && out.length < 24) {
          const isFolder = f.type === 'folder' || f.type === 'drive';
          out.push({
            key: `file-${f.id}`,
            section: 'Archivos',
            label: f.name,
            sub: isFolder ? 'Carpeta' : `Archivo${f.ext ? ` · ${f.ext}` : ''}`,
            icon: isFolder ? <Folder24Regular /> : <Document24Regular />,
            run: () => {
              if (isFolder) {
                openWindow('file-explorer', 'file-explorer', 'Explorador de archivos', <Folder24Regular />);
                return;
              }
              if (f.ext === 'nex' && f.nexPayload) {
                openWindow(f.nexPayload.appId, f.nexPayload.appId, f.nexPayload.title, <Flash24Regular />);
                return;
              }
              const target = resolveDefaultOpen({ id: f.id, name: f.name, ext: f.ext, imageUrl: f.imageUrl });
              if (target) openWindow(target.windowId, target.appId, target.title, target.icon, target.appProps);
              else openWindow('file-explorer', 'file-explorer', 'Explorador de archivos', <Folder24Regular />);
            },
          });
        }
      });
    actions.forEach((a) => {
      if (match(a.label, a.sub) >= 0) out.push(a);
    });
    return out.slice(0, 14);
  }, [query, apps, files, actions, recents, openWindow]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!isOpen) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[active];
      if (item) {
        item.run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastSection = '';
  return (
    <div className="cmdk-mask" onClick={onClose}>
      <div className="cmdk mica" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Paleta de comandos">
        <div className="cmdk-header">
          <Search24Regular className="cmdk-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Buscar apps, archivos y acciones…"
            className="cmdk-input"
            aria-label="Buscar"
          />
          <kbd className="cmdk-kbd">esc</kbd>
        </div>
        <div className="cmdk-list" ref={listRef}>
          {results.length === 0 && (
            <div className="cmdk-empty">Sin resultados para “{query}”.</div>
          )}
          {results.map((item, i) => {
            const header = item.section !== lastSection ? item.section : null;
            lastSection = item.section;
            return (
              <React.Fragment key={item.key}>
                {header && <div className="cmdk-section">{header}</div>}
                <div
                  data-active={i === active}
                  className={`cmdk-item${i === active ? ' active' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                >
                  <span className="cmdk-item-icon">{item.icon}</span>
                  <span className="cmdk-item-text">
                    <span className="cmdk-item-label">{item.label}</span>
                    <span className="cmdk-item-sub">{item.sub}</span>
                  </span>
                  {i === active && <kbd className="cmdk-kbd">↵</kbd>}
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <div className="cmdk-footer">
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>esc</kbd> cerrar</span>
        </div>
        <style>{`
          .cmdk-mask {
            position: fixed; inset: 0; z-index: 1600;
            display: flex; justify-content: center; align-items: flex-start;
            padding-top: 12vh; background: rgba(0,0,0,0.45);
          }
          .cmdk {
            width: min(560px, calc(100vw - 32px)); max-height: 60vh;
            display: flex; flex-direction: column; overflow: hidden;
            border-radius: 10px; background: var(--mica-bg);
            backdrop-filter: blur(40px) saturate(180%);
            border: 1px solid var(--border-color);
            box-shadow: 0 24px 64px rgba(0,0,0,0.5);
            font-family: 'Segoe UI', system-ui, sans-serif; color: white;
          }
          .cmdk-header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border-color); }
          .cmdk-icon { color: var(--win-accent); flex-shrink: 0; }
          .cmdk-input { flex: 1; background: transparent; border: none; outline: none; color: white; font-size: 15px; font-family: inherit; }
          .cmdk-input::placeholder { color: rgba(255,255,255,0.45); }
          .cmdk-kbd { font-family: inherit; font-size: 11px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 6px; color: rgba(255,255,255,0.7); }
          .cmdk-list { overflow-y: auto; padding: 8px; }
          .cmdk-section { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; color: rgba(255,255,255,0.5); padding: 10px 10px 4px; }
          .cmdk-item { display: flex; align-items: center; gap: 12px; padding: 9px 10px; border-radius: 6px; cursor: pointer; }
          .cmdk-item.active { background: var(--hover-bg); outline: 1px solid var(--win-accent); }
          .cmdk-item-icon { font-size: 20px; display: flex; flex-shrink: 0; }
          .cmdk-item-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
          .cmdk-item-label { font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .cmdk-item-sub { font-size: 11px; color: rgba(255,255,255,0.5); }
          .cmdk-empty { padding: 28px; text-align: center; font-size: 13px; color: rgba(255,255,255,0.6); }
          .cmdk-footer { display: flex; gap: 14px; padding: 8px 16px; border-top: 1px solid var(--border-color); font-size: 11px; color: rgba(255,255,255,0.55); }
        `}</style>
      </div>
    </div>
  );
};

export default CommandPalette;
