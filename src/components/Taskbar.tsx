import React from 'react';
import {
  Grid24Filled,
  Search24Regular,
  Folder24Regular,
  Speaker224Regular,
  Wifi424Regular
} from '@fluentui/react-icons';
import { useWindowManager } from '../context/WindowManager';
import FileExplorer from './apps/FileExplorer';
import Cmd from './apps/Cmd';
import Vscode from './apps/VsCode';
import BrowserApp, { ChromeIcon } from './apps/BrowserApp';

import ContextMenu, { type ContextMenuOption } from './ContextMenu';

interface TaskbarProps {
  onStartClick: () => void;
  isStartOpen: boolean;
  onNotificationsClick?: () => void;
  onClockClick?: () => void;
  isNotificationsOpen?: boolean;
}

interface AppItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  component?: React.ReactNode;
}

const Taskbar: React.FC<TaskbarProps> = ({ 
  onStartClick, 
  isStartOpen, 
  onNotificationsClick, 
  onClockClick,
  isNotificationsOpen 
}) => {
  const { openWindow, windows, minimizeWindow, minimizeAllWindows, isWidgetsOpen, toggleWidgets, isDesktopSwitcherOpen, toggleDesktopSwitcher } = useWindowManager();
  const [startContextMenu, setStartContextMenu] = React.useState<{ isOpen: boolean; x: number; y: number }>({ isOpen: false, x: 0, y: 0 });
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const icons: AppItem[] = [
    { id: 'search', icon: <Search24Regular />, label: 'Buscar' },
    { id: 'files', icon: <Folder24Regular />, label: 'Explorador', component: <FileExplorer /> },
    { id: 'chrome', icon: <ChromeIcon />, label: 'Chrome', component: <BrowserApp /> },
    { 
      id: 'vscode', 
      icon: (
        <svg viewBox="0 0 100 100" width="24" height="24">
          <path d="M74.9 10.4L50 35.3l-11-11L10 42.8v14.4l11-8.2 11 11 28-28.9V74l-11-8-11 11 28.9 13L90 79V21z" fill="#007ACC"/>
        </svg>
      ), 
      label: 'VS Code', 
      component: <Vscode /> 
    },
  ];

  const handleAppClick = (app: AppItem) => {
    const existing = windows.find(w => w.id === app.id);
    if (existing) {
      if (existing.isMinimized) {
        openWindow(app.id, app.label, app.icon, null);
      } else {
        minimizeWindow(app.id);
      }
      return;
    }

    if (app.id === 'search') return;

    openWindow(
      app.id,
      app.label,
      app.icon,
      app.component || (
        <div className="p-4" style={{ color: 'white' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>{app.label}</h2>
          <p>This is a mockup of the {app.label} application.</p>
        </div>
      )
    );
  };

  const isAppOpen = (id: string) => windows.some(w => w.id === id);
  const isAppActive = (id: string) => windows.some(w => w.id === id && !w.isMinimized);

  const handleStartContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setStartContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  };

  const settingsApp = icons.find((i) => i.id === 'settings');
  const fileExplorerApp = icons.find((i) => i.id === 'files');

  const startMenuOptions: ContextMenuOption[] = [
    { label: 'Aplicaciones y características', onClick: () => settingsApp && handleAppClick(settingsApp) },
    { label: 'Centro de movilidad', onClick: () => {}, disabled: true },
    { label: 'Opciones de energía', onClick: () => settingsApp && handleAppClick(settingsApp) },
    { label: 'Visor de eventos', onClick: () => {}, disabled: true },
    { label: 'Sistema', onClick: () => settingsApp && handleAppClick(settingsApp), divider: true },
    { label: 'Administrador de dispositivos', onClick: () => {}, disabled: true },
    { label: 'Conexiones de red', onClick: () => settingsApp && handleAppClick(settingsApp) },
    { label: 'Administración de discos', onClick: () => {}, disabled: true },
    { label: 'Administración de equipos', onClick: () => {}, disabled: true },
    { label: 'Terminal de Windows', onClick: () => openWindow('cmd', 'Terminal', <span style={{ fontFamily: 'Consolas, monospace', fontSize: 18 }}>C:\\</span>, <Cmd />), divider: true },
    { label: 'Administrador de tareas', onClick: () => openWindow('taskmanager', 'Administrador de tareas', <Grid24Filled />, <div className="p-4" style={{color: 'white'}}><h2 style={{fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold'}}>Administrador de tareas</h2><p>Esta es una simulación del Administrador de tareas.</p></div>) },
    { label: 'Configuración', onClick: () => settingsApp && handleAppClick(settingsApp) },
    { label: 'Explorador de archivos', onClick: () => fileExplorerApp && handleAppClick(fileExplorerApp) },
    { label: 'Buscar', onClick: () => onStartClick(), divider: true },
    { label: 'Ejecutar', onClick: () => {}, disabled: true, divider: true },
    { 
      label: 'Apagar o cerrar sesión', 
      onClick: () => {}, 
      submenu: [
        { label: 'Cerrar sesión', onClick: () => {}, disabled: true },
        { label: 'Suspender', onClick: () => {}, disabled: true },
        { label: 'Apagar', onClick: () => window.location.reload() },
        { label: 'Reiniciar', onClick: () => window.location.reload() }
      ],
      divider: true
    },
    { label: 'Escritorio', onClick: minimizeAllWindows }
  ];

  return (
    <div className="taskbar acrylic">
      {startContextMenu.isOpen && (
        <ContextMenu
          x={startContextMenu.x}
          y={startContextMenu.y}
          onClose={() => setStartContextMenu({ ...startContextMenu, isOpen: false })}
          options={startMenuOptions}
        />
      )}
      <div className="taskbar-container">
        <div className="taskbar-left"></div>

        <div className="taskbar-center">
          <button
            className={`taskbar-icon start-button ${isStartOpen ? 'active' : ''}`}
            onClick={onStartClick}
            onContextMenu={handleStartContextMenu}
            title="Inicio"
          >
            <Grid24Filled primaryFill="#0078d4" />
          </button>

          <button
            className={`taskbar-icon ${isDesktopSwitcherOpen ? 'active' : ''}`}
            title="Vista de tareas"
            onClick={(e) => { e.stopPropagation(); toggleDesktopSwitcher(); }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 5h16v2H4V5zm0 6h16v2H4v-2zm0 6h16v2H4v-2z" /></svg>
          </button>

          <button
            className={`taskbar-icon ${isWidgetsOpen ? 'active' : ''}`}
            title="Widgets"
            onClick={(e) => { e.stopPropagation(); toggleWidgets(); }}
          >
            <Grid24Filled />
          </button>

          <div className="taskbar-search-wrapper" onClick={(e) => { e.stopPropagation(); onStartClick(); }}>
            <Search24Regular />
            <input
              type="text"
              className="taskbar-search-input"
              placeholder="Buscar"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onStartClick();
              }}
            />
          </div>

          {icons.filter(item => item.id !== 'search').map((item, index) => (
            <button
              key={index}
              className={`taskbar-icon ${isAppOpen(item.id) ? 'open' : ''} ${isAppActive(item.id) ? 'active' : ''}`}
              title={item.label}
              onClick={() => handleAppClick(item)}
            >
              {item.icon}
            </button>
          ))}
        </div>

        <div className="taskbar-right">
          <div className="tray-icons" onClick={(e) => { e.stopPropagation(); onNotificationsClick?.(); }} style={{ cursor: 'pointer' }}>
            <div className="tray-icon px-1" title="Mostrar íconos ocultos">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M6.7 14.7a1 1 0 0 1-1.4-1.4l6-6a1 1 0 0 1 1.4 0l6 6a1 1 0 1 1-1.4 1.4L12 9.4z" />
              </svg>
            </div>
            
            <div className="tray-icon px-2 gap-2" title="El tiempo">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M6.5 17.5A4.5 4.5 0 0 1 2 13c0-2.3 1.8-4.2 4-4.5A7.5 7.5 0 0 1 20 11.5a4.5 4.5 0 0 1-5 6h-8.5z" />
              </svg>
            </div>
            
            <div className="tray-icon px-2" title="Idiomas asombrosos">
              <span style={{ fontSize: '11px', lineHeight: 1.1, textAlign: 'center', fontWeight: 500 }}>
                ESP<br/>LAA
              </span>
            </div>
            
            <div className="tray-icon px-2 gap-2" title="Internet y Audio" style={{ marginRight: '4px' }}>
              <Wifi424Regular width="18" height="18" style={{ transform: 'scale(0.85)' }} />
              <Speaker224Regular width="18" height="18" style={{ transform: 'scale(0.85)' }} />
            </div>
          </div>

          <div 
            className={`time-date ${isNotificationsOpen ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onClockClick?.(); }}
          >
            <span className="time">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="date">
              {time.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .taskbar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          max-width: 100%;
          height: var(--taskbar-height);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(28, 28, 28, 0.92);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.08), 0 -2px 10px rgba(0, 0, 0, 0.35);
          border-radius: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .taskbar-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          position: relative;
        }

        .taskbar-left,
        .taskbar-center,
        .taskbar-right {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .taskbar-left {
          gap: 4px;
        }

        .taskbar-center {
          flex: 1;
          justify-content: center;
          gap: 4px;
        }

        .taskbar-right {
          gap: 4px;
        }

        .taskbar-search-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.24);
          border-radius: 999px;
          height: 34px;
          padding: 0 10px;
          min-width: 210px;
          overflow: hidden;
          cursor: text;
          transition: background 0.2s, border-color 0.2s;
        }

        .taskbar-search-wrapper:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.32);
        }

        .taskbar-search-input {
          background: transparent;
          border: none;
          outline: none;
          color: rgba(255,255,255,0.95);
          width: 100%;
          min-width: 100px;
          font-size: 13px;
          font-weight: 500;
        }

        .taskbar-search-input::placeholder {
          color: rgba(255,255,255,0.75);
        }

        .taskbar-icon {
          position: relative;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.9);
          width: 40px;
          height: 40px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .taskbar-icon:hover {
          background: var(--hover-bg);
          transform: translateY(-1px);
        }

        .taskbar-icon.open::after {
          content: '';
          position: absolute;
          bottom: 2px;
          width: 6px;
          height: 3px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 2px;
        }

        .taskbar-icon.active::after {
          background: var(--win-blue);
          width: 12px;
        }

        .taskbar-right {
          position: absolute;
          right: 4px;
          display: flex;
          align-items: center;
          height: 100%;
        }

        .tray-icons {
          display: flex;
          align-items: center;
          height: 100%;
        }
        
        .tray-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: calc(100% - 12px);
          margin: 0 1px;
          border-radius: 4px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.9);
          transition: background 0.2s;
        }

        .tray-icon:hover {
          background: var(--hover-bg);
          background-color: rgba(255,255,255,0.06);
        }

        .tray-icon.px-1 { padding: 0 8px; }
        .tray-icon.px-2 { padding: 0 10px; }
        .tray-icon.gap-2 { gap: 10px; }

        .time-date {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          font-size: 11px;
          cursor: pointer;
          padding: 4px 12px;
          border-radius: 4px;
          margin-left: 2px;
          transition: background 0.2s;
        }

        .time-date:hover, .time-date.active {
          background: var(--hover-bg);
          background-color: rgba(255,255,255,0.06);
        }

        .time { font-weight: 500; }
        .date { opacity: 0.7; }
      `}</style>
    </div>
  );
};

export default Taskbar;
