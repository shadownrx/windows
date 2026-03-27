import React, { useState } from 'react';
import { Checkmark20Regular } from '@fluentui/react-icons';

interface NotificationsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsMenu: React.FC<NotificationsMenuProps> = ({ isOpen, onClose }) => {
  const [toggles, setToggles] = useState({ wifi: true, bluetooth: true, airplane: false, nightLight: false, focusAssist: false });
  const [volume, setVolume] = useState(48);
  const [brightness, setBrightness] = useState(62);

  const toggleSetting = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  
  if (!isOpen) return null;


  return (
    <div className="notifications-menu mica premium-shadow" onClick={(e) => e.stopPropagation()}>
      <div className="media-card">
        <div className="media-info">
          <strong>Google Chrome</strong>
          <span>MATISSE & SADKO LIVE SET</span>
        </div>
        <div className="media-controls">
          <button>&lt;&lt;</button>
          <button>||</button>
          <button>&gt;&gt;</button>
        </div>
      </div>

      <div className="quick-actions">
        <button className={toggles.wifi ? 'active' : ''} onClick={() => toggleSetting('wifi')}>Wi-Fi</button>
        <button className={toggles.bluetooth ? 'active' : ''} onClick={() => toggleSetting('bluetooth')}>Bluetooth</button>
        <button className={toggles.airplane ? 'active' : ''} onClick={() => toggleSetting('airplane')}>Avión</button>
        <button className={toggles.nightLight ? 'active' : ''} onClick={() => toggleSetting('nightLight')}>Luz nocturna</button>
        <button className={toggles.focusAssist ? 'active' : ''} onClick={() => toggleSetting('focusAssist')}>Asistente</button>
      </div>

      <div className="slider-group">
        <label>Brillo</label>
        <input type="range" min="0" max="100" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
        <span>{brightness}%</span>
      </div>

      <div className="slider-group">
        <label>Volumen</label>
        <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        <span>{volume}%</span>
      </div>

      <div className="notifications-footer">
        <span>100%</span>
        <button onClick={() => window.alert('Abrir configuración de energía')}>⚙</button>
      </div>

      <style>{`
        .notifications-menu {
          position: fixed;
          bottom: calc(var(--taskbar-height) + 12px);
          right: 12px;
          width: 360px;
          height: 640px;
          border-radius: var(--win-radius);
          display: flex;
          flex-direction: column;
          z-index: 1101;
          animation: slideUp 0.3s cubic-bezier(0.2, 0, 0, 1);
          color: white;
          overflow: hidden;
        }

        .media-card {
          padding: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.13);
        }

        .media-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .media-info strong {
          color: white;
          font-size: 13px;
        }

        .media-info span {
          font-size: 11px;
          color: rgba(255,255,255,0.75);
        }

        .media-controls button {
          background: rgba(255,255,255,0.08);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          width: 28px;
          height: 28px;
          margin-left: 4px;
          cursor: pointer;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(90px, 1fr));
          gap: 8px;
          padding: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.13);
        }

        .quick-actions button {
          padding: 10px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
          border-radius: 10px;
          color: white;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-actions button.active {
          background: rgba(0, 120, 215, 0.85);
          border-color: rgba(0, 120, 215, 0.95);
          color: white;
        }

        .slider-group {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
        }

        .slider-group label {
          width: 60px;
          color: rgba(255,255,255,0.82);
          font-size: 12px;
        }

        .slider-group input[type='range'] {
          flex: 1;
          accent-color: #0078d4;
        }

        .slider-group span {
          width: 36px;
          text-align: right;
          color: rgba(255,255,255,0.85);
          font-size: 11px;
        }

        .notifications-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          border-top: 1px solid rgba(255,255,255,0.13);
          font-size: 12px;
          color: rgba(255,255,255,0.8);
        }

        .notifications-footer button {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.9);
          font-size: 16px;
          cursor: pointer;
        }

        .empty-notifications {
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0.6;
          font-size: 14px;
        }

        .calendar-section {
          height: 340px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.1);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .calendar-month {
          font-size: 14px;
          font-weight: 600;
        }

        .calendar-nav {
          display: flex;
          gap: 4px;
        }

        .calendar-nav button {
          background: transparent;
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .calendar-nav button:hover {
          background: var(--hover-bg);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .calendar-weekday {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          opacity: 0.9;
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .calendar-day.empty {
          visibility: hidden;
        }

        .day-number {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          border: 1px solid transparent;
        }

        .calendar-day:not(.empty) .day-number:hover {
          background: var(--hover-bg);
        }

        .calendar-day.today .day-number {
          background: var(--win-blue);
          color: white;
          font-weight: 600;
        }
        
        .calendar-day.today .day-number:hover {
          background: #006abc;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationsMenu;
