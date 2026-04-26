import React, { useState, useRef, useEffect } from 'react';

const INITIAL_VSCODE_FILES: Record<string, { content: string; language: string }> = {
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
      <p>Editing this will change the terminal output!</p>
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
  const [files, setFiles] = useState(INITIAL_VSCODE_FILES);
  const [activeFile, setActiveFile] = useState('App.tsx');
  const [openFiles, setOpenFiles] = useState<string[]>(['App.tsx', 'index.css']);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '  ➜  Local:   http://localhost:5173/',
    '  ➜  Network: http://192.168.1.100:5173/',
    '  ➜  press h + enter to show help',
  ]);
  const [termInput, setTermInput] = useState('');
  const termRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const getPreviewHtml = () => {
    let code = '';
    if (files['pages/index.tsx']) {
      code = files['pages/index.tsx'].content;
    } else if (files['App.tsx']) {
      code = files['App.tsx'].content;
    } else {
      return '<html><body style="background:#fff;color:#000;font-family:sans-serif;padding:20px"><h3>No App.tsx or index.tsx found</h3></body></html>';
    }

    let executableCode = code
      .replace(/import .*? from ['"].*?['"];?/g, '')
      .replace(/export default function/g, 'function')
      .replace(/export default \w+;?/g, '');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; color: #000000; padding: 20px; margin: 0; }
          .app { max-width: 800px; margin: 0 auto; }
          button { padding: 8px 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #005a9e; }
        </style>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          const { useState, useEffect, useRef, useMemo, useCallback } = React;
          const Head = ({children}) => <>{children}</>;

          try {
            ${executableCode}
            const match = \`${executableCode.replace(/`/g, '\\`')}\`.match(/function\\s+([A-Z]\\w*)/);
            const ComponentName = match ? match[1] : 'App';
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(eval(ComponentName)));
          } catch(e) {
            document.getElementById('root').innerHTML = '<div style="color:red; font-family: monospace; white-space: pre-wrap;">Error: ' + e.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;
  };

  const file = files[activeFile];

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

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setFiles(prev => ({
      ...prev,
      [activeFile]: {
        ...prev[activeFile],
        content: newContent
      }
    }));
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleTermInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = termInput.trim();
      setTerminalLines(prev => [...prev, `❯ ${cmd}`]);
      setTermInput('');
      if (!cmd) return;

      const pushLines = (lines: string[]) => setTerminalLines(prev => [...prev, ...lines]);

      if (cmd === 'npm run dev' || cmd === 'npm start') {
        const pkgJson = files['package.json']?.content || '';
        if (pkgJson.includes('next dev')) {
            pushLines(['> next dev']);
            setTimeout(() => {
                pushLines(['ready - started server on 0.0.0.0:3000, url: http://localhost:3000', 'event - compiled client and server successfully']);
                setPreviewOpen(true);
            }, 1000);
        } else {
            pushLines(['> vite', '', 'VITE v5.4.2  ready in 312 ms', '  ➜  Local:   http://localhost:5173/']);
            if (files['App.tsx']?.content.includes('error') || (files['App.tsx'] && !files['App.tsx'].content.includes('return'))) {
                pushLines(['', '[vite] Internal server error: Failed to parse source for /src/App.tsx', '  1 |  import React from "react";', '  > 2 |  const App = () => { error }']);
            } else {
                setTimeout(() => setPreviewOpen(true), 500);
            }
        }
      } else if (cmd.startsWith('npm install') || cmd.startsWith('npm i')) {
        pushLines(['> npm install']);
        setTimeout(() => {
          if (cmd.includes('next')) {
            pushLines([
              'added 254 packages, and audited 255 packages in 3s',
              '103 packages are looking for funding',
              '  run `npm fund` for details',
              '',
              'found 0 vulnerabilities'
            ]);
            try {
              const currentPkgJson = JSON.parse(files['package.json']?.content || '{}');
              if (!currentPkgJson.dependencies) currentPkgJson.dependencies = {};
              currentPkgJson.dependencies['next'] = 'latest';
              setFiles(prev => ({
                ...prev,
                'package.json': {
                  language: 'json',
                  content: JSON.stringify(currentPkgJson, null, 2)
                }
              }));
            } catch (err) {}
          } else {
            pushLines([
              'added 120 packages, and audited 121 packages in 2s',
              '50 packages are looking for funding',
              '  run `npm fund` for details',
              '',
              'found 0 vulnerabilities'
            ]);
          }
        }, 1500);
      } else if (cmd.startsWith('npx create-next-app')) {
        pushLines(['Creating a new Next.js app...', 'Installing dependencies:']);
        setTimeout(() => pushLines(['- react', '- react-dom', '- next']), 800);
        setTimeout(() => {
          pushLines(['', 'Success! Created new Next.js app.']);
          setFiles(prev => ({
            ...prev,
            'pages/index.tsx': {
              language: 'tsx',
              content: `export default function Home() {\n  return (\n    <div style={{ padding: 40, fontFamily: 'sans-serif', color: 'white' }}>\n      <h1>Welcome to Next.js!</h1>\n      <p>This is a realistic simulated environment.</p>\n    </div>\n  );\n}`
            },
            'next.config.js': {
              language: 'ts',
              content: `/** @type {import('next').NextConfig} */\nconst nextConfig = {}\n\nmodule.exports = nextConfig`
            },
            'package.json': {
              language: 'json',
              content: `{\n  "name": "next-app",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start"\n  },\n  "dependencies": {\n    "next": "14.2.3",\n    "react": "^18",\n    "react-dom": "^18"\n  }\n}`
            }
          }));
        }, 2000);
      } else if (cmd === 'npm run build') {
        const pkgJson = files['package.json']?.content || '';
        if (pkgJson.includes('next build')) {
            pushLines(['> next build', 'info  - Linting and checking validity of types...']);
            setTimeout(() => pushLines(['info  - Creating an optimized production build...', 'info  - Compiled successfully']), 1000);
            setTimeout(() => pushLines(['info  - Collecting page data...', 'info  - Generating static pages (3/3)', 'info  - Finalizing page optimization...']), 2000);
        } else {
            pushLines(['> vite build', 'vite v5.4.2 building for production...', '✓ 34 modules transformed.', 'dist/index.html  0.45 kB', 'dist/assets/index-BvM0w.css  1.20 kB', 'dist/assets/index-CqN.js  145.2 kB']);
        }
      } else if (cmd === 'ls' || cmd === 'dir') {
        pushLines([Object.keys(files).join('  ')]);
      } else if (cmd === 'clear' || cmd === 'cls') {
        setTerminalLines([]);
      } else if (cmd.startsWith('cat ')) {
        const target = cmd.slice(4).trim() || activeFile;
        if (files[target]) {
           pushLines(files[target].content.split('\n'));
        } else {
           pushLines([`cat: ${target}: No such file or directory`]);
        }
      } else {
        pushLines([`bash: ${cmd}: command not found`]);
      }
    }
  };

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [terminalLines]);

  const ext = activeFile.split('.').pop() ?? '';

  return (
    <div className="vsc-wrapper">
      <div className="vsc-content">
        {/* Activity bar */}
        <div className="vsc-actbar">
          <button className={`vsc-act-btn ${sidebarOpen ? 'vsc-act-active' : ''}`} title="Explorer" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          </button>
          <button className="vsc-act-btn" title="Search">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </button>
          <button className="vsc-act-btn" title="Source Control">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6.5 3c-1.09 0-2.11.42-2.89 1.18C2.84 4.94 2.4 5.97 2.4 7.07s.44 2.13 1.21 2.9l7.64 7.64c.38.38.89.59 1.42.59h.07c.56-.02 1.08-.28 1.44-.72l7.64-7.64C22.6 9.07 23 8.07 23 7c0-1.07-.4-2.07-1.13-2.83C21.1 3.42 20.09 3 19 3c-1.09 0-2.11.42-2.88 1.18L12.09 8.2l-4.02-4.02C7.3 3.42 6.27 3 6.5 3z" opacity=".3"/><path fill="currentColor" d="M12 21.41 3.41 12.8C3.14 12.53 3 12.17 3 11.8c0-.37.14-.73.41-1L6 8.22V7.07c0-1.1.44-2.13 1.2-2.89l.01-.01L12 9.24l4.58-4.58C17.14 4.09 17.96 4 18.5 4h.5c1.1 0 2.13.44 2.89 1.2.77.77 1.21 1.8 1.21 2.9 0 1.07-.4 2.07-1.12 2.83L12 21.41z"/></svg>
          </button>
          <button className="vsc-act-btn" title="Extensions">
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5A2.5 2.5 0 0 0 10.5 1 2.5 2.5 0 0 0 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5C4.99 10.8 6.2 12.01 6.2 13.5S4.99 16.2 3.5 16.2H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>
          </button>
          <div style={{ flex: 1 }} />
          <button className="vsc-act-btn" title="Settings" onClick={() => setTerminalOpen(t => !t)}>
            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H4V7h16v10zM6 10l1.5 1.5L6 13l-1.5-1.5L6 10zm4 3h6v1.5h-6V13zm0-3.5h6V11h-6V9.5z"/></svg>
          </button>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="vsc-sidebar">
            <div className="vsc-sidebar-title">EXPLORER</div>
            <div className="vsc-sidebar-section">
              <div className="vsc-sidebar-folder">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                <span>WINDOWS</span>
              </div>
              {Object.keys(files).map(fname => (
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
          {/* Editor Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
            {/* Code Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Tabs */}
              <div className="vsc-tabs" style={{ paddingRight: 8 }}>
                <div style={{ display: 'flex', flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
                  {openFiles.map(fname => (
                    <div
                      key={fname}
                      className={`vsc-tab ${activeFile === fname ? 'vsc-tab-active' : ''}`}
                      onClick={() => setActiveFile(fname)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: LANG_COLORS[fname.split('.').pop() ?? ''] || '#ccc', fontSize: 13, marginRight: 6 }}>
                        {FILE_ICONS[fname.split('.').pop() ?? ''] || '📄'}
                      </span>
                      <span>{fname}</span>
                      <button className="vsc-tab-close" onClick={e => closeFile(fname, e)}>
                        <svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M14.36 4.36l-1.42-1.42L8 7.88 3.06 2.94 1.64 4.36 6.58 9.3l-4.94 4.94 1.42 1.42L8 10.72l4.94 4.94 1.42-1.42L9.42 9.3l4.94-4.94z"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
                {/* Split Preview Button */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                  <button 
                    title="Split Preview"
                    onClick={() => setPreviewOpen(!previewOpen)}
                    style={{ background: 'transparent', border: 'none', color: '#cccccc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 3 }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16"><path fill="currentColor" d="M14.5 2h-13a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5zM8 13H2V3h6v10zm6 0H9V3h5v10z"/></svg>
                  </button>
                </div>
              </div>

          {/* Breadcrumbs */}
          {activeFile && (
            <div className="vsc-breadcrumbs">
              <span style={{color: '#007fd4', marginRight: 4}}>windows</span> 
              <svg viewBox="0 0 16 16" width="12" height="12" style={{marginRight: 4}}><path fill="currentColor" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z"/></svg>
              {activeFile.includes('/') ? activeFile.split('/')[0] : 'src'}
              <svg viewBox="0 0 16 16" width="12" height="12" style={{marginRight: 4, marginLeft: 4}}><path fill="currentColor" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z"/></svg>
              <span style={{ display: 'flex', alignItems: 'center', color: LANG_COLORS[activeFile.split('.').pop() ?? ''] || '#ccc', marginRight: 6 }}>
                  {FILE_ICONS[activeFile.split('.').pop() ?? ''] || '📄'}
              </span>
              {activeFile.split('/').pop()}
            </div>
          )}

          {/* Editor */}
          {activeFile && file ? (
            <div className="vsc-editor-container">
              <textarea
                ref={editorRef}
                className="vsc-textarea"
                value={file.content}
                onChange={handleCodeChange}
                onScroll={handleScroll}
                spellCheck={false}
                wrap="off"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
              />
              <div className="vsc-highlight" ref={highlightRef}>
                {tokenize(file.content, file.language)}
              </div>
            </div>
          ) : (
            <div className="vsc-welcome">
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                <svg viewBox="0 0 100 100" width="80" height="80">
                  <path d="M74.9 10.4L50 35.3l-11-11L10 42.8v14.4l11-8.2 11 11 28-28.9V74l-11-8-11 11 28.9 13L90 79V21z" fill="#007ACC"/>
                </svg>
              </div>
              <div style={{ fontSize: 28, color: '#cccccc', marginBottom: 20 }}>Visual Studio Code</div>
              <div style={{ fontSize: 14, color: '#858585' }}>Start</div>
              <div style={{ fontSize: 13, color: '#007fd4', marginTop: 10, cursor: 'pointer' }}>New File...</div>
              <div style={{ fontSize: 13, color: '#007fd4', marginTop: 8, cursor: 'pointer' }}>Open File...</div>
              <div style={{ fontSize: 13, color: '#007fd4', marginTop: 8, cursor: 'pointer' }}>Open Folder...</div>
            </div>
          )}
            </div>
            
            {/* Preview Column */}
            {previewOpen && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: '1px solid #2b2b2b', background: '#1e1e1e' }}>
                {/* Preview Header */}
                <div style={{ height: 35, background: '#181818', display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: '1px solid #2b2b2b' }}>
                  <svg viewBox="0 0 16 16" width="14" height="14" style={{ color: '#cccccc', marginRight: 8 }}><path fill="currentColor" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13V2a6 6 0 1 1 0 12z"/></svg>
                  <div style={{ fontSize: 12, color: '#cccccc', flex: 1 }}>Simple Browser - localhost:3000</div>
                  <button onClick={() => setPreviewOpen(false)} style={{ background: 'transparent', border: 'none', color: '#cccccc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 3 }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                     <svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M14.36 4.36l-1.42-1.42L8 7.88 3.06 2.94 1.64 4.36 6.58 9.3l-4.94 4.94 1.42 1.42L8 10.72l4.94 4.94 1.42-1.42L9.42 9.3l4.94-4.94z"/></svg>
                  </button>
                </div>
                {/* Preview Iframe */}
                <iframe srcDoc={getPreviewHtml()} style={{ flex: 1, border: 'none', background: '#fff' }} sandbox="allow-scripts allow-same-origin" />
              </div>
            )}
          </div>

          {/* Terminal */}
          {terminalOpen && (
            <div className="vsc-terminal">
              <div className="vsc-term-header">
                <div className="vsc-term-tabs">
                  <span className="vsc-term-tab">PROBLEMS</span>
                  <span className="vsc-term-tab">OUTPUT</span>
                  <span className="vsc-term-tab">DEBUG CONSOLE</span>
                  <span className="vsc-term-tab vsc-term-tab-active">TERMINAL</span>
                  <span className="vsc-term-tab">PORTS</span>
                </div>
                <div className="vsc-term-actions">
                  <button className="vsc-term-action" title="Clear Terminal" onClick={() => setTerminalLines([])}>
                    <svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M2.5 1h11l.5.5v13l-.5.5h-11l-.5-.5v-13l.5-.5zM3 2v12h10V2H3zm2.5 2h5v1h-5V4zm0 3h5v1h-5V7zm0 3h5v1h-5v-1z"/></svg>
                  </button>
                  <button className="vsc-term-action" title="Close Panel" onClick={() => setTerminalOpen(false)}>
                    <svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M14.36 4.36l-1.42-1.42L8 7.88 3.06 2.94 1.64 4.36 6.58 9.3l-4.94 4.94 1.42 1.42L8 10.72l4.94 4.94 1.42-1.42L9.42 9.3l4.94-4.94z"/></svg>
                  </button>
                </div>
              </div>
              <div className="vsc-term-body" ref={termRef}>
                <div style={{ color: '#569cd6', marginBottom: 8, fontSize: 12 }}>
                  Bash — windows — {new Date().toLocaleTimeString()}
                </div>
                {terminalLines.map((l, i) => (
                  <div key={i} className="vsc-term-line" style={{ color: l.startsWith('❯') ? '#4ec9b0' : l.includes('error') || l.includes('not found') ? '#f44747' : '#cccccc' }}>
                    {l}
                  </div>
                ))}
                <div className="vsc-term-prompt">
                  <span style={{ color: '#4ec9b0', fontWeight: 'bold' }}>marti@windows</span>
                  <span style={{ color: '#007fd4', marginLeft: 4, marginRight: 4 }}>~/windows</span>
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
      </div>

      {/* Status bar */}
      <div className="vsc-statusbar">
        <div className="vsc-status-left">
          <span className="vsc-status-item">
            <svg viewBox="0 0 16 16" width="14" height="14" style={{marginRight: 4}}><path fill="currentColor" d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3c.536 0 1 .268 1.285.682A.998.998 0 0 1 7.5 2V1a1 1 0 0 1 2 0v1a.998.998 0 0 1 .715-.318C10.5 1.268 10.964 1 11.5 1h3A1.5 1.5 0 0 1 16 2.5v3c0 .536-.268 1-.682 1.285A.998.998 0 0 1 16 7.5v1a1 1 0 0 1-2 0v-1a.998.998 0 0 1 .318.715C14.732 8.5 15 8.964 15 9.5v3A1.5 1.5 0 0 1 13.5 14h-3c-.536 0-1-.268-1.285-.682A.998.998 0 0 1 8.5 14V15a1 1 0 0 1-2 0v-1a.998.998 0 0 1-.715.318C5.5 14.732 5.036 15 4.5 15h-3A1.5 1.5 0 0 1 0 13.5v-3c0-.536.268-1 .682-1.285A.998.998 0 0 1 0 8.5v-1a1 1 0 0 1 2 0v1a.998.998 0 0 1-.318-.715C1.268 7.5 1 7.036 1 6.5v-4z"/></svg>
            main
          </span>
          <span className="vsc-status-item">
            <svg viewBox="0 0 16 16" width="14" height="14" style={{marginRight: 4}}><path fill="currentColor" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-3.5a.75.75 0 0 1 .75.75v3.69l3.22 1.86a.75.75 0 0 1-.74 1.3l-3.5-2a.75.75 0 0 1-.48-.65V5.25A.75.75 0 0 1 8 4.5z"/></svg>
            0
          </span>
          <span className="vsc-status-item">
            <svg viewBox="0 0 16 16" width="14" height="14" style={{marginRight: 4}}><path fill="currentColor" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm9 3.5H7V7h2v4.5zM8 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>
            0
          </span>
        </div>
        <div className="vsc-status-right">
          <span className="vsc-status-item">Ln 1, Col 1</span>
          <span className="vsc-status-item">Spaces: 2</span>
          <span className="vsc-status-item">UTF-8</span>
          <span className="vsc-status-item">{ext.toUpperCase() || 'Plain Text'}</span>
          <span className="vsc-status-item">Prettier</span>
        </div>
      </div>

      <style>{`
        .vsc-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #181818;
          color: #cccccc;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }

        .vsc-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* Activity bar */
        .vsc-actbar {
          width: 48px;
          background: #181818;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 0;
          gap: 8px;
          flex-shrink: 0;
        }
        .vsc-act-btn {
          width: 48px;
          height: 48px;
          background: transparent;
          border: none;
          color: #858585;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .vsc-act-btn:hover { color: #cccccc; }
        .vsc-act-active { color: #ffffff !important; }
        .vsc-act-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #007fd4;
        }

        /* Sidebar */
        .vsc-sidebar {
          width: 220px;
          background: #181818;
          border-right: 1px solid #2b2b2b;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .vsc-sidebar-title {
          font-size: 11px;
          color: #cccccc;
          padding: 12px 20px 10px;
          text-transform: uppercase;
        }
        .vsc-sidebar-section {
          flex: 1;
          overflow-y: auto;
        }
        .vsc-sidebar-folder {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px 4px 12px;
          font-size: 11px;
          font-weight: bold;
          color: #cccccc;
          text-transform: uppercase;
          cursor: pointer;
        }
        .vsc-sidebar-folder:hover { background: #2a2d2e; }
        .vsc-file {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px 3px 24px;
          font-size: 13px;
          color: #cccccc;
          cursor: pointer;
        }
        .vsc-file:hover { background: #2a2d2e; }
        .vsc-file-active { background: #37373d; color: #ffffff; }

        /* Main */
        .vsc-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #1f1f1f;
          overflow: hidden;
        }

        /* Tabs */
        .vsc-tabs {
          display: flex;
          background: #181818;
          overflow-x: auto;
          scrollbar-width: none;
          min-height: 35px;
        }
        .vsc-tabs::-webkit-scrollbar { display: none; }
        .vsc-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px 0 14px;
          font-size: 13px;
          color: #969696;
          background: #181818;
          border-right: 1px solid #2b2b2b;
          border-top: 1px solid transparent;
          cursor: pointer;
          min-width: 120px;
        }
        .vsc-tab:hover { background: #1f1f1f; }
        .vsc-tab-active {
          background: #1f1f1f !important;
          color: #ffffff;
          border-top: 1px solid #007fd4;
        }
        .vsc-tab-close {
          margin-left: auto;
          opacity: 0;
          color: #cccccc;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 3px;
          width: 20px;
          height: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .vsc-tab:hover .vsc-tab-close { opacity: 1; }
        .vsc-tab-close:hover { background: rgba(255,255,255,0.1); }

        /* Breadcrumbs */
        .vsc-breadcrumbs {
          display: flex;
          align-items: center;
          padding: 0 14px;
          height: 22px;
          background: #1f1f1f;
          color: #969696;
          font-size: 12px;
        }

        /* Editor */
        .vsc-editor-container {
          flex: 1;
          position: relative;
          background: #1f1f1f;
          overflow: hidden;
        }
        .vsc-textarea {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 16px 0;
          padding-left: 58px;
          background: transparent;
          color: transparent;
          caret-color: #aeafad;
          border: none;
          outline: none;
          resize: none;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 14px;
          line-height: 21px;
          white-space: pre !important;
          overflow: auto;
          z-index: 2;
          box-sizing: border-box;
        }
        .vsc-highlight {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 16px 0;
          pointer-events: none;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 14px;
          line-height: 21px;
          white-space: pre !important;
          overflow: hidden;
          z-index: 1;
          box-sizing: border-box;
        }
        .vsc-line {
          display: flex;
          align-items: baseline;
          gap: 0;
          min-height: 21px;
          padding: 0 16px 0 0;
          white-space: pre !important;
          font-size: 14px;
          line-height: 21px;
        }
        .vsc-line:hover { background: rgba(255,255,255,0.03); }
        .vsc-ln {
          width: 58px;
          min-width: 58px;
          text-align: right;
          padding-right: 16px;
          color: #6e7681;
          user-select: none;
          font-size: 13px;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        /* Welcome */
        .vsc-welcome {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #1f1f1f;
        }

        /* Terminal */
        .vsc-terminal {
          height: 250px;
          background: #1e1e1e;
          border-top: 1px solid #2b2b2b;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .vsc-term-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 0 14px;
          height: 35px;
          border-bottom: 1px solid #2b2b2b;
        }
        .vsc-term-tabs {
          display: flex;
          gap: 20px;
        }
        .vsc-term-tab {
          font-size: 11px;
          color: #858585;
          padding-bottom: 8px;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .vsc-term-tab:hover { color: #cccccc; }
        .vsc-term-tab-active {
          color: #e7e7e7;
          border-bottom: 1px solid #e7e7e7;
        }
        .vsc-term-actions {
          display: flex;
          gap: 8px;
          padding-bottom: 8px;
        }
        .vsc-term-action {
          background: transparent;
          border: none;
          color: #cccccc;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
        }
        .vsc-term-action:hover { opacity: 1; }
        .vsc-term-body {
          flex: 1;
          overflow-y: auto;
          padding: 8px 14px;
          font-size: 13px;
          line-height: 1.5;
          font-family: 'Consolas', 'Courier New', monospace;
        }
        .vsc-term-line { white-space: pre-wrap; word-break: break-all; }
        .vsc-term-prompt {
          display: flex;
          align-items: center;
          margin-top: 4px;
        }
        .vsc-term-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #cccccc;
          font-family: 'Consolas', monospace;
          font-size: 13px;
          outline: none;
          margin-left: 8px;
        }

        /* Status bar */
        .vsc-statusbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 22px;
          background: #007acc;
          padding: 0 12px;
          font-size: 11.5px;
          color: white;
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
        .vsc-status-item:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
};

export default VsCode;
