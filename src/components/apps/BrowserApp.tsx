import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
}

interface Bookmark {
  label: string;
  url: string;
  favicon: string;
}

// Utilidad para obtener favicons reales
const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
};

export const BrowserApp: React.FC = () => {
  // 1. Estado con Persistencia (LocalStorage)
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('nex_browser_tabs');
    return saved ? JSON.parse(saved) : [{ id: '1', title: 'Nueva pestaña', url: '' }];
  });
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('nex_browser_bookmarks');
    return saved ? JSON.parse(saved) : [
      { label: 'GitHub', url: 'https://github.com', favicon: 'https://github.com/favicon.ico' },
      { label: 'YouTube', url: 'https://youtube.com', favicon: 'https://youtube.com/favicon.ico' }
    ];
  });

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '1');
  const [addressVal, setAddressVal] = useState('');
  const [editing, setEditing] = useState(false);
  const nextId = useRef(Date.now());

  const currentTab = tabs.find(t => t.id === activeTab);
  const isNewTab = !currentTab?.url;

  // 2. Efectos para guardar cambios automáticamente
  useEffect(() => {
    localStorage.setItem('nex_browser_tabs', JSON.stringify(tabs));
    localStorage.setItem('nex_browser_bookmarks', JSON.stringify(bookmarks));
  }, [tabs, bookmarks]);

  // 3. Lógica de Navegación y Pestañas
  const addTab = () => {
    const id = String(nextId.current++);
    const newTab = { id, title: 'Nueva pestaña', url: '' };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(id);
    setAddressVal('');
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      const defaultTab = { id: String(nextId.current++), title: 'Nueva pestaña', url: '' };
      setTabs([defaultTab]);
      setActiveTab(defaultTab.id);
    } else {
      setTabs(newTabs);
      if (activeTab === id) setActiveTab(newTabs[newTabs.length - 1].id);
    }
  };

  const navigate = useCallback((raw: string) => {
  let url = raw.trim();
  if (!url) return;
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Agregamos '&igu=1', que es un parámetro interno de Google 
    // que a veces permite que se renderice en marcos (iframes)
    url = url.includes('.') 
      ? `https://${url}` 
      : `https://www.google.com/search?q=${encodeURIComponent(url)}&igu=1`;
  }

  setTabs(prev => prev.map(t => {
    if (t.id !== activeTab) return t;
    try {
      const host = new URL(url).hostname.replace('www.', '');
      return { ...t, url, title: host, favicon: getFavicon(url) || '' };
    } catch {
      return { ...t, url, title: 'Cargando...', favicon: '' };
    }
  }));
  setEditing(false);
}, [activeTab]);
    

  return (
    <div className="nex-browser-container">
      {/* Tab Strip */}
      <div className="nex-tab-strip">
        <div className="tabs-scroll-area">
          {tabs.map(tab => (
            <div 
              key={tab.id} 
              className={`nex-tab ${tab.id === activeTab ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setAddressVal(tab.url); }}
            >
              {tab.favicon && <img src={tab.favicon} alt="" className="tab-icon" />}
              <span className="tab-text">{tab.title}</span>
              <button className="tab-close" onClick={(e) => closeTab(e, tab.id)}>×</button>
            </div>
          ))}
        </div>
        <button className="add-tab-btn" onClick={addTab}>+</button>
      </div>

      {/* Main Toolbar */}
      <div className="nex-browser-toolbar">
        <div className="nav-actions">
          <button className="nav-icon" title="Atrás">←</button>
          <button className="nav-icon" title="Adelante">→</button>
          <button className="nav-icon" onClick={() => navigate(currentTab?.url || '')}>↻</button>
        </div>
        
        <div className={`nex-address-bar ${editing ? 'focused' : ''}`}>
          <input 
            type="text" 
            value={editing ? addressVal : (isNewTab ? '' : currentTab?.url)}
            onFocus={() => { setEditing(true); setAddressVal(currentTab?.url || ''); }}
            onBlur={() => setTimeout(() => setEditing(false), 200)}
            onChange={e => setAddressVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate(addressVal)}
            placeholder="Busca o escribe una URL"
          />
          <button className="star-btn">★</button>
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="nex-bookmarks">
        {bookmarks.map(b => (
          <div key={b.url} className="bookmark" onClick={() => navigate(b.url)}>
            <img src={b.favicon} alt="" />
            <span>{b.label}</span>
          </div>
        ))}
      </div>

      {/* Viewport Content */}
      <div className="nex-viewport">
        {isNewTab ? (
          <div className="ntp-content">
            <h1 className="ntp-logo">NEX<span>OS</span></h1>
            <div className="ntp-search-container">
              <input 
                type="text" 
                placeholder="¿A dónde vamos hoy, Salvador?" 
                onKeyDown={(e) => e.key === 'Enter' && navigate((e.target as any).value)}
              />
            </div>
          </div>
        ) : (
          <iframe 
            src={currentTab?.url} 
            title="NexView" 
            className="browser-iframe" 
          />
        )}
      </div>

      <style>{`
        .nex-browser-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0f0f12;
          color: #efefef;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .nex-tab-strip {
          display: flex;
          align-items: center;
          padding: 6px 10px 0;
          background: #000000;
          border-bottom: 1px solid #1a1a1e;
        }
        
        .tabs-scroll-area { display: flex; gap: 4px; overflow: hidden; }

        .nex-tab {
          background: #1a1a1e;
          padding: 6px 14px;
          border-radius: 8px 8px 0 0;
          min-width: 150px;
          max-width: 200px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          border: 1px solid #2a2a2e;
          border-bottom: none;
          cursor: pointer;
          transition: 0.2s;
        }

        .nex-tab.active { background: #1a1a1e; border-color: #3a3a3e; color: #fff; box-shadow: 0 -2px 10px rgba(0,0,0,0.5); }
        .tab-icon { width: 14px; height: 14px; }
        .tab-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tab-close { background: none; border: none; color: #555; cursor: pointer; font-size: 14px; }
        .tab-close:hover { color: #ff4444; }

        .add-tab-btn { background: none; border: none; color: #888; font-size: 20px; padding: 0 12px; cursor: pointer; }
        .add-tab-btn:hover { color: #fff; }

        .nex-browser-toolbar {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          gap: 12px;
          background: #1a1a1e;
        }

        .nav-actions { display: flex; gap: 4px; }
        .nav-icon { background: none; border: none; color: #bbb; cursor: pointer; font-size: 18px; padding: 4px 8px; border-radius: 4px; }
        .nav-icon:hover { background: #2a2a2e; }

        .nex-address-bar {
          flex: 1;
          background: #0a0a0c;
          border-radius: 20px;
          padding: 6px 16px;
          display: flex;
          align-items: center;
          border: 1px solid #333;
        }
        .nex-address-bar.focused { border-color: #0078d4; }
        .nex-address-bar input { background: transparent; border: none; color: #fff; width: 100%; outline: none; font-size: 13px; }

        .nex-bookmarks { display: flex; gap: 8px; padding: 6px 12px; background: #1a1a1e; border-bottom: 1px solid #2a2a2e; }
        .bookmark { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #999; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
        .bookmark:hover { background: #2a2a2e; color: #fff; }
        .bookmark img { width: 12px; height: 12px; }

        .nex-viewport { flex: 1; background: #0f0f12; position: relative; }
        .ntp-content { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ntp-logo { font-size: 64px; font-weight: 900; color: #fff; margin-bottom: 20px; letter-spacing: -2px; }
        .ntp-logo span { color: #0078d4; }
        .ntp-search-container { width: 450px; background: #1a1a1e; border: 1px solid #333; border-radius: 30px; padding: 12px 20px; }
        .ntp-search-container input { background: transparent; border: none; color: #fff; width: 100%; outline: none; text-align: center; font-size: 16px; }

        .browser-iframe { width: 100%; height: 100%; border: none; background: #fff; }
      `}</style>
    </div>
  );
};

export default BrowserApp;