import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft24Regular, 
  ArrowRight24Regular, 
  ArrowClockwise24Regular, 
  Add24Regular, 
  Dismiss24Regular,
  Star24Regular,
  Star24Filled,
  Search24Regular,
  Open24Regular,
  Info24Regular
} from '@fluentui/react-icons';

interface HistoryState {
  index: number;
  stack: string[];
}

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  history: HistoryState;
}

interface Bookmark {
  label: string;
  url: string;
  favicon: string;
}

const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
};

const convertToEmbed = (url: string): string => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
      const videoId = urlObj.searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (urlObj.hostname.includes('youtu.be')) {
      const videoId = urlObj.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return url;
  } catch {
    return url;
  }
};

const isBlockedByIframe = (url: string): boolean => {
  if (!url) return false;
  const blockedSites = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'steamcommunity.com', 'counter-strike.net'];
  return blockedSites.some(site => url.toLowerCase().includes(site));
};

export const BrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('nex_browser_tabs_v2');
    if (saved) return JSON.parse(saved);
    return [{ 
      id: 'tab-1', 
      title: 'Nueva pestaña', 
      url: '', 
      history: { index: 0, stack: [''] } 
    }];
  });

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id || 'tab-1');
  const [addressVal, setAddressVal] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('nex_browser_bookmarks');
    return saved ? JSON.parse(saved) : [
      { label: 'YouTube', url: 'https://youtube.com', favicon: 'https://youtube.com/favicon.ico' },
      { label: 'GitHub', url: 'https://github.com', favicon: 'https://github.com/favicon.ico' },
      { label: 'Wikipedia', url: 'https://wikipedia.org', favicon: 'https://wikipedia.org/favicon.ico' }
    ];
  });

  const nextIdCounter = useRef(Date.now());
  const currentTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Persistence
  useEffect(() => {
    localStorage.setItem('nex_browser_tabs_v2', JSON.stringify(tabs));
  }, [tabs]);

  const addTab = () => {
    const id = `tab-${nextIdCounter.current++}`;
    const newTab: Tab = { 
      id, 
      title: 'Nueva pestaña', 
      url: '', 
      history: { index: 0, stack: [''] } 
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
    setAddressVal('');
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      const fallbackId = `tab-${nextIdCounter.current++}`;
      setTabs([{ id: fallbackId, title: 'Nueva pestaña', url: '', history: { index: 0, stack: [''] } }]);
      setActiveTabId(fallbackId);
    } else {
      setTabs(newTabs);
      if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const navigate = useCallback((raw: string, addToHistory = true) => {
    let url = raw.trim();
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = url.includes('.') ? `https://${url}` : `https://www.google.com/search?q=${encodeURIComponent(url)}&igu=1`;
    }

    // Smart logic: Embeds
    const finalUrl = convertToEmbed(url);

    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t;
      
      let newHistory = t.history;
      if (addToHistory) {
        const newStack = t.history.stack.slice(0, t.history.index + 1);
        newStack.push(finalUrl);
        newHistory = { index: newStack.length - 1, stack: newStack };
      }

      try {
        const domain = new URL(url).hostname.replace('www.', '');
        return { 
          ...t, 
          url: finalUrl, 
          title: domain || 'Cargando...', 
          favicon: getFavicon(url) || '',
          history: newHistory
        };
      } catch {
        return { ...t, url: finalUrl, title: 'Cargando...', history: newHistory };
      }
    }));
    setAddressVal('');
  }, [activeTabId]);

  const goBack = () => {
    if (currentTab.history.index > 0) {
      const prevUrl = currentTab.history.stack[currentTab.history.index - 1];
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: prevUrl, history: { ...t.history, index: t.history.index - 1 } } : t));
    }
  };

  const goForward = () => {
    if (currentTab.history.index < currentTab.history.stack.length - 1) {
      const nextUrl = currentTab.history.stack[currentTab.history.index + 1];
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, url: nextUrl, history: { ...t.history, index: t.history.index + 1 } } : t));
    }
  };

  const isBookmarked = bookmarks.some(b => b.url === currentTab.url);
  const toggleBookmark = () => {
    if (!currentTab.url) return;
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(b => b.url !== currentTab.url));
    } else {
      setBookmarks(prev => [...prev, { label: currentTab.title, url: currentTab.url, favicon: currentTab.favicon || '' }]);
    }
  };

  const openInNewTab = () => {
    if (currentTab.url) window.open(currentTab.history.stack[currentTab.history.index], '_blank');
  };

  return (
    <div className="nex-browser-root scanlines">
      {/* Tab Strip */}
      <div className="nex-browser-header">
        <div className="tab-container scroll-hide">
          {tabs.map(tab => (
            <div 
              key={tab.id} 
              className={`browser-tab ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <div className="tab-inner">
                {tab.favicon ? <img src={tab.favicon} className="tab-fav" alt="" /> : <Info24Regular className="tab-fav" />}
                <span className="tab-title">{tab.title}</span>
                <button className="tab-close-btn" onClick={(e) => closeTab(e, tab.id)}><Dismiss24Regular /></button>
              </div>
            </div>
          ))}
          <button className="new-tab-btn" onClick={addTab}><Add24Regular /></button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="browser-toolbar">
        <div className="toolbar-actions">
          <button disabled={currentTab.history.index === 0} onClick={goBack} className="tool-btn"><ArrowLeft24Regular /></button>
          <button disabled={currentTab.history.index >= currentTab.history.stack.length - 1} onClick={goForward} className="tool-btn"><ArrowRight24Regular /></button>
          <button onClick={() => navigate(currentTab.url, false)} className="tool-btn"><ArrowClockwise24Regular /></button>
        </div>
        
        <div className="address-bar-container">
          <div className="address-bar-wrapper">
            <Search24Regular className="search-icon" />
            <input 
              type="text" 
              className="address-input"
              value={addressVal || currentTab.url}
              onChange={e => setAddressVal(e.target.value)}
              onFocus={e => e.target.select()}
              onKeyDown={e => e.key === 'Enter' && navigate(addressVal)}
              placeholder="Buscar o escribir una URL"
            />
            <button className="star-btn" onClick={toggleBookmark}>
              {isBookmarked ? <Star24Filled style={{ color: 'var(--win-accent)' }} /> : <Star24Regular />}
            </button>
          </div>
        </div>

        <div className="toolbar-external">
          <button onClick={openInNewTab} className="tool-btn" title="Abrir en pestaña real"><Open24Regular /></button>
        </div>
      </div>

      {/* Bookmarks bar */}
      <div className="bookmarks-bar">
        {bookmarks.map(b => (
          <div key={b.url} className="bookmark-item" onClick={() => navigate(b.url)}>
            <img src={b.favicon} alt="" />
            <span>{b.label}</span>
          </div>
        ))}
      </div>

      {/* Content View */}
      <div className="browser-content">
        {!currentTab.url ? (
          <div className="ntp-view">
            <h1 className="ntp-brand">NEX<span>VIEW</span></h1>
            <div className="ntp-search-box">
               <Search24Regular />
               <input 
                 autoFocus
                 placeholder="¿A dónde quieres ir hoy?" 
                 onKeyDown={e => e.key === 'Enter' && navigate((e.target as HTMLInputElement).value)}
               />
            </div>
            <div className="ntp-shortcuts">
               {bookmarks.slice(0, 6).map(b => (
                 <div key={b.url} className="ntp-shortcut" onClick={() => navigate(b.url)}>
                    <div className="shortcut-icon"><img src={b.favicon} alt="" /></div>
                    <span className="shortcut-label">{b.label}</span>
                 </div>
               ))}
            </div>
          </div>
        ) : isBlockedByIframe(currentTab.url) ? (
          <div className="blocked-view">
            <div className="blocked-card neon-border">
               <h2>Seguridad de Sitio</h2>
               <p><strong>{currentTab.title}</strong> no permite la simulación dentro del navegador NEX VIEW.</p>
               <button onClick={openInNewTab} className="open-real-btn neon-border">
                 Abrir en tu Navegador Real <Open24Regular />
               </button>
            </div>
          </div>
        ) : (
          <iframe 
            src={currentTab.url} 
            title="Browser Frame" 
            className="browser-iframe" 
          />
        )}
      </div>

      <style>{`
        .nex-browser-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #000;
          color: white;
          font-family: 'Inter', system-ui, sans-serif;
          user-select: none;
        }

        /* Header & Tabs */
        .nex-browser-header {
          padding: 8px 12px 0;
          background: #0a0a0a;
          border-bottom: 1px solid #1a1a1a;
        }

        .tab-container {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          align-items: center;
        }

        .scroll-hide::-webkit-scrollbar { display: none; }

        .browser-tab {
          min-width: 160px;
          max-width: 200px;
          height: 34px;
          padding: 0 10px;
          background: #1a1a1a;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          border: 1px solid #2a2a2a;
          border-bottom: none;
          transition: all 0.2s;
        }

        .browser-tab.active {
          background: #2a2a2a;
          border-color: var(--win-accent);
          box-shadow: 0 -2px 10px var(--win-accent);
        }

        .tab-inner { display: flex; align-items: center; gap: 8px; width: 100%; }
        .tab-fav { width: 14px; height: 14px; color: #888; }
        .tab-title { flex: 1; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tab-close-btn { background: none; border: none; color: #666; cursor: pointer; display: flex; align-items: center; padding: 2px; border-radius: 4px; }
        .tab-close-btn:hover { background: #ff4444; color: white; }
        .tab-close-btn svg { width: 12px; height: 12px; }

        .new-tab-btn { background: transparent; border: none; color: #888; cursor: pointer; padding: 6px; border-radius: 50%; }
        .new-tab-btn:hover { background: #222; color: white; }

        /* Toolbar */
        .browser-toolbar {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: #1a1a1a;
          gap: 12px;
        }

        .toolbar-actions { display: flex; gap: 4px; }
        .tool-btn { 
          background: transparent; border: none; color: #ddd; cursor: pointer; padding: 6px; border-radius: 6px;
          display: flex; align-items: center;
        }
        .tool-btn:hover:not(:disabled) { background: #333; }
        .tool-btn:disabled { opacity: 0.3; cursor: default; }
        .tool-btn svg { width: 18px; height: 18px; }

        .address-bar-container { flex: 1; }
        .address-bar-wrapper {
          display: flex;
          align-items: center;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 20px;
          padding: 4px 12px;
          gap: 10px;
          transition: border-color 0.2s;
        }
        .address-bar-wrapper:focus-within { border-color: var(--win-accent); box-shadow: 0 0 10px var(--win-accent); }

        .search-icon { width: 14px; color: #666; }
        .address-input { 
          flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 13px; 
          height: 24px;
        }
        .star-btn { background: none; border: none; color: #666; cursor: pointer; padding: 2px; }

        /* Bookmarks */
        .bookmarks-bar {
          display: flex;
          padding: 4px 12px;
          background: #1a1a1a;
          gap: 16px;
          border-bottom: 1px solid #2a2a2a;
        }

        .bookmark-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #aaa;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .bookmark-item:hover { background: #333; color: white; }
        .bookmark-item img { width: 14px; height: 14px; }

        /* Content Area */
        .browser-content { flex: 1; position: relative; overflow: hidden; background: #050505; }
        .browser-iframe { width: 100%; height: 100%; border: none; background: white; }

        /* NTP View */
        .ntp-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #111 0%, #000 70%);
        }
        .ntp-brand { font-size: 48px; font-weight: 900; letter-spacing: -2px; margin-bottom: 30px; }
        .ntp-brand span { color: var(--win-accent); text-shadow: var(--neon-glow); }

        .ntp-search-box {
          width: 500px;
          background: #111;
          border: 1px solid #333;
          border-radius: 30px;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .ntp-search-box input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 16px; }

        .ntp-shortcuts { display: flex; gap: 24px; margin-top: 50px; }
        .ntp-shortcut { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; width: 80px; }
        .shortcut-icon { 
          width: 48px; height: 48px; background: #1a1a1a; border-radius: 12px; 
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s; border: 1px solid #333;
        }
        .ntp-shortcut:hover .shortcut-icon { transform: translateY(-5px); border-color: var(--win-accent); }
        .shortcut-icon img { width: 24px; height: 24px; }
        .shortcut-label { font-size: 12px; color: #888; }

        /* Blocked View */
        .blocked-view {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }
        .blocked-card {
          padding: 40px;
          background: #0a0a0a;
          border-radius: 16px;
          max-width: 500px;
        }
        .blocked-card h2 { color: #ff4444; margin-bottom: 16px; }
        .blocked-card p { color: #888; margin-bottom: 24px; }
        .open-real-btn {
          background: transparent;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }
        .open-real-btn:hover { background: var(--win-accent); color: black; }
      `}</style>
    </div>
  );
};

export default BrowserApp;
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
