import React, { useState } from 'react';
import { 
  Wifi124Regular, 
  Bluetooth24Regular, 
  Airplane24Regular, 
  WeatherMoon24Regular, 
  Settings24Regular,
  Speaker224Regular,
  BrightnessHigh24Regular
} from '@fluentui/react-icons';

interface NotificationsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsMenu: React.FC<NotificationsMenuProps> = ({ isOpen }) => {
  const [toggles, setToggles] = useState({ wifi: true, bluetooth: true, airplane: false, nightLight: false, focusAssist: false });
  const [volume, setVolume] = useState(48);
  const [brightness, setBrightness] = useState(62);

  const toggleSetting = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  
  if (!isOpen) return null;

  return (
    <div className="win11-notif-panel premium-shadow" onClick={(e) => e.stopPropagation()}>
      {/* SECCIÓN DE MEDIOS (Estilo Floating Card) */}
      <div className="media-section">
        <div className="media-info">
          <span className="source-app">Google Chrome</span>
          <strong className="track-name">MATISSE & SADKO LIVE SET</strong>
        </div>
        <div className="media-controls">
          <button className="media-btn">⏮</button>
          <button className="media-btn play">II</button>
          <button className="media-btn">⏭</button>
        </div>
      </div>

      {/* ACCIONES RÁPIDAS (Grid de Win11) */}
      <div className="quick-settings-grid">
        {[
          { key: 'wifi', label: 'Wi-Fi', icon: <Wifi124Regular /> },
          { key: 'bluetooth', label: 'Bluetooth', icon: <Bluetooth24Regular /> },
          { key: 'airplane', label: 'Avión', icon: <Airplane24Regular /> },
          { key: 'nightLight', label: 'Luz nocturna', icon: <WeatherMoon24Regular /> },
        ].map((item) => (
          <div key={item.key} className="qs-item-container">
            <button 
              className={`qs-button ${toggles[item.key as keyof typeof toggles] ? 'active' : ''}`}
              onClick={() => toggleSetting(item.key as keyof typeof toggles)}
            >
              <span className="qs-icon">{item.icon}</span>
            </button>
            <span className="qs-label">{item.label}</span>
          </div>
        ))}
      </div>

      <hr className="win-divider" />

      {/* SLIDERS REFINADOS */}
      <div className="sliders-section">
        <div className="slider-row">
          <BrightnessHigh24Regular className="slider-icon" />
          <input type="range" className="win-range" min="0" max="100" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} />
        </div>
        <div className="slider-row">
          <Speaker224Regular className="slider-icon" />
          <input type="range" className="win-range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        </div>
      </div>

      {/* FOOTER DE ESTADO */}
      <div className="panel-footer">
        <div className="battery-status">
          <span className="battery-icon">🔋</span>
          <span>100%</span>
        </div>
        <div className="footer-actions">
          <button className="footer-btn" onClick={() => window.alert('Settings')}><Settings24Regular /></button>
        </div>
      </div>

      <style>{`
        .win11-notif-panel {
          position: fixed;
          bottom: calc(var(--taskbar-height) + 12px);
          right: 12px;
          width: 360px;
          background: rgba(28, 28, 28, 0.75);
          backdrop-filter: blur(25px) saturate(1.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          z-index: 1500;
          color: white;
          padding: 16px;
          animation: slideUp 0.25s cubic-bezier(0, 0, 0, 1);
        }

        /* Medios */
        .media-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .source-app { font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
        .track-name { display: block; font-size: 12px; margin-top: 2px; }
        .media-btn { background: transparent; border: none; color: white; cursor: pointer; padding: 4px 8px; font-size: 14px; }
        .media-btn.play { font-weight: bold; font-size: 16px; }

        /* Grid Quick Settings */
        .quick-settings-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 8px 0;
        }
        .qs-item-container { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .qs-button {
          width: 100%;
          height: 48px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: 0.1s;
        }
        .qs-button.active { 
          background: #0078d4; 
          border-color: #0078d4; 
        }
        .qs-icon { font-size: 20px; }
        .qs-label { font-size: 11px; color: #ccc; }

        .win-divider { border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0; }

        /* Sliders */
        .sliders-section { display: flex; flex-direction: column; gap: 20px; }
        .slider-row { display: flex; align-items: center; gap: 12px; }
        .slider-icon { font-size: 18px; color: #ddd; }
        
        .win-range {
          flex: 1;
          height: 4px;
          appearance: none;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
          outline: none;
        }
        .win-range::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #0078d4;
          border: 3px solid #333;
          border-radius: 50%;
          cursor: pointer;
        }

        /* Footer */
        .panel-footer {
          margin-top: 20px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-btn { background: transparent; border: none; color: white; font-size: 18px; cursor: pointer; padding: 4px; }
        .battery-status { font-size: 12px; display: flex; gap: 6px; align-items: center; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default NotificationsMenu;