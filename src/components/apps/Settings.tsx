import React from 'react';

interface SettingsProps {
  onWallpaperChange: (url: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ onWallpaperChange }) => {
  const wallpapers = [
    { name: 'Bloom Dark', url: 'https://images.unsplash.com/photo-1620121692029-d088224efc74?q=80&w=2832&auto=format&fit=crop' },
    { name: 'Ocean Blast', url: 'https://images.unsplash.com/photo-1541411191165-f184eaf9509a?q=80&w=2787&auto=format&fit=crop' },
    { name: 'Mountain Peak', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2832&auto=format&fit=crop' },
    { name: 'Abstract Flow', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2864&auto=format&fit=crop' },
  ];

  return (
    <div className="settings-container">
      <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Settings</h2>
      
      <div className="settings-section">
        <h3>Personalization</h3>
        <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '16px' }}>Select a wallpaper to change your desktop background.</p>
        
        <div className="wallpaper-grid">
          {wallpapers.map((wp, index) => (
            <div 
              key={index} 
              className="wallpaper-card"
              onClick={() => onWallpaperChange(wp.url)}
            >
              <img src={wp.url} alt={wp.name} />
              <div className="wallpaper-name">{wp.name}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .settings-container {
          padding: 32px;
          color: white;
          background: #191919;
          height: 100%;
          overflow-y: auto;
        }
        .settings-section {
          margin-bottom: 32px;
        }
        .settings-section h3 {
          font-size: 18px;
          margin-bottom: 12px;
        }
        .wallpaper-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }
        .wallpaper-card {
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border 0.2s;
        }
        .wallpaper-card:hover {
          border-color: var(--win-blue);
        }
        .wallpaper-card img {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }
        .wallpaper-name {
          padding: 8px;
          font-size: 13px;
          text-align: center;
          background: rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

export default Settings;
