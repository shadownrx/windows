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
    return saved ? JSON.parse(saved) : [{ id: 'tab-1', title: 'Nueva pestaña', url: '' }];
  });
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('nex_browser_bookmarks');
    return saved ? JSON.parse(saved) : [
      { label: 'GitHub', url: 'https://github.com', favicon: 'https://github.com/favicon.ico' },
      { label: 'YouTube', url: 'https://youtube.com', favicon: 'https://youtube.com/favicon.ico' }
    ];
  });

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'tab-1');
  const [addressVal, setAddressVal] = useState('');
  const [editing, setEditing] = useState(false);
  
  // CORRECCIÓN DE PUREZA: Inicializamos con un valor estático
  // El ID se genera de forma incremental en las funciones de evento
  const nextIdCounter = useRef(100); 

  const currentTab = tabs.find(t => t.id === activeTab);
  const isNewTab = !currentTab?.url;

  // 2. Efectos para guardar cambios automáticamente
  useEffect(() => {
    localStorage.setItem('nex_browser_tabs', JSON.stringify(tabs));
    localStorage.setItem('nex_browser_bookmarks', JSON.stringify(bookmarks));
  }, [tabs, bookmarks]);

  // 3. Lógica de Navegación y Pestañas
  const addTab = () => {
    const id = `tab-${nextIdCounter.current++}`;
    const newTab = { id, title: 'Nueva pestaña', url: '' };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(id);
    setAddressVal('');
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      const fallbackId = `tab-${nextIdCounter.current++}`;
      const defaultTab = { id: fallbackId, title: 'Nueva pestaña', url: '' };
      setTabs([defaultTab]);
      setActiveTab(fallbackId);
    } else {
      setTabs(newTabs);
      if (activeTab === id) setActiveTab(newTabs[newTabs.length - 1].id);
    }
  };

  const navigate = useCallback((raw: string) => {
    let url = raw.trim();
    if (!url) return;
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // &igu=1 permite que Google Search cargue en algunos entornos de iframe
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

  const toggleBookmark = () => {
    if (!currentTab?.url || isNewTab) return;
    
    const exists = bookmarks.find(b => b.url === currentTab.url);
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.url !== currentTab.url));
    } else {
      setBookmarks(prev => [...prev, { 
        label: currentTab.title, 
        url: currentTab.url, 
        favicon: currentTab.favicon || '' 
      }]);
    }
  };

  const isBookmarked = bookmarks.some(b => b.url === currentTab?.url);

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
          <button className="star-btn" onClick={toggleBookmark}>
            {isBookmarked ? '★' : '☆'}
          </button>
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
                onKeyDown={(e) => e.key === 'Enter' && navigate((e.target as HTMLInputElement).value)}
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
        
        .tabs-scroll-area { display: flex; gap: 4px; overflow-x: auto; flex: 1; }
        .tabs-scroll-area::-webkit-scrollbar { display: none; }

        .nex-tab {
          background: #1a1a1e;
          padding: 6px 14px;
          border-radius: 8px 8px 0 0;
          min-width: 140px;
          max-width: 200px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          border: 1px solid #2a2a2e;
          border-bottom: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .nex-tab.active { background: #1a1a1e; border-color: #3a3a3e; color: #fff; }
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

        .star-btn { background: none; border: none; color: #555; cursor: pointer; margin-left: 8px; }

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

// Exportación del icono para el escritorio/dock de NEX OS
export const ChromeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="21.17" y1="8" x2="12" y2="8" />
    <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
    <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
  </svg>
);

export default BrowserApp;