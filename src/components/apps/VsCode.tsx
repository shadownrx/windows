import React, { useState, useRef, useEffect } from 'react';

const VSCODE_FILES: Record<string, { content: string; language: string }> = {
  'index.tsx': {
    language: 'tsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
  },
  'App.tsx': {
    language: 'tsx',
    content: `import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Hello Windows 11</h1>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

export default App;`
  },
  'package.json': {
    language: 'json',
    content: `{
  "name": "windows-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}`
  },
  'index.css': {
    language: 'css',
    content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: #1a1a1a;
  color: #eee;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 24px;
}

button {
  padding: 10px 24px;
  background: #0078d4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

button:hover {
  background: #006cbe;
}`
  },
  'README.md': {
    language: 'markdown',
    content: `# Windows 11 React App

A beautiful Windows 11-style desktop environment built with React + Vite.

## Features
- 🖥️ Window management (drag, resize, minimize, maximize)
- 📁 File Explorer
- 🌐 Chrome Browser
- 📝 Notepad
- 🧮 Calculator
- ⚙️ Settings

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

## License
MIT`
  }
};

const LANG_COLORS: Record<string, string> = {
  tsx: '#569cd6',
  ts: '#569cd6',
  json: '#dcdcaa',
  css: '#ce9178',
  markdown: '#9cdcfe',
  md: '#9cdcfe',
};

const FILE_ICONS: Record<string, React.ReactNode> = {
  tsx: <svg viewBox="-11.5 -10.23174 23 20.46348" width="14" height="14"><circle cx="0" cy="0" r="2.05" fill="#61dafb"/><g stroke="#61dafb" strokeWidth="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>,
  ts: <svg viewBox="0 0 256 256" width="14" height="14"><rect width="256" height="256" fill="#3178C6"/><path d="M114.28 152.09l-34.93-1.07-1.1-28.79 73.1 1.05-.75 29.58-20.76 1.06-1.55 64.91-13.88.19 1.12-65.7zM189.9 220.35c-43.07 1.4-56.98-20.58-57.92-41.67l31.13-2c1.78 12.33 6.64 20.25 24.16 19.33 13.91-.73 20.08-8.22 19.8-15.53-.45-12.03-12.19-14.73-30.84-21.75-25.61-9.64-39.73-24.36-39.06-46.06.91-23.75 19.87-41.49 48.06-42.3 35.8-1.03 52.82 17.5 54.34 38.08l-30.33 4.25c-1.35-10.46-7.85-18.06-22.18-17.55-12.28.44-18.52 6.83-18.25 14.53.37 10.36 10.02 12.02 26.68 18.26 25.13 9.42 43.68 20.55 42.66 47.16-1.22 31.74-23.86 46.04-48.25 46.8" fill="#FFF"/></svg>,
  json: <span style={{ color: '#cbcb41', fontSize: 13, fontWeight: 'bold' }}>{"{}"}</span>,
  css: <span style={{ color: '#569cd6', fontSize: 14, fontWeight: 'bold' }}>#</span>,
  md: <span style={{ color: '#4facf0', fontSize: 14, fontWeight: 'bold' }}>↓</span>,
  markdown: <span style={{ color: '#4facf0', fontSize: 14, fontWeight: 'bold' }}>↓</span>,
};

function tokenize(code: string, lang: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, i) => {
    let highlighted = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    let tokenCounter = 0;
    const tokenMap: Record<string, string> = {};
    const stash = (html: string) => {
      const key = `___TK${tokenCounter++}___`;
      tokenMap[key] = html;
      return key;
    };

    if (lang === 'tsx' || lang === 'ts') {
      highlighted = highlighted.replace(/(\/\/.*)/g, (m) => stash(`<span style="color:#6a9955">${m}</span>`));
      highlighted = highlighted.replace(/(['"`])((?:[^\\]|\\.)*?)\1/g, (m) => stash(`<span style="color:#ce9178">${m}</span>`));
      highlighted = highlighted.replace(/(&lt;\/?)([\w.]+)/g, (m, p1, p2) => stash(`${p1}<span style="color:#4ec9b0">${p2}</span>`));
      highlighted = highlighted.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*:)/g, (m) => stash(`<span style="color:#9cdcfe">${m}</span>`));
      highlighted = highlighted.replace(/\b(import|export|from|const|let|var|function|return|default|interface|type|extends|implements|class|new|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|async|await|React|useState|useEffect|useRef|useCallback|void|null|undefined|true|false)\b/g, (m) => stash(`<span style="color:#569cd6">${m}</span>`));
    } else if (lang === 'json') {
      highlighted = highlighted.replace(/("[\w$]+")\s*:/g, (m, p1) => `${stash(`<span style="color:#9cdcfe">${p1}</span>`)}:`);
      highlighted = highlighted.replace(/:\s*(".*?")/g, (m, p1) => `: ${stash(`<span style="color:#ce9178">${p1}</span>`)}`);
      highlighted = highlighted.replace(/:\s*(\d+\.?\d*)/g, (m, p1) => `: ${stash(`<span style="color:#b5cea8">${p1}</span>`)}`);
    } else if (lang === 'css') {
      highlighted = highlighted.replace(/([\w-]+)\s*:/g, (m, p1) => `${stash(`<span style="color:#9cdcfe">${p1}</span>`)}:`);
      highlighted = highlighted.replace(/:\s*(.*?)(;|$)/g, (m, p1, p2) => `: ${stash(`<span style="color:#ce9178">${p1}</span>`)}${p2}`);
    }

    for (let j = tokenCounter - 1; j >= 0; j--) {
      highlighted = highlighted.replace(`___TK${j}___`, tokenMap[`___TK${j}___`]);
    }

    return (
      <div key={i} className="vsc-line">
        <span className="vsc-ln">{i + 1}</span>
        <span dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />
      </div>
    );
  });
}

