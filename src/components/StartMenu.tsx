import React, { useState } from 'react';
import { 
  Search24Regular, 
  Globe24Regular, 
  Mail24Regular, 
  Calendar24Regular, 
  Desktop24Regular, 
  Settings24Regular, 
  Image24Regular, 
  Video24Regular, 
  Document24Regular, 
  Speaker224Regular, 
  Power24Regular, 
  Person24Regular, 
  WeatherCloudy24Regular,
  Calculator24Regular,
  Folder24Regular
} from '@fluentui/react-icons';
import { useWindowManager } from '../context/WindowManager';
import FileExplorer from './apps/FileExplorer';
import Notepad from './apps/Notepad';
import Calculator from './apps/Calculator';
import Cmd from './apps/Cmd';
import Settings from './apps/Settings';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onWallpaperChange: (url: string) => void;
  onShutdown: () => void;
}

const StartMenu: React.FC<StartMenuProps> = ({ isOpen, onClose, onWallpaperChange, onShutdown }) => {
  const { openWindow } = useWindowManager();
  const [searchQuery, setSearchQuery] = useState('');

  const pinnedApps = [
    { id: 'browser', icon: <Globe24Regular />, name: 'Edge', color: '#0078d4' },
    { id: 'files', icon: <Folder24Regular />, name: 'Explorer', color: '#f1c40f', component: <FileExplorer /> },
    { id: 'notepad', icon: <Document24Regular />, name: 'Notepad', color: '#4CAF50', component: <Notepad /> },
    { id: 'calculator', icon: <Calculator24Regular />, name: 'Calc', color: '#D32F2F', component: <Calculator /> },
    { id: 'cmd', icon: <span style={{ fontFamily: 'Consolas, monospace', fontSize: 18 }}>C:\\</span>, name: 'Terminal', color: '#64b5f6', component: <Cmd /> },
    { id: 'settings', icon: <Settings24Regular />, name: 'Settings', color: '#757575', component: <Settings onWallpaperChange={onWallpaperChange} /> },
    { id: 'mail', icon: <Mail24Regular />, name: 'Mail', color: '#EA4335' },
    { id: 'calendar', icon: <Calendar24Regular />, name: 'Calendar', color: '#34A853' },
    { id: 'photos', icon: <Image24Regular />, name: 'Photos', color: '#9C27B0' },
    { id: 'weather', icon: <WeatherCloudy24Regular />, name: 'Weather', color: '#FBBC05' },
    { id: 'desktop', icon: <Desktop24Regular />, name: 'Desktop', color: '#0078d4' },
  ];

  const recommended = [
    { name: 'Financial Report', date: 'Recently added' },
    { name: 'Vacation Photos', date: '2h ago' },
    { name: 'Project Roadmap', date: 'Yesterday' },
    { name: 'Meeting Notes', date: 'March 20' },
  ];

  const filteredApps = pinnedApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAppClick = (app: any) => {
    openWindow(
      app.id, 
      app.name, 
      app.icon, 
      app.component || (
        <div className="p-4" style={{ color: 'white' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>{app.name}</h2>
          <p>Mockup content for {app.name}.</p>
        </div>
      )
    );
    onClose();
  };

  return (
    isOpen && (
      <div
        className="start-menu mica premium-shadow"
        onClick={(e) => e.stopPropagation()}
      >
          <div className="start-menu-inner">
            <div className="search-container">
              <div className="search-box">
                <Search24Regular className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search for apps, settings, and documents" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="scroll-content">
              <div className="section">
                <div className="section-header">
                  <h3>Pinned</h3>
                  <button className="section-action">All apps &gt;</button>
                </div>
                <div className="apps-grid">
                  {filteredApps.map((app, index) => (
                    <button key={index} className="app-btn" onClick={() => handleAppClick(app)}>
                      <div className="app-icon-wrapper" style={{ color: app.color }}>
                        {app.icon}
                      </div>
                      <span className="app-label">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <h3>Recommended</h3>
                  <button className="section-action">More &gt;</button>
                </div>
                <div className="recommended-grid">
                  {recommended.map((item, index) => (
                    <button key={index} className="rec-item">
                      <div className="rec-icon">
                        <Document24Regular />
                      </div>
                      <div className="rec-text">
                        <span className="rec-name">{item.name}</span>
                        <span className="rec-sub">{item.date}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="start-footer">
              <div className="user-area">
                <div className="user-avatar">
                  <Person24Regular />
                </div>
                <span className="user-name">Martín</span>
              </div>
              <button className="power-btn" onClick={onShutdown}>
                <Power24Regular />
              </button>
            </div>
          </div>

          <style>{`
            .start-menu {
              position: fixed;
              bottom: calc(var(--taskbar-height) + 12px);
              left: 50%;
              transform: translateX(-50%);
              width: 600px;
              height: 500px;
              border-radius: 8px;
              z-index: 1001;
              display: flex;
              flex-direction: column;
              background: rgba(32, 32, 32, 0.95);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            }

            .start-menu-inner {
              height: 100%;
              display: flex;
              flex-direction: column;
              padding: 32px 0 0 0;
              position: relative;
            }

            .search-container {
              padding: 0 32px 32px 32px;
            }

            .search-box {
              background: rgba(0, 0, 0, 0.2);
              border-bottom: 2px solid var(--win-blue);
              border-radius: 4px;
              padding: 8px 16px;
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .search-box input {
              background: transparent;
              border: none;
              color: white;
              flex: 1;
              outline: none;
              font-size: 14px;
            }

            .scroll-content {
              flex: 1;
              overflow-y: auto;
              padding: 0 32px;
            }

            .section {
              margin-bottom: 32px;
            }

            .section-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }

            .section-header h3 {
              font-size: 13px;
              font-weight: 600;
              margin: 0;
            }

            .section-action {
              background: rgba(255, 255, 255, 0.08);
              border: none;
              color: white;
              font-size: 12px;
              padding: 4px 8px;
              border-radius: 4px;
              cursor: pointer;
            }

            .apps-grid {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 8px;
            }

            .app-btn {
              background: transparent;
              border: none;
              color: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
              padding: 12px 4px;
              border-radius: 4px;
              cursor: pointer;
            }

            .app-btn:hover {
              background: var(--hover-bg);
            }

            .app-icon-wrapper {
              font-size: 24px;
            }

            .app-label {
              font-size: 12px;
              text-align: center;
            }

            .recommended-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }

            .rec-item {
              background: transparent;
              border: none;
              color: white;
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 8px 12px;
              border-radius: 4px;
              cursor: pointer;
              text-align: left;
            }

            .rec-item:hover {
              background: var(--hover-bg);
            }

            .rec-icon {
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 4px;
            }

            .rec-text {
              display: flex;
              flex-direction: column;
            }

            .rec-name {
              font-size: 12px;
              font-weight: 500;
            }

            .rec-sub {
              font-size: 11px;
              opacity: 0.6;
            }

            .start-footer {
              background: rgba(0, 0, 0, 0.2);
              padding: 16px 48px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 12px;
            }

            .user-area {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 4px 12px;
              border-radius: 4px;
              cursor: pointer;
            }

            .user-area:hover {
              background: var(--hover-bg);
            }

            .user-avatar {
              width: 32px;
              height: 32px;
              background: var(--win-blue);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .power-btn {
              background: transparent;
              border: none;
              color: white;
              padding: 8px;
              border-radius: 4px;
              cursor: pointer;
            }

            .power-btn:hover {
              background: var(--hover-bg);
            }
          `}</style>
        </div>
      )
  );
};

export default StartMenu;
