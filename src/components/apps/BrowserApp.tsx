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
  Info24Regular,
  Globe24Regular,
  LockClosed16Regular,
  FullScreenMaximize24Regular,
  FullScreenMinimize24Regular,
  Play24Regular,
  SlideLayout24Regular,
} from '@fluentui/react-icons';
import {
  resolveBrowserUrl,
  isBlockedByIframe,
  isGoogleSlides,
  getFavicon,
  type SlidesMode,
} from '../../utils/browserUrls';

interface HistoryEntry {
  displayUrl: string;
  iframeUrl: string;
  titleHint: string;
  contentType: 'slides' | 'docs' | 'sheets' | 'youtube' | 'generic';
  slidesMode?: SlidesMode;
}

interface HistoryState {
  index: number;
  stack: HistoryEntry[];
}

interface Tab {
  id: string;
  title: string;
  displayUrl: string;
  iframeUrl: string;
  titleHint: string;
  contentType: HistoryEntry['contentType'];
  slidesMode?: SlidesMode;
  favicon?: string;
  history: HistoryState;
}

interface Bookmark {
  label: string;
  url: string;
  favicon: string;
}

const EMPTY_ENTRY: HistoryEntry = {
  displayUrl: '',
  iframeUrl: '',
  titleHint: 'Nueva pestaña',
  contentType: 'generic',
};

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { label: 'Google', url: 'https://www.google.com/webhp?igu=1', favicon: 'https://www.google.com/favicon.ico' },
  { label: 'YouTube', url: 'https://youtube.com', favicon: 'https://youtube.com/favicon.ico' },
  { label: 'Google Slides', url: 'https://slides.google.com', favicon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico' },
  { label: 'GitHub', url: 'https://github.com', favicon: 'https://github.com/favicon.ico' },
];

function createTab(id: string): Tab {
  return {
    id,
    title: 'Nueva pestaña',
    displayUrl: '',
    iframeUrl: '',
    titleHint: 'Nueva pestaña',
    contentType: 'generic',
    history: { index: 0, stack: [{ ...EMPTY_ENTRY }] },
  };
}

function entryFromResolved(resolved: ReturnType<typeof resolveBrowserUrl>): HistoryEntry {
  return {
    displayUrl: resolved.displayUrl,
    iframeUrl: resolved.iframeUrl,
    titleHint: resolved.titleHint,
    contentType: resolved.contentType,
    slidesMode: resolved.slidesMode,
  };
}

function migrateTab(raw: Partial<Tab> & { url?: string; history?: { index: number; stack: unknown[] } }): Tab {
  const id = raw.id ?? `tab-${Date.now()}`;
  const base = createTab(id);

  if (raw.history?.stack?.length) {
    const stack = raw.history.stack.map((item) => {
      if (typeof item === 'string') {
        if (!item) return { ...EMPTY_ENTRY };
        const resolved = resolveBrowserUrl(item);
        return entryFromResolved(resolved);
      }
      const entry = item as HistoryEntry;
      if (entry.displayUrl !== undefined) return entry;
      return { ...EMPTY_ENTRY };
    });
    const index = Math.min(raw.history.index ?? 0, stack.length - 1);
    const current = stack[index] ?? EMPTY_ENTRY;
    return {
      ...base,
      ...raw,
      id,
      title: raw.title ?? current.titleHint ?? 'Nueva pestaña',
      displayUrl: current.displayUrl,
      iframeUrl: current.iframeUrl,
      titleHint: current.titleHint,
      contentType: current.contentType,
      slidesMode: current.slidesMode,
      history: { index, stack },
    };
  }

  if (raw.url) {
    const resolved = resolveBrowserUrl(raw.url);
    const entry = entryFromResolved(resolved);
    return {
      ...base,
      title: resolved.titleHint,
      displayUrl: entry.displayUrl,
      iframeUrl: entry.iframeUrl,
      titleHint: entry.titleHint,
      contentType: entry.contentType,
      slidesMode: entry.slidesMode,
      favicon: getFavicon(resolved.displayUrl) ?? undefined,
      history: { index: 0, stack: [entry] },
    };
  }

  return { ...base, ...raw, id };
}