const VsCode: React.FC = () => {
  const [activeFile, setActiveFile] = useState('App.tsx');
  const [openFiles, setOpenFiles] = useState<string[]>(['App.tsx', 'index.css']);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '  ➜  Local:   http://localhost:5173/',
    '  ➜  Network: http://192.168.1.100:5173/',
    '  ➜  press h + enter to show help',
  ]);
  const [termInput, setTermInput] = useState('');
  const termRef = useRef<HTMLDivElement>(null);

  const file = VSCODE_FILES[activeFile];

  const openFile = (name: string) => {
    if (!openFiles.includes(name)) setOpenFiles(prev => [...prev, name]);
    setActiveFile(name);
  };

  const closeFile = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = openFiles.filter(f => f !== name);
    setOpenFiles(next);
    if (activeFile === name) setActiveFile(next[next.length - 1] ?? '');
  };

  const handleTermInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = termInput.trim();
      const output: string[] = [];
      if (cmd === 'npm run dev') {
        output.push('> vite', '', 'VITE v5.4.2  ready in 312 ms', '  ➜  Local:   http://localhost:5173/');
      } else if (cmd === 'ls' || cmd === 'dir') {
        output.push('index.tsx  App.tsx  package.json  index.css  README.md');
      } else if (cmd === 'clear' || cmd === 'cls') {
        setTerminalLines([]);
        setTermInput('');
        return;
      } else if (cmd) {
        output.push(`bash: ${cmd}: command not found`);
      }
      setTerminalLines(prev => [...prev, `❯ ${cmd}`, ...output]);
      setTermInput('');
    }
  };

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [terminalLines]);

  const ext = activeFile.split('.').pop() ?? '';

  return (
    <div className="vsc-root">
      {/* Activity bar */}
      <div className="vsc-actbar">
        <button className="vsc-act-btn vsc-act-active" title="Explorador">
          <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        </button>
        <button className="vsc-act-btn" title="Buscar">
          <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </button>
        <button className="vsc-act-btn" title="Control de código">
          <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M6.5 3c-1.09 0-2.11.42-2.89 1.18C2.84 4.94 2.4 5.97 2.4 7.07s.44 2.13 1.21 2.9l7.64 7.64c.38.38.89.59 1.42.59h.07c.56-.02 1.08-.28 1.44-.72l7.64-7.64C22.6 9.07 23 8.07 23 7c0-1.07-.4-2.07-1.13-2.83C21.1 3.42 20.09 3 19 3c-1.09 0-2.11.42-2.88 1.18L12.09 8.2l-4.02-4.02C7.3 3.42 6.27 3 6.5 3z" opacity=".3"/><path fill="currentColor" d="M12 21.41 3.41 12.8C3.14 12.53 3 12.17 3 11.8c0-.37.14-.73.41-1L6 8.22V7.07c0-1.1.44-2.13 1.2-2.89l.01-.01L12 9.24l4.58-4.58C17.14 4.09 17.96 4 18.5 4h.5c1.1 0 2.13.44 2.89 1.2.77.77 1.21 1.8 1.21 2.9 0 1.07-.4 2.07-1.12 2.83L12 21.41z"/></svg>
        </button>
        <button className="vsc-act-btn" title="Extensiones">
          <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5A2.5 2.5 0 0 0 10.5 1 2.5 2.5 0 0 0 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5C4.99 10.8 6.2 12.01 6.2 13.5S4.99 16.2 3.5 16.2H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>
        </button>
        <div style={{ flex: 1 }} />
        <button className="vsc-act-btn" title="Configuración" onClick={() => setTerminalOpen(t => !t)}>
          <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H4V7h16v10zM6 10l1.5 1.5L6 13l-1.5-1.5L6 10zm4 3h6v1.5h-6V13zm0-3.5h6V11h-6V9.5z"/></svg>
        </button>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="vsc-sidebar">
          <div className="vsc-sidebar-title">EXPLORADOR</div>
          <div className="vsc-sidebar-section">
            <div className="vsc-sidebar-folder">
              <svg viewBox="0 0 24 24" width="14" height="14"><path fill="#c8c8c8" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
              <span>windows</span>
            </div>
            {Object.keys(VSCODE_FILES).map(fname => (
              <div
                key={fname}
                className={`vsc-file ${activeFile === fname ? 'vsc-file-active' : ''}`}
                onClick={() => openFile(fname)}
              >
                <span className="vsc-file-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: LANG_COLORS[fname.split('.').pop() ?? ''] || '#ccc' }}>
                  {FILE_ICONS[fname.split('.').pop() ?? ''] || '📄'}
                </span>
                <span>{fname}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="vsc-main">
        {/* Tabs */}
        <div className="vsc-tabs">
          <button className="vsc-sidebar-toggle" onClick={() => setSidebarOpen(s => !s)} title="Alternar barra lateral">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>
          {openFiles.map(fname => (
            <div
              key={fname}
              className={`vsc-tab ${activeFile === fname ? 'vsc-tab-active' : ''}`}
              onClick={() => setActiveFile(fname)}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: LANG_COLORS[fname.split('.').pop() ?? ''] || '#ccc', fontSize: 11, marginRight: 6 }}>
                {FILE_ICONS[fname.split('.').pop() ?? ''] || '📄'}
              </span>
              <span>{fname}</span>
              <button className="vsc-tab-close" onClick={e => closeFile(fname, e)}>✕</button>
            </div>
          ))}
        </div>

        {/* Editor */}
        {activeFile && file ? (
          <div className="vsc-editor">
            <div className="vsc-code">
              {tokenize(file.content, file.language)}
            </div>
          </div>
        ) : (
          <div className="vsc-welcome">
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              <svg viewBox="0 0 100 100" width="64" height="64">
                <path d="M74.9 10.4L50 35.3l-11-11L10 42.8v14.4l11-8.2 11 11 28-28.9V74l-11-8-11 11 28.9 13L90 79V21z" fill="#007ACC"/>
              </svg>
            </div>
            <div style={{ fontSize: 20, color: '#fff', marginBottom: 8 }}>Visual Studio Code</div>
            <div style={{ fontSize: 13, color: '#6e6e6e' }}>Selecciona un archivo del explorador</div>
          </div>
        )}

        {/* Terminal */}
        {terminalOpen && (
          <div className="vsc-terminal">
            <div className="vsc-term-header">
              <span>TERMINAL</span>
              <button className="vsc-term-close" onClick={() => setTerminalOpen(false)}>✕</button>
            </div>
            <div className="vsc-term-body" ref={termRef}>
              <div style={{ color: '#569cd6', marginBottom: 8, fontSize: 11 }}>
                Bash — windows — {new Date().toLocaleTimeString()}
              </div>
              {terminalLines.map((l, i) => (
                <div key={i} className="vsc-term-line" style={{ color: l.startsWith('❯') ? '#4ec9b0' : l.includes('error') || l.includes('not found') ? '#f44747' : '#ccc' }}>
                  {l}
                </div>
              ))}
              <div className="vsc-term-prompt">
                <span style={{ color: '#4ec9b0' }}>❯</span>
                <input
                  className="vsc-term-input"
                  value={termInput}
                  onChange={e => setTermInput(e.target.value)}
                  onKeyDown={handleTermInput}
                  autoFocus={terminalOpen}
                  placeholder=""
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="vsc-statusbar">
        <div className="vsc-status-left">
          <span className="vsc-status-item">
            <svg viewBox="0 0 16 16" width="12" height="12"><path fill="currentColor" d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3c.536 0 1 .268 1.285.682A.998.998 0 0 1 7.5 2V1a1 1 0 0 1 2 0v1a.998.998 0 0 1 .715-.318C10.5 1.268 10.964 1 11.5 1h3A1.5 1.5 0 0 1 16 2.5v3c0 .536-.268 1-.682 1.285A.998.998 0 0 1 16 7.5v1a1 1 0 0 1-2 0v-1a.998.998 0 0 1 .318.715C14.732 8.5 15 8.964 15 9.5v3A1.5 1.5 0 0 1 13.5 14h-3c-.536 0-1-.268-1.285-.682A.998.998 0 0 1 8.5 14V15a1 1 0 0 1-2 0v-1a.998.998 0 0 1-.715.318C5.5 14.732 5.036 15 4.5 15h-3A1.5 1.5 0 0 1 0 13.5v-3c0-.536.268-1 .682-1.285A.998.998 0 0 1 0 8.5v-1a1 1 0 0 1 2 0v1a.998.998 0 0 1-.318-.715C1.268 7.5 1 7.036 1 6.5v-4z"/></svg>
            main
          </span>
          <span className="vsc-status-item">⚠ 0  ⓘ 0</span>
        </div>
        <div className="vsc-status-right">
          <span className="vsc-status-item">Ln 1, Col 1</span>
          <span className="vsc-status-item">UTF-8</span>
          <span className="vsc-status-item">{ext.toUpperCase() || 'Plain Text'}</span>
          <span className="vsc-status-item">Prettier</span>
        </div>
      </div>

      <style>{`
        .vsc-root {
          display: flex;
          height: 100%;
          background: #1e1e1e;
          color: #d4d4d4;
          font-family: 'Consolas', 'Courier New', monospace;
          overflow: hidden;
          font-size: 13px;
        }

        /* Activity bar */
        .vsc-actbar {
          width: 48px;
          background: #333333;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px 0;
          gap: 4px;
          flex-shrink: 0;
        }
        .vsc-act-btn {
          width: 48px;
          height: 48px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.1s;
          position: relative;
        }
        .vsc-act-btn:hover { color: rgba(255,255,255,0.9); }
        .vsc-act-active { color: rgba(255,255,255,0.9) !important; }
        .vsc-act-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: #007acc;
          border-radius: 0 2px 2px 0;
        }

        /* Sidebar */
        .vsc-sidebar {
          width: 220px;
          background: #252526;
          border-right: 1px solid #1e1e1e;
          overflow-y: auto;
          flex-shrink: 0;
        }
        .vsc-sidebar-title {
          font-size: 10px;
          font-weight: 700;
          color: #bbb;
          padding: 10px 12px 6px;
          letter-spacing: 0.1em;
          font-family: 'Segoe UI', sans-serif;
        }
        .vsc-sidebar-folder {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px 4px 20px;
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          font-family: 'Segoe UI', sans-serif;
          font-weight: 600;
        }
        .vsc-file {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 3px 8px 3px 36px;
          font-size: 13px;
          color: rgba(255,255,255,0.65);
          cursor: pointer;
          transition: background 0.1s;
          font-family: 'Segoe UI', sans-serif;
        }
        .vsc-file:hover { background: rgba(255,255,255,0.06); color: white; }
        .vsc-file-active { background: #094771 !important; color: white !important; }
        .vsc-file-icon { font-size: 11px; width: 16px; text-align: center; }

        /* Main */
        .vsc-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .vsc-tabs {
          display: flex;
          align-items: stretch;
          background: #252526;
          border-bottom: 1px solid #1e1e1e;
          overflow-x: auto;
          scrollbar-width: none;
          flex-shrink: 0;
          min-height: 35px;
        }
        .vsc-tabs::-webkit-scrollbar { display: none; }
        .vsc-sidebar-toggle {
          flex-shrink: 0;
          width: 35px;
          background: transparent;
          border: none;
          border-right: 1px solid #1e1e1e;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vsc-sidebar-toggle:hover { color: white; background: rgba(255,255,255,0.05); }
        .vsc-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 14px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          border-right: 1px solid #1e1e1e;
          white-space: nowrap;
          transition: background 0.1s, color 0.1s;
          font-family: 'Segoe UI', sans-serif;
          min-width: 100px;
          position: relative;
        }
        .vsc-tab:hover { background: #2d2d2d; color: rgba(255,255,255,0.8); }
        .vsc-tab-active {
          background: #1e1e1e !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .vsc-tab-active::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: #007acc;
        }
        .vsc-tab-close {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 10px;
          cursor: pointer;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          opacity: 0;
          transition: opacity 0.1s, background 0.1s;
          padding: 0;
        }
        .vsc-tab:hover .vsc-tab-close { opacity: 1; }
        .vsc-tab-close:hover { background: rgba(255,255,255,0.15); color: white; }

        /* Editor */
        .vsc-editor {
          flex: 1;
          overflow: auto;
          background: #1e1e1e;
          padding: 8px 0;
        }
        .vsc-code {
          min-width: 100%;
          display: inline-block;
        }
        .vsc-line {
          display: flex;
          align-items: baseline;
          gap: 0;
          min-height: 19px;
          padding: 0 16px 0 0;
          white-space: pre;
          font-size: 13px;
          line-height: 19px;
        }
        .vsc-line:hover { background: rgba(255,255,255,0.03); }
        .vsc-ln {
          width: 42px;
          min-width: 42px;
          text-align: right;
          padding-right: 16px;
          color: #858585;
          user-select: none;
          font-size: 12px;
          flex-shrink: 0;
        }

        /* Welcome */
        .vsc-welcome {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #6e6e6e;
          font-family: 'Segoe UI', sans-serif;
        }

        /* Terminal */
        .vsc-terminal {
          height: 180px;
          background: #1e1e1e;
          border-top: 1px solid #454545;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .vsc-term-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 12px;
          background: #252526;
          font-size: 11px;
          color: #ccc;
          letter-spacing: 0.08em;
          font-family: 'Segoe UI', sans-serif;
        }
        .vsc-term-close {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .vsc-term-close:hover { background: rgba(255,255,255,0.1); color: white; }
        .vsc-term-body {
          flex: 1;
          overflow-y: auto;
          padding: 8px 14px;
          font-size: 12.5px;
          line-height: 1.5;
        }
        .vsc-term-line { white-space: pre-wrap; word-break: break-all; }
        .vsc-term-prompt {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }
        .vsc-term-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #d4d4d4;
          font-family: 'Consolas', monospace;
          font-size: 12.5px;
          outline: none;
        }

        /* Status bar */
        .vsc-statusbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 22px;
          background: #007acc;
          padding: 0 12px;
          font-size: 11px;
          color: white;
          font-family: 'Segoe UI', sans-serif;
          flex-shrink: 0;
          user-select: none;
        }
        .vsc-status-left, .vsc-status-right {
          display: flex;
          align-items: center;
          gap: 0;
        }
        .vsc-status-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0 8px;
          height: 22px;
          cursor: pointer;
          transition: background 0.1s;
        }
        .vsc-status-item:hover { background: rgba(0,0,0,0.15); }
      `}</style>
    </div>
  );
};

export default VsCode;
