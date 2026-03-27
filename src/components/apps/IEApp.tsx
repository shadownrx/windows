import React, { useState, useRef } from 'react';

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;

function resolveUrl(raw: string): { url: string; isYouTubeEmbed: boolean; videoId?: string } {
  let url = raw.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = url.includes('.') ? `https://${url}` : `https://www.bing.com/search?q=${encodeURIComponent(url)}`;
  }
  const ytMatch = url.match(YOUTUBE_REGEX);
  if (ytMatch) {
    return { url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`, isYouTubeEmbed: true, videoId: ytMatch[1] };
  }
  return { url, isYouTubeEmbed: false };
}

const IEApp: React.FC = () => {
  const [url, setUrl] = useState('https://www.google.com/webhp?igu=1');
  const [addressVal, setAddressVal] = useState('https://www.google.com');
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = () => {
    if (!addressVal.trim()) return;
    setLoading(true);
    const resolved = resolveUrl(addressVal);
    setUrl(resolved.url);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigate();
  };

  return (
    <div className="ie-root">
      {/* Toolbar Area */}
      <div className="ie-toolbar">
         <div className="ie-top-row">
            <div className="ie-nav-buttons">
              <button className="ie-btn" onClick={() => iframeRef.current?.contentWindow?.history.back()}>
                <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2H7.83l5.58-5.59L12 4z"/></svg>
              </button>
              <button className="ie-btn" onClick={() => iframeRef.current?.contentWindow?.history.forward()}>
                 <svg viewBox="0 0 24 24" width="24" height="24"><path fill="#fff" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>
              </button>
            </div>
            <div className="ie-address-container">
               <input 
                 className="ie-address" 
                 value={addressVal}
                 onChange={e => setAddressVal(e.target.value)}
                 onKeyDown={handleKey}
               />
               <button className="ie-go-btn" onClick={navigate}>
                 <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#333" d="M2 12l18-9-9 18-2-6-6-2z"/></svg>
               </button>
            </div>
            <div className="ie-search-container">
               <input className="ie-search" placeholder="Bing" onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   setAddressVal(`https://www.bing.com/search?q=${encodeURIComponent(e.currentTarget.value)}`);
                   navigate();
                 }
               }}/>
            </div>
         </div>
         <div className="ie-bottom-row">
           <div className="ie-menu-bar">
             <span>Archivo</span>
             <span>Edición</span>
             <span>Ver</span>
             <span>Favoritos</span>
             <span>Herramientas</span>
             <span>Ayuda</span>
           </div>
         </div>
      </div>
      
      {/* Content */}
      <div className="ie-content">
         {loading && <div className="ie-loading">Cargando...</div>}
         <iframe
            ref={iframeRef}
            src={url}
            className="ie-iframe"
            title="Internet Explorer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
            onLoad={() => setLoading(false)}
         />
      </div>

      <style>{`
        .ie-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #d4d0c8;
          font-family: 'Segoe UI', Tahoma, sans-serif;
        }
        .ie-toolbar {
          background: linear-gradient(to bottom, #eff3fc 0%, #d6e2f5 100%);
          border-bottom: 1px solid #99a8c7;
          display: flex;
          flex-direction: column;
        }
        .ie-top-row {
          display: flex;
          align-items: center;
          padding: 8px 4px 4px 4px;
          gap: 6px;
        }
        .ie-nav-buttons {
          display: flex;
          gap: 2px;
        }
        .ie-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid transparent;
          background: #4A8CD2;
          border: 1px solid #235A9C;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .ie-btn:active { background: #356eaa; }
        .ie-btn:nth-child(2) { background: transparent; border-color: transparent; }
        .ie-btn:nth-child(2) svg path { fill: #999; }
        .ie-address-container {
          flex: 1;
          display: flex;
          background: #fff;
          border: 1px solid #7f9db9;
          height: 24px;
          align-items: center;
        }
        .ie-address {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 4px;
          font-size: 13px;
        }
        .ie-go-btn {
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          cursor: pointer;
          border-left: 1px solid #ddd;
        }
        .ie-search-container {
          width: 150px;
          display: flex;
          background: #fff;
          border: 1px solid #7f9db9;
          height: 24px;
        }
        .ie-search {
          flex: 1;
          border: none;
          outline: none;
          padding: 0 4px;
          font-size: 13px;
        }
        .ie-bottom-row {
           border-top: 1px solid #fff;
           background: #eff3fc;
           padding: 2px 8px;
        }
        .ie-menu-bar {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #000;
        }
        .ie-menu-bar span {
          padding: 2px 4px;
          cursor: pointer;
        }
        .ie-menu-bar span:hover {
          background: #c1d2ee;
          border-radius: 2px;
          box-shadow: inset 0 0 1px #fff;
        }
        .ie-content {
          flex: 1;
          background: #fff;
        }
        .ie-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .ie-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.9);
          padding: 10px 20px;
          border: 1px solid #7f9db9;
          font-size: 14px;
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export const IEIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path fill="#2c89db" d="M12 3a9 9 0 00-6.73 14.99c2.02-3.4 5.2-5.71 8.94-6.38a7.03 7.03 0 01-4.21-3.61c-2.36.93-4.32 2.89-5.25 5.25A9 9 0 1112 3z" />
    <path fill="#2c89db" d="M14 6c2.5 0 4.5 2 4.5 4.5S16.5 15 14 15c-1.2 0-2.3-.4-3.1-1.1a7.1 7.1 0 006.1-5.9C16.6 6.8 15.4 6 14 6z"/>
    <path fill="#f3da3b" d="M3.5 12c0-.5.8-2 2-3a9.5 9.5 0 0113 0c1.2 1 2 2.5 2 3s-.8 2-2 3a9.5 9.5 0 01-13 0c-1.2-1-2-2.5-2-3z" opacity="0.6"/>
  </svg>
);

export default IEApp;