export const BrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('nex_browser_tabs_v3');
    if (saved) {
      try {
        return (JSON.parse(saved) as unknown[]).map((t) => migrateTab(t as Partial<Tab>));
      } catch {
        /* fall through */
      }
    }
    return [createTab('tab-1')];
  });

  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? 'tab-1');
  const [addressVal, setAddressVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [contentFullscreen, setContentFullscreen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('nex_browser_bookmarks_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        /* fall through */
      }
    }
    return DEFAULT_BOOKMARKS;
  });

  const nextIdCounter = useRef(Date.now());
  const contentRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const currentTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    localStorage.setItem('nex_browser_tabs_v3', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem('nex_browser_bookmarks_v2', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    setAddressVal('');
    setIframeError(false);
    setLoading(!!currentTab?.iframeUrl);
  }, [activeTabId, currentTab?.iframeUrl]);

  const applyEntryToTab = (entry: HistoryEntry): Partial<Tab> => ({
    displayUrl: entry.displayUrl,
    iframeUrl: entry.iframeUrl,
    titleHint: entry.titleHint,
    contentType: entry.contentType,
    slidesMode: entry.slidesMode,
    title: entry.titleHint || 'Nueva pestaña',
    favicon: entry.displayUrl ? (getFavicon(entry.displayUrl) ?? undefined) : undefined,
  });

  const navigate = useCallback(
    (raw: string, addToHistory = true, slidesMode?: SlidesMode) => {
      const trimmed = raw.trim();
      if (!trimmed && addToHistory) return;

      const resolved = trimmed
        ? resolveBrowserUrl(trimmed, { slidesMode: slidesMode ?? (isGoogleSlides(trimmed) ? 'embed' : undefined) })
        : { ...EMPTY_ENTRY, displayUrl: '', iframeUrl: '', titleHint: 'Nueva pestaña', contentType: 'generic' as const };

      const entry = entryFromResolved(resolved);
      setIframeError(false);
      setLoading(!!entry.iframeUrl);

      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId) return t;

          let history = t.history;
          if (addToHistory) {
            const newStack = t.history.stack.slice(0, t.history.index + 1);
            newStack.push(entry);
            history = { index: newStack.length - 1, stack: newStack };
          }

          return { ...t, ...applyEntryToTab(entry), history };
        }),
      );
      setAddressVal('');
    },
    [activeTabId],
  );

  const goBack = () => {
    if (currentTab.history.index <= 0) return;
    const prev = currentTab.history.stack[currentTab.history.index - 1];
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, ...applyEntryToTab(prev), history: { ...t.history, index: t.history.index - 1 } }
          : t,
      ),
    );
    setLoading(!!prev.iframeUrl);
    setIframeError(false);
  };

  const goForward = () => {
    if (currentTab.history.index >= currentTab.history.stack.length - 1) return;
    const next = currentTab.history.stack[currentTab.history.index + 1];
    setTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? { ...t, ...applyEntryToTab(next), history: { ...t.history, index: t.history.index + 1 } }
          : t,
      ),
    );
    setLoading(!!next.iframeUrl);
    setIframeError(false);
  };

  const setSlidesMode = (mode: SlidesMode) => {
    if (!currentTab.displayUrl || !isGoogleSlides(currentTab.displayUrl)) return;
    navigate(currentTab.displayUrl, true, mode);
  };

  const addTab = () => {
    const id = `tab-${nextIdCounter.current++}`;
    setTabs((prev) => [...prev, createTab(id)]);
    setActiveTabId(id);
    setAddressVal('');
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter((t) => t.id !== id);
    if (newTabs.length === 0) {
      const fallbackId = `tab-${nextIdCounter.current++}`;
      setTabs([createTab(fallbackId)]);
      setActiveTabId(fallbackId);
    } else {
      setTabs(newTabs);
      if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const isBookmarked = bookmarks.some((b) => b.url === currentTab.displayUrl);
  const toggleBookmark = () => {
    if (!currentTab.displayUrl) return;
    if (isBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.url !== currentTab.displayUrl));
    } else {
      setBookmarks((prev) => [
        ...prev,
        {
          label: currentTab.title,
          url: currentTab.displayUrl,
          favicon: currentTab.favicon || '',
        },
      ]);
    }
  };

  const openInRealBrowser = () => {
    const url = currentTab.displayUrl || currentTab.iframeUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleContentFullscreen = async () => {
    if (!contentRef.current) return;
    if (!document.fullscreenElement) {
      await contentRef.current.requestFullscreen();
      setContentFullscreen(true);
    } else {
      await document.exitFullscreen();
      setContentFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setContentFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const showSlides = isGoogleSlides(currentTab.displayUrl);
  const blocked = isBlockedByIframe(currentTab.displayUrl || currentTab.iframeUrl);

  return (
    <div className="chrome-root">
      {/* Tab strip */}
      <div className="chrome-tabstrip">
        <div className="chrome-tabs scroll-hide">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`chrome-tab ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              {tab.favicon ? (
                <img src={tab.favicon} className="tab-fav" alt="" />
              ) : (
                <Globe24Regular className="tab-fav icon-muted" />
              )}
              <span className="tab-title">{tab.title}</span>
              <button className="tab-close" onClick={(e) => closeTab(e, tab.id)} aria-label="Cerrar pestaña">
                <Dismiss24Regular />
              </button>
            </div>
          ))}
          <button className="new-tab-btn" onClick={addTab} aria-label="Nueva pestaña">
            <Add24Regular />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="chrome-toolbar">
        <div className="nav-btns">
          <button disabled={currentTab.history.index === 0} onClick={goBack} className="nav-btn" title="Atrás">
            <ArrowLeft24Regular />
          </button>
          <button
            disabled={currentTab.history.index >= currentTab.history.stack.length - 1}
            onClick={goForward}
            className="nav-btn"
            title="Adelante"
          >
            <ArrowRight24Regular />
          </button>
          <button
            onClick={() => {
              setLoading(true);
              setIframeError(false);
              if (currentTab.displayUrl) {
                navigate(currentTab.displayUrl, false, currentTab.slidesMode);
              }
            }}
            className="nav-btn"
            title="Recargar"
          >
            <ArrowClockwise24Regular />
          </button>
        </div>

        <div className="omnibox-wrap">
          {loading && <div className="omnibox-progress" />}
          <div className="omnibox">
            {currentTab.displayUrl.startsWith('https://') ? (
              <LockClosed16Regular className="omnibox-icon secure" />
            ) : (
              <Info24Regular className="omnibox-icon" />
            )}
            <input
              type="text"
              className="omnibox-input"
              value={addressVal || currentTab.displayUrl}
              onChange={(e) => setAddressVal(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => e.key === 'Enter' && navigate(addressVal || currentTab.displayUrl)}
              placeholder="Buscar en Google o escribir una URL"
            />
            <button className="star-btn" onClick={toggleBookmark} title="Marcadores">
              {isBookmarked ? <Star24Filled className="starred" /> : <Star24Regular />}
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          {showSlides && (
            <>
              <button
                className={`nav-btn slides-btn ${currentTab.slidesMode !== 'present' ? 'active' : ''}`}
                onClick={() => setSlidesMode('embed')}
                title="Vista de diapositivas"
              >
                <SlideLayout24Regular />
              </button>
              <button
                className={`nav-btn slides-btn present-btn ${currentTab.slidesMode === 'present' ? 'active' : ''}`}
                onClick={() => setSlidesMode('present')}
                title="Modo presentación"
              >
                <Play24Regular />
              </button>
            </>
          )}
          <button className="nav-btn" onClick={toggleContentFullscreen} title="Pantalla completa">
            {contentFullscreen ? <FullScreenMinimize24Regular /> : <FullScreenMaximize24Regular />}
          </button>
          <button className="nav-btn" onClick={openInRealBrowser} title="Abrir en navegador real">
            <Open24Regular />
          </button>
        </div>
      </div>

      {/* Bookmarks bar */}
      <div className="bookmarks-bar">
        {bookmarks.map((b) => (
          <button key={b.url} className="bookmark-chip" onClick={() => navigate(b.url)}>
            <img src={b.favicon} alt="" />
            <span>{b.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="chrome-content" ref={contentRef}>
        {!currentTab.displayUrl ? (
          <div className="ntp">
            <div className="ntp-logo">
              <span className="g">G</span>
              <span className="o1">o</span>
              <span className="o2">o</span>
              <span className="g2">g</span>
              <span className="l">l</span>
              <span className="e">e</span>
            </div>
            <div className="ntp-search">
              <Search24Regular />
              <input
                autoFocus
                placeholder="Busca en Google o escribe una URL"
                onKeyDown={(e) => e.key === 'Enter' && navigate((e.target as HTMLInputElement).value)}
              />
            </div>
            <div className="ntp-hints">
              <p>Pega un enlace de Google Slides para presentar aquí:</p>
              <code>docs.google.com/presentation/d/…/edit</code>
            </div>
            <div className="ntp-shortcuts">
              {bookmarks.slice(0, 8).map((b) => (
                <button key={b.url} className="ntp-shortcut" onClick={() => navigate(b.url)}>
                  <div className="shortcut-icon">
                    <img src={b.favicon} alt="" />
                  </div>
                  <span>{b.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : blocked ? (
          <div className="blocked-view">
            <div className="blocked-card">
              <h2>No se puede mostrar este sitio</h2>
              <p>
                <strong>{currentTab.title}</strong> bloquea la visualización embebida por políticas de seguridad.
              </p>
              <button onClick={openInRealBrowser} className="open-external-btn">
                Abrir en navegador real <Open24Regular />
              </button>
            </div>
          </div>
        ) : iframeError ? (
          <div className="blocked-view">
            <div className="blocked-card">
              <h2>No se pudo cargar la página</h2>
              <p>
                {showSlides
                  ? 'Asegúrate de que la presentación esté compartida como "Cualquier persona con el enlace puede ver".'
                  : 'El sitio puede bloquear la visualización embebida.'}
              </p>
              <div className="blocked-actions">
                <button onClick={() => navigate(currentTab.displayUrl, false, currentTab.slidesMode)} className="retry-btn">
                  Reintentar
                </button>
                <button onClick={openInRealBrowser} className="open-external-btn">
                  Abrir en navegador real <Open24Regular />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {loading && (
              <div className="loading-bar">
                <div className="loading-bar-inner" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              key={`${currentTab.iframeUrl}-${currentTab.slidesMode}`}
              src={currentTab.iframeUrl}
              title={currentTab.title}
              className="chrome-iframe"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; presentation"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setIframeError(true);
              }}
            />
            {showSlides && currentTab.slidesMode !== 'present' && (
              <div className="slides-banner">
                <SlideLayout24Regular />
                <span>Presentación de Google Slides embebida</span>
                <button onClick={() => setSlidesMode('present')}>
                  <Play24Regular /> Iniciar presentación
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .chrome-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #fff;
          color: #202124;
          font-family: 'Segoe UI', system-ui, sans-serif;
          user-select: none;
        }

        /* Tab strip */
        .chrome-tabstrip {
          background: #dee1e6;
          padding: 8px 8px 0;
        }

        .chrome-tabs {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          align-items: flex-end;
        }

        .scroll-hide::-webkit-scrollbar { display: none; }

        .chrome-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 160px;
          max-width: 220px;
          height: 34px;
          padding: 0 10px;
          background: #c3c6ca;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          font-size: 12px;
          color: #3c4043;
          transition: background 0.15s;
        }

        .chrome-tab.active {
          background: #fff;
          color: #202124;
        }

        .chrome-tab:not(.active):hover { background: #dadcde; }

        .tab-fav { width: 16px; height: 16px; flex-shrink: 0; }
        .icon-muted { color: #5f6368; width: 16px; height: 16px; }

        .tab-title {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-close {
          background: none;
          border: none;
          color: #5f6368;
          cursor: pointer;
          display: flex;
          padding: 2px;
          border-radius: 50%;
        }

        .tab-close:hover { background: rgba(0,0,0,0.1); color: #202124; }
        .tab-close svg { width: 14px; height: 14px; }

        .new-tab-btn {
          background: transparent;
          border: none;
          color: #5f6368;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          margin-bottom: 4px;
        }

        .new-tab-btn:hover { background: rgba(0,0,0,0.08); }

        /* Toolbar */
        .chrome-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: #fff;
          border-bottom: 1px solid #e8eaed;
        }

        .nav-btns, .toolbar-right {
          display: flex;
          gap: 2px;
          flex-shrink: 0;
        }

        .nav-btn {
          background: transparent;
          border: none;
          color: #5f6368;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
        }

        .nav-btn:hover:not(:disabled) { background: #f1f3f4; color: #202124; }
        .nav-btn:disabled { opacity: 0.35; cursor: default; }
        .nav-btn svg { width: 18px; height: 18px; }

        .nav-btn.slides-btn.active {
          background: #e8f0fe;
          color: #1a73e8;
        }

        .present-btn.active {
          background: #fce8e6;
          color: #d93025;
        }

        .omnibox-wrap {
          flex: 1;
          position: relative;
        }

        .omnibox-progress {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #1a73e8;
          animation: progress 1.2s ease-in-out infinite;
          border-radius: 2px;
          z-index: 2;
        }

        @keyframes progress {
          0% { width: 0; opacity: 1; }
          50% { width: 70%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }

        .omnibox {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f1f3f4;
          border-radius: 20px;
          padding: 6px 14px;
          transition: background 0.2s, box-shadow 0.2s;
        }

        .omnibox:focus-within {
          background: #fff;
          box-shadow: 0 1px 6px rgba(32,33,36,0.18);
        }

        .omnibox-icon { width: 16px; height: 16px; color: #5f6368; flex-shrink: 0; }
        .omnibox-icon.secure { color: #1e8e3e; }

        .omnibox-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          color: #202124;
          min-width: 0;
        }

        .star-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #5f6368;
          display: flex;
          padding: 2px;
        }

        .starred { color: #f4b400; }

        /* Bookmarks */
        .bookmarks-bar {
          display: flex;
          gap: 4px;
          padding: 4px 12px;
          background: #fff;
          border-bottom: 1px solid #e8eaed;
          overflow-x: auto;
        }

        .bookmark-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          font-size: 12px;
          color: #5f6368;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }

        .bookmark-chip:hover { background: #f1f3f4; color: #202124; }
        .bookmark-chip img { width: 14px; height: 14px; }

        /* Content */
        .chrome-content {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: #fff;
        }

        .chrome-content:fullscreen {
          background: #000;
        }

        .chrome-content:fullscreen .chrome-iframe {
          background: #000;
        }

        .chrome-iframe {
          width: 100%;
          height: 100%;
          border: none;
          background: #fff;
        }

        .loading-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #e8eaed;
          z-index: 5;
        }

        .loading-bar-inner {
          height: 100%;
          width: 40%;
          background: #1a73e8;
          animation: loadSlide 1s ease-in-out infinite;
        }

        @keyframes loadSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }

        .slides-banner {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(32,33,36,0.88);
          color: #fff;
          padding: 10px 16px;
          border-radius: 24px;
          font-size: 13px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          z-index: 4;
        }

        .slides-banner svg { width: 18px; height: 18px; flex-shrink: 0; }

        .slides-banner button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #1a73e8;
          color: #fff;
          border: none;
          border-radius: 16px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-left: 4px;
        }

        .slides-banner button:hover { background: #1765cc; }
        .slides-banner button svg { width: 14px; height: 14px; }

        /* New tab page */
        .ntp {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #fff;
        }

        .ntp-logo {
          font-size: 56px;
          font-weight: 500;
          letter-spacing: -2px;
          margin-bottom: 28px;
          font-family: 'Product Sans', 'Segoe UI', sans-serif;
        }

        .ntp-logo .g { color: #4285F4; }
        .ntp-logo .o1 { color: #EA4335; }
        .ntp-logo .o2 { color: #FBBC05; }
        .ntp-logo .g2 { color: #4285F4; }
        .ntp-logo .l { color: #34A853; }
        .ntp-logo .e { color: #EA4335; }

        .ntp-search {
          width: min(560px, 90%);
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border: 1px solid #dfe1e5;
          border-radius: 24px;
          padding: 12px 20px;
          box-shadow: 0 1px 6px rgba(32,33,36,0.12);
        }

        .ntp-search:focus-within {
          box-shadow: 0 1px 6px rgba(32,33,36,0.28);
          border-color: transparent;
        }

        .ntp-search svg { color: #9aa0a6; width: 20px; height: 20px; flex-shrink: 0; }

        .ntp-search input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 16px;
          color: #202124;
          background: transparent;
        }

        .ntp-hints {
          margin-top: 20px;
          text-align: center;
          color: #5f6368;
          font-size: 13px;
        }

        .ntp-hints code {
          display: inline-block;
          margin-top: 6px;
          background: #f1f3f4;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          color: #3c4043;
        }

        .ntp-shortcuts {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          margin-top: 36px;
        }

        .ntp-shortcut {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          width: 80px;
        }

        .shortcut-icon {
          width: 48px;
          height: 48px;
          background: #f1f3f4;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }

        .ntp-shortcut:hover .shortcut-icon { background: #e8eaed; }
        .shortcut-icon img { width: 24px; height: 24px; }
        .ntp-shortcut span { font-size: 12px; color: #5f6368; }

        /* Blocked / error */
        .blocked-view {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background: #f8f9fa;
        }

        .blocked-card {
          background: #fff;
          border-radius: 12px;
          padding: 32px;
          max-width: 480px;
          text-align: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid #e8eaed;
        }

        .blocked-card h2 { color: #202124; margin-bottom: 12px; font-size: 18px; }
        .blocked-card p { color: #5f6368; margin-bottom: 20px; font-size: 14px; line-height: 1.5; }

        .blocked-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .open-external-btn, .retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
        }

        .open-external-btn {
          background: #1a73e8;
          color: #fff;
        }

        .open-external-btn:hover { background: #1765cc; }

        .retry-btn {
          background: #f1f3f4;
          color: #202124;
        }

        .retry-btn:hover { background: #e8eaed; }
      `}</style>
    </div>
  );
};

export default BrowserApp;

export const ChromeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <Globe24Regular className={className} primaryFill="#4285F4" style={{ width: size, height: size }} />
);
