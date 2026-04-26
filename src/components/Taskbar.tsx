import React from 'react';
import {
  Grid24Filled,
  Search24Regular,
  Speaker224Regular,
  Wifi424Regular,
  Calendar24Regular,
  WifiWarning24Regular,
  SpeakerMute24Regular,
} from '@fluentui/react-icons';
import { useWindowManager } from '../context/WindowManager';
import { useUI } from '../context/UIContext';
import { useSettings } from '../context/SettingsContext';
import { APPS, type AppItem } from '../constants/apps';
import ContextMenu, { type ContextMenuOption } from './ContextMenu';

interface TaskbarProps {
  onStartClick: () => void;
  isStartOpen: boolean;
  onNotificationsClick?: () => void;
  onClockClick?: () => void;
  isNotificationsOpen?: boolean;
  onShutdown?: () => void;
  onRestart?: () => void;
  onSearchClick?: () => void;
}

const Taskbar: React.FC<TaskbarProps> = ({ 
  onStartClick, 
  isStartOpen, 
  onNotificationsClick, 
  onClockClick,
  isNotificationsOpen,
  onShutdown,
  onRestart,
  onSearchClick,
}) => {
  const { openWindow, windows, minimizeWindow, focusedWindowId } = useWindowManager();
  const { isWidgetsOpen, toggleWidgets } = useUI();
  const { isWifiEnabled, volume, isTaskViewOpen, setIsTaskViewOpen, notifications } = useSettings();
  const [startContextMenu, setStartContextMenu] = React.useState<{ isOpen: boolean; x: number; y: number }>({ isOpen: false, x: 0, y: 0 });
  const [taskbarContextMenu, setTaskbarContextMenu] = React.useState<{ isOpen: boolean; x: number; y: number }>({ isOpen: false, x: 0, y: 0 });
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAppClick = (app: AppItem) => {
    const existing = windows.find(w => w.id === app.id);
    if (existing) {
      if (existing.isMinimized) {
        openWindow(app.id, app.label, app.icon, app.component({}));
      } else {
        minimizeWindow(app.id);
      }
      return;
    }
    openWindow(app.id, app.label, app.icon, app.component({}));
  };

  return (
    <footer className="taskbar-container mica gpu-accelerated">
      <div className="taskbar-left">
        <button 
          className={`taskbar-icon ${isWidgetsOpen ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleWidgets(); }}
        >
          <Grid24Filled />
        </button>
      </div>

      <div className="taskbar-center">
        {/* START BUTTON */}
        <button 
          className={`taskbar-icon start-btn ${isStartOpen ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onStartClick(); }}
        >
          <Grid24Filled primaryFill="#0078d4" />
        </button>

        {/* SEARCH BAR (MODERNA) */}
        <div className="taskbar-search-pill" onClick={(e) => { e.stopPropagation(); onSearchClick?.(); }}>
          <Search24Regular className="search-pill-icon" />
          <span>Buscar</span>
        </div>

        {/* PINNED APPS */}
        <div className="taskbar-apps">
          {APPS.filter(a => a.id !== 'search').map(app => {
            const isOpen = windows.some(w => w.id === app.id);
            const isFocused = focusedWindowId === app.id;
            return (
              <button 
                key={app.id}
                className={`taskbar-app-icon ${isOpen ? 'open' : ''} ${isFocused ? 'focused' : ''}`}
                onClick={() => handleAppClick(app)}
                title={app.label}
              >
                <div className="app-icon-inner">{app.icon}</div>
                {isOpen && <div className="app-indicator" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="taskbar-right">
        <div className="system-tray" onClick={(e) => { e.stopPropagation(); onNotificationsClick?.(); }}>
          {isWifiEnabled ? <Wifi424Regular /> : <WifiWarning24Regular />}
          {volume > 0 ? <Speaker224Regular /> : <SpeakerMute24Regular />}
          <div className="notifications-badge-container">
            {notifications.length > 0 && <div className="notifications-badge">{notifications.length}</div>}
          </div>
        </div>

        <div className="taskbar-clock" onClick={(e) => { e.stopPropagation(); onClockClick?.(); }}>
          <div className="time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="date">{time.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
        </div>
        
        <div className="show-desktop" onClick={() => {}} />
      </div>

      <style>{`
        .taskbar-container {
          position: fixed;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 16px);
          max-width: 1400px;
          height: var(--taskbar-height);
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          z-index: 10000;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .taskbar-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .taskbar-search-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.05);
          height: 34px;
          padding: 0 20px 0 12px;
          border-radius: 17px;
          cursor: pointer;
          transition: all 0.2s;
          margin: 0 4px;
        }
        .taskbar-search-pill:hover { background: rgba(255,255,255,0.12); width: 160px; }
        .taskbar-search-pill span { font-size: 13px; color: rgba(255,255,255,0.9); }
        .search-pill-icon { color: var(--win-accent); font-size: 18px; }

        .taskbar-apps { display: flex; align-items: center; gap: 4px; }
        .taskbar-app-icon {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        .taskbar-app-icon:hover { background: rgba(255,255,255,0.1); }
        .taskbar-app-icon.focused { background: rgba(255,255,255,0.15); }
        .app-icon-inner { font-size: 24px; transition: transform 0.2s; }
        .taskbar-app-icon:active .app-icon-inner { transform: scale(0.85); }
        
        .app-indicator {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 3px;
          background: var(--win-accent);
          border-radius: 2px;
          transition: width 0.2s;
        }
        .taskbar-app-icon.focused .app-indicator { width: 12px; }

        .taskbar-right { display: flex; align-items: center; gap: 4px; }
        .system-tray, .taskbar-clock {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .system-tray:hover, .taskbar-clock:hover { background: rgba(255,255,255,0.1); }
        .taskbar-clock { flex-direction: column; align-items: flex-end; gap: 0; }
        .taskbar-clock .time { font-size: 12px; }
        .taskbar-clock .date { font-size: 11px; opacity: 0.8; }

        .notifications-badge-container { position: relative; margin-left: 2px; }
        .notifications-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--win-accent);
          color: black;
          font-size: 10px;
          font-weight: bold;
          min-width: 14px;
          height: 14px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }

        .show-desktop {
          width: 5px;
          height: 32px;
          border-left: 1px solid rgba(255,255,255,0.1);
          margin-left: 4px;
        }
      `}</style>
    </footer>
  );
};

export default Taskbar;
