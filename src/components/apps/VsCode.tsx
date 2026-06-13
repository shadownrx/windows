import React, { useState, useRef, useEffect } from 'react';

const INITIAL_VSCODE_FILES: Record<string, { content: string; language: string }> = {
  'src/App.tsx': {
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
  'src/index.tsx': {
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
  'src/index.css': {
    language: 'css',
    content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #ffffff;
  color: #333;
}

.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  text-align: center;
}

h1 {
  color: #0078d4;
}

button {
  padding: 10px 24px;
  background: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  margin-top: 20px;
}

button:hover {
  background: #005a9e;
}`
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
  'vite.config.ts': {
    language: 'typescript',
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
});`
  },
  'tsconfig.json': {
    language: 'json',
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
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
  typescript: '#569cd6',
  json: '#dcdcaa',
  css: '#ce9178',
  markdown: '#9cdcfe',
  md: '#9cdcfe',
};

const FILE_ICONS: Record<string, React.ReactNode> = {
  tsx: (
    <svg viewBox="-11.5 -10.23174 23 20.46348" width="14" height="14">
      <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
      <g stroke="#61dafb" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  ),
  ts: (
    <svg viewBox="0 0 256 256" width="14" height="14">
      <rect width="256" height="256" fill="#3178C6" />
      <path d="M114.28 152.09l-34.93-1.07-1.1-28.79 73.1 1.05-.75 29.58-20.76 1.06-1.55 64.91-13.88.19 1.12-65.7zM189.9 220.35c-43.07 1.4-56.98-20.58-57.92-41.67l31.13-2c1.78 12.33 6.64 20.25 24.16 19.33 13.91-.73 20.08-8.22 19.8-15.53-.45-12.03-12.19-14.73-30.84-21.75-25.61-9.64-39.73-24.36-39.06-46.06.91-23.75 19.87-41.49 48.06-42.3 35.8-1.03 52.82 17.5 54.34 38.08l-30.33 4.25c-1.35-10.46-7.85-18.06-22.18-17.55-12.28.44-18.52 6.83-18.52 14.53.37 10.36 10.02 12.02 26.68 18.26 25.13 9.42 43.68 20.55 42.66 47.16-1.22 31.74-23.86 46.04-48.25 46.8" fill="#FFF" />
    </svg>
  ),
  typescript: (
    <svg viewBox="0 0 256 256" width="14" height="14">
      <rect width="256" height="256" fill="#3178C6" />
      <path d="M114.28 152.09l-34.93-1.07-1.1-28.79 73.1 1.05-.75 29.58-20.76 1.06-1.55 64.91-13.88.19 1.12-65.7zM189.9 220.35c-43.07 1.4-56.98-20.58-57.92-41.67l31.13-2c1.78 12.33 6.64 20.25 24.16 19.33 13.91-.73 20.08-8.22 19.8-15.53-.45-12.03-12.19-14.73-30.84-21.75-25.61-9.64-39.73-24.36-39.06-46.06.91-23.75 19.87-41.49 48.06-42.3 35.8-1.03 52.82 17.5 54.34 38.08l-30.33 4.25c-1.35-10.46-7.85-18.06-22.18-17.55-12.28.44-18.52 6.83-18.52 14.53.37 10.36 10.02 12.02 26.68 18.26 25.13 9.42 43.68 20.55 42.66 47.16-1.22 31.74-23.86 46.04-48.25 46.8" fill="#FFF" />
    </svg>
  ),
  json: (
    <span style={{ color: '#cbcb41', fontSize: 13, fontWeight: 'bold' }}>{"{}"}</span>
  ),
  css: (
    <span style={{ color: '#569cd6', fontSize: 14, fontWeight: 'bold' }}>#</span>
  ),
  md: (
    <span style={{ color: '#4facf0', fontSize: 14, fontWeight: 'bold' }}>↓</span>
  ),
  markdown: (
    <span style={{ color: '#4facf0', fontSize: 14, fontWeight: 'bold' }}>↓</span>
  ),
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

    if (lang === 'tsx' || lang === 'ts' || lang === 'typescript') {
      highlighted = highlighted.replace(/(\/\/.*)/g, (m) => stash(`<span style="color:#6a9955">${m}</span>`));
      highlighted = highlighted.replace(/(['"`])((?:[^\\]|\\.)*?)\1/g, (m) => stash(`<span style="color:#ce9178">${m}</span>`));
      highlighted = highlighted.replace(/(&lt;\/?)([\w.]+)/g, (m, p1, p2) => stash(`${p1}<span style="color:#4ec9b0">${p2}</span>`));
      highlighted = highlighted.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*:)/g, (m) => stash(`<span style="color:#9cdcfe">${m}</span>`));
      highlighted = highlighted.replace(/\b(import|export|from|const|let|var|function|return|default|interface|type|extends|implements|class|new|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|async|await|React|useState|useEffect|useRef|useCallback|void|null|undefined|true|false|useMemo|ReactDOM|createRoot|StrictMode|defineConfig|plugins|plugin|server|port|open)\b/g, (m) => stash(`<span style="color:#569cd6">${m}</span>`));
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
  const [activeFile, setActiveFile] = useState('src/App.tsx');
  const [openFiles, setOpenFiles] = useState<string[]>(['src/App.tsx', 'src/index.tsx', 'src/index.css', 'package.json']);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '  VITE v5.4.2  ready in 312 ms',
    '',
    '  ➜  Local:   http://localhost:5173/',
    '  ➜  Network: http://192.168.1.100:5173/',
    '  ➜  press h + enter to show help',
    '',
  ]);
  const [termInput, setTermInput] = useState('');
  const termRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState('explorer');

  const getPreviewHtml = () => {
    let code = '';
    if (files['src/App.tsx']) {
      code = files['src/App.tsx'].content;
    } else {
      return '<html><body style="background:#fff;color:#333;font-family:\'Segoe UI\',sans-serif;padding:40px"><h3>No App.tsx found</h3></body></html>';
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
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; color: #333; padding: 20px; margin: 0; }
          .app { max-width: 800px; margin: 0 auto; padding: 40px; text-align: center; }
          h1 { color: #0078d4; }
          button { padding: 10px 24px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-top: 20px; }
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
            document.getElementById('root').innerHTML = '<div style="color:#d13438; font-family: monospace; white-space: pre-wrap; padding: 20px;">Error: ' + e.message + '</div>';
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
    if (activeFile === name) setActiveFile(next[next.length - 1] || '');
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

      const isPnpm = cmd.startsWith('pnpm');
      const isNpm = cmd.startsWith('npm');
      const isYarn = cmd.startsWith('yarn');
      const pkgManager = isPnpm ? 'pnpm' : isNpm ? 'npm' : isYarn ? 'yarn' : 'npm';
      
      const getPkgCmd = (base: string) => {
        if (isPnpm) return base.replace('npm', 'pnpm').replace('npx', 'pnpm dlx');
        if (isYarn) return base.replace('npm', 'yarn').replace('npx', 'yarn dlx');
        return base;
      };

      if (cmd.includes('run dev') || cmd.includes('start')) {
        const pkgJson = files['package.json']?.content || '';
        if (pkgJson.includes('next dev')) {
            pushLines([getPkgCmd('> next dev')]);
            setTimeout(() => {
                pushLines(['ready - started server on 0.0.0.0:3000, url: http://localhost:3000', 'event - compiled client and server successfully']);
                setPreviewOpen(true);
            }, 1000);
        } else {
            pushLines([getPkgCmd('> vite'), '', '  VITE v5.4.2  ready in 312 ms']);
            if (files['src/App.tsx']?.content.includes('error') || (files['src/App.tsx'] && !files['src/App.tsx'].content.includes('return'))) {
                pushLines(['', '[vite] Internal server error: Failed to parse source for /src/App.tsx', '  1 |  import React from "react";', '  > 2 |  const App = () => { error }']);
            } else {
                setTimeout(() => setPreviewOpen(true), 500);
            }
        }
      } else if (cmd.includes('install') || cmd.startsWith('npm i') || cmd.startsWith('pnpm i') || cmd.startsWith('yarn')) {
        pushLines([getPkgCmd('> ' + pkgManager + ' install')]);
        setTimeout(() => {
          if (cmd.includes('next')) {
            pushLines([
              isPnpm ? 'Packages: +254' : 'added 254 packages, and audited 255 packages in 3s',
              '103 packages are looking for funding',
              isPnpm ? '' : '  run `npm fund` for details',
              '',
              'found 0 vulnerabilities'
            ].filter(Boolean));
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
              isPnpm ? 'Packages: +120' : 'added 120 packages, and audited 121 packages in 2s',
              '50 packages are looking for funding',
              isPnpm ? '' : '  run `npm fund` for details',
              '',
              'found 0 vulnerabilities'
            ].filter(Boolean));
          }
        }, 1500);
      } else if (cmd.startsWith('npx create-next-app') || cmd.startsWith('pnpm dlx create-next-app') || cmd.startsWith('yarn dlx create-next-app')) {
        pushLines(['Creating a new Next.js app...', 'Installing dependencies:']);
        setTimeout(() => pushLines(['- react', '- react-dom', '- next']), 800);
        setTimeout(() => {
          pushLines(['', 'Success! Created new Next.js app.']);
        }, 2000);
      } else if (cmd.includes('run build')) {
        const pkgJson = files['package.json']?.content || '';
        if (pkgJson.includes('next build')) {
            pushLines([getPkgCmd('> next build'), 'info  - Linting and checking validity of types...']);
            setTimeout(() => pushLines(['info  - Creating an optimized production build...', 'info  - Compiled successfully']), 1000);
            setTimeout(() => pushLines(['info  - Collecting page data...', 'info  - Generating static pages (3/3)', 'info  - Finalizing page optimization...']), 2000);
        } else {
            pushLines([getPkgCmd('> vite build'), 'vite v5.4.2 building for production...', '✓ 34 modules transformed.', 'dist/index.html  0.45 kB', 'dist/assets/index-BvM0w.css  1.20 kB', 'dist/assets/index-CqN.js  145.2 kB']);
        }
      } else if (cmd === 'ls' || cmd === 'dir') {
        pushLines(Object.keys(files).map(f => f.split('/').pop() || f));
      } else if (cmd === 'clear' || cmd === 'cls') {
        setTerminalLines([]);
      } else if (cmd.startsWith('cat ')) {
        const target = cmd.slice(4).trim() || activeFile;
        const fullTarget = Object.keys(files).find(f => f.toLowerCase().includes(target.toLowerCase()));
        if (fullTarget && files[fullTarget]) {
           pushLines(files[fullTarget].content.split('\n'));
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

  const ext = activeFile.split('.').pop() || '';

  const folderStructure = [
    { name: 'src', type: 'folder', open: true, children: [
      { name: 'App.tsx', type: 'file' },
      { name: 'index.tsx', type: 'file' },
      { name: 'index.css', type: 'file' }
    ] },
    { name: 'package.json', type: 'file' },
    { name: 'vite.config.ts', type: 'file' },
    { name: 'tsconfig.json', type: 'file' },
    { name: 'README.md', type: 'file' }
  ];

  const renderFileTree = (items: any[], level: number = 0) => {
    return items.map((item, index) => {
      const fullPath = item.type === 'folder' 
        ? item.name 
        : (level === 0 
            ? item.name 
            : (item.name === 'App.tsx' || item.name === 'index.tsx' || item.name === 'index.css') 
              ? `src/${item.name}` 
              : item.name);
        
      if (item.type === 'folder') {
        return (
          <div key={index} style={{ paddingLeft: `${level * 16}px` }}>
            <div 
              className="vsc-file"
              style={{ 
                display: 'flex', alignItems: 'center', gap: 6, 
                padding: '3px 8px 3px 12px', 
                fontSize: 13, cursor: 'pointer' 
              }}
            >
              <svg viewBox="0 0 16 16" width="14" height="14">
                <path d="M1.5 1A1.5 1.5 0 0 0 0 2.5v11A1.5 1.5 0 0 0 1.5 15h13a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H8L6.5 3H1.5z" fill="currentColor" />
              </svg>
              <span>{item.name}</span>
            </div>
            {item.open && item.children && renderFileTree(item.children, level + 1)}
          </div>
        );
      }
      
      const fileKey = fullPath;
      const fileExt = fileKey.split('.').pop() || '';
      
      return (
        <div 
          key={index}
          className={`vsc-file ${activeFile === fileKey ? 'vsc-file-active' : ''}`}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 6, 
            padding: `3px 8px 3px ${12 + level * 16}px`, 
            fontSize: 13, cursor: 'pointer' 
          }}
          onClick={() => openFile(fileKey)}
        >
          <span style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: LANG_COLORS[fileExt] || '#ccc' 
          }}>
            {FILE_ICONS[fileExt] || '📄'}
          </span>
          <span>{item.name}</span>
        </div>
      );
    });
  };

  return (
      <div className="vsc-wrapper">
      {/* Title Bar / Menu Bar */}
      <div style={{ 
        height: 30, 
        background: '#3c3c3c', 
        display: 'flex', 
        alignItems: 'center',
        paddingLeft: 10,
        fontSize: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 12 }}>
          <svg viewBox="0 0 100 100" width="18" height="18" style={{ marginRight: 8 }}>
            <path d="M74.9 10.4L50 35.3l-11-11L10 42.8v14.4l11-8.2 11 11 28-28.9V74l-11-8-11 11 28.9 13L90 79V21z" fill="#007acc" />
          </svg>
          <span>Visual Studio Code</span>
        </div>
        
        {['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'].map((item) => (
          <div 
            key={item}
            style={{ 
              padding: '4px 12px', 
              cursor: 'pointer',
              color: '#cccccc',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2d2e'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {item}
          </div>
        ))}
      </div>

      <div className="vsc-content">
        {/* Activity bar */}
        <div className="vsc-actbar">
          {[
            { id: 'explorer', icon: '🗂️', title: 'Explorer' },
            { id: 'search', icon: '🔍', title: 'Search' },
            { id: 'sourceControl', icon: '🔄', title: 'Source Control' },
            { id: 'debug', icon: '🐛', title: 'Run and Debug' },
            { id: 'extensions', icon: '🧩', title: 'Extensions' }
          ].map((panel) => (
            <button 
              key={panel.id}
              className={`vsc-act-btn ${activePanel === panel.id ? 'vsc-act-active' : ''}`} 
              title={panel.title} 
              onClick={() => setActivePanel(panel.id)}
            >
              <span style={{ fontSize: 20 }}>{panel.icon}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button 
            className="vsc-act-btn" 
            title="Toggle Terminal" 
            onClick={() => setTerminalOpen(t => !t)}
          >
            <span style={{ fontSize: 20 }}>⌨️</span>
          </button>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="vsc-sidebar">
            {activePanel === 'explorer' && (
              <>
                <div className="vsc-sidebar-title">Explorer</div>
                <div className="vsc-sidebar-section">
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '4px 8px 4px 12px',
                    fontSize: 11,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>WINDOWS</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span>📄</span>
                      <span>📁</span>
                    </div>
                  </div>
                  {renderFileTree(folderStructure)}
                </div>
              </>
            )}
            
            {activePanel === 'search' && (
              <div className="vsc-sidebar-section" style={{ padding: 10 }}>
                <div style={{ 
                  background: '#3c3c3c', 
                  border: '1px solid #3c3c3c', 
                  borderRadius: 3,
                  padding: '4px 8px',
                  marginBottom: 10
                }}>
                  <input 
                    placeholder="Search" 
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: '#cccccc',
                      outline: 'none',
                      width: '100%',
                      fontSize: 12
                    }}
                  />
                </div>
              </div>
            )}
            
            {activePanel === 'sourceControl' && (
              <div className="vsc-sidebar-section" style={{ padding: 10, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Source Control</span>
                  <span style={{ background: '#007acc', borderRadius: 10, padding: '0 6px', fontSize: 10 }}>0</span>
                </div>
                <div style={{ color: '#858585' }}>No changes detected</div>
              </div>
            )}
            
            {activePanel === 'debug' && (
              <div className="vsc-sidebar-section" style={{ padding: 10, fontSize: 12 }}>
                <div>Run and Debug</div>
                <div style={{ marginTop: 16, color: '#858585' }}>
                  To customize Run and Debug create a launch.json file.
                </div>
              </div>
            )}
            
            {activePanel === 'extensions' && (
              <div className="vsc-sidebar-section" style={{ padding: 10 }}>
                <div style={{ 
                  background: '#3c3c3c', 
                  border: '1px solid #3c3c3c', 
                  borderRadius: 3,
                  padding: '4px 8px',
                  marginBottom: 10
                }}>
                  <input 
                    placeholder="Search Extensions in Marketplace" 
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: '#cccccc',
                      outline: 'none',
                      width: '100%',
                      fontSize: 12
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, marginBottom: 8, fontWeight: 'bold' }}>INSTALLED</div>
                <div style={{ fontSize: 12, color: '#858585' }}>No extensions installed yet</div>
              </div>
            )}
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
                  {openFiles.map((fname) => {
                    const fileExt = fname.split('.').pop() || '';
                    const fileName = fname.split('/').pop() || fname;
                    return (
                      <div
                        key={fname}
                        className={`vsc-tab ${activeFile === fname ? 'vsc-tab-active' : ''}`}
                        onClick={() => setActiveFile(fname)}
                      >
                        <span style={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          color: LANG_COLORS[fileExt] || '#ccc', fontSize: 13, marginRight: 6 
                        }}>
                          {FILE_ICONS[fileExt] || '📄'}
                        </span>
                        <span>{fileName}</span>
                        <button className="vsc-tab-close" onClick={(e) => closeFile(fname, e)}>
                          <svg viewBox="0 0 16 16" width="14" height="14">
                            <path fill="currentColor" d="M14.36 4.36l-1.42-1.42L8 7.88 3.06 2.94 1.64 4.36 6.58 9.3l-4.94 4.94 1.42 1.42L8 10.72l4.94 4.94 1.42-1.42L9.42 9.3l4.94-4.94z" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                  <button 
                    title="Split Editor"
                    onClick={() => setPreviewOpen(!previewOpen)}
                    style={{ background: 'transparent', border: 'none', color: '#cccccc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 3 }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16">
                      <path fill="currentColor" d="M14.5 2h-13a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5zM8 13H2V3h6v10zm6 0H9V3h5v10z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Breadcrumbs */}
              {activeFile && file && (
                <div className="vsc-breadcrumbs">
                  <span style={{ color: '#007fd4', marginRight: 4 }}>windows</span>
                  <span style={{ marginRight: 4 }}>›</span>
                  {activeFile.split('/').map((part, index, arr) => (
                    <React.Fragment key={index}>
                      <span key={part} style={{ 
                        color: index === arr.length - 1 ? '#cccccc' : '#969696',
                        marginRight: 4,
                        cursor: 'pointer'
                      }}>
                        {part}
                      </span>
                      {index < arr.length - 1 && <span style={{ marginRight: 4 }}>›</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Editor */}
              {activeFile && file ? (
                <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                  <div className="vsc-editor-container" style={{ flex: 1 }}>
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
                  
                  {/* Minimap */}
                  <div style={{ 
                    width: 60, 
                    background: '#1e1e1e', 
                    borderLeft: '1px solid #2b2b2b',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ 
                      flex: 1, 
                      transform: 'scale(0.1)', 
                      transformOrigin: 'top right',
                      width: '1000%',
                      height: '1000%',
                      padding: 4,
                      fontSize: 3,
                      lineHeight: 1,
                      color: 'rgba(255,255,255,0.2)'
                    }}>
                      {file.content.split('\n').map((line, i) => (
                        <div key={i} style={{ margin: 0, padding: 0, whiteSpace: 'pre' }}>{line}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="vsc-welcome">
                  <div style={{ fontSize: 80, marginBottom: 24 }}>
                    <svg viewBox="0 0 100 100" width="120" height="120">
                      <path d="M74.9 10.4L50 35.3l-11-11L10 42.8v14.4l11-8.2 11 11 28-28.9V74l-11-8-11 11 28.9 13L90 79V21z" fill="#007acc" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 28, color: '#cccccc', marginBottom: 20 }}>Visual Studio Code</div>
                  <div style={{ fontSize: 14, color: '#858585', maxWidth: 400, textAlign: 'center' }}>
                    Start by opening a file or creating a new project.
                  </div>
                </div>
              )}
            </div>
            
            {/* Preview Column */}
            {previewOpen && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: '1px solid #2b2b2b', background: '#1e1e1e' }}>
                {/* Preview Header */}
                <div style={{ 
                  height: 35, 
                  background: '#252526', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0 10px', 
                  borderBottom: '1px solid #2b2b2b'
                }}>
                  <svg viewBox="0 0 16 16" width="14" height="14" style={{ color: '#cccccc', marginRight: 8 }}>
                    <path fill="currentColor" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13V2a6 6.5 0 1 1 0 12z" />
                  </svg>
                  <div style={{ fontSize: 12, color: '#cccccc', flex: 1 }}>Preview - http://localhost:5173</div>
                  <button onClick={() => setPreviewOpen(false)} style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#cccccc', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: 24, 
                    height: 24, 
                    borderRadius: 3 
                  }}>
                    <svg viewBox="0 0 16 16" width="14" height="14">
                      <path fill="currentColor" d="M14.36 4.36l-1.42-1.42L8 7.88 3.06 2.94 1.64 4.36 6.58 9.3l-4.94 4.94 1.42 1.42L8 10.72l4.94 4.94 1.42-1.42L9.42 9.3l4.94-4.94z" />
                    </svg>
                  </button>
                </div>
                {/* Preview Iframe */}
                <iframe 
                  srcDoc={getPreviewHtml()} 
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    background: '#fff'
                  }} 
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            )}
          </div>

          {/* Terminal */}
          {terminalOpen && (
            <div className="vsc-terminal">
              <div className="vsc-term-header">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingLeft: 10 }}>
                  <span style={{ 
                    color: '#e7e7e7', 
                    borderBottom: '1px solid #e7e7e7', 
                    paddingBottom: 7,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}>
                    Terminal
                  </span>
                  <span style={{ 
                    color: '#858585', 
                    paddingBottom: 7,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}>
                    Problems
                  </span>
                  <span style={{ 
                    color: '#858585', 
                    paddingBottom: 7,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}>
                    Output
                  </span>
                  <span style={{ 
                    color: '#858585', 
                    paddingBottom: 7,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}>
                    Debug Console
                  </span>
                </div>
                <div className="vsc-term-actions">
                  <button className="vsc-term-action" title="New Terminal">
                    <span style={{ fontSize: 14 }}>➕</span>
                  </button>
                  <button className="vsc-term-action" title="Split Terminal">
                    <span style={{ fontSize: 14 }}>📐</span>
                  </button>
                  <button className="vsc-term-action" title="Clear Terminal" onClick={() => setTerminalLines([])}>
                    <span style={{ fontSize: 14 }}>🗑️</span>
                  </button>
                  <button className="vsc-term-action" title="Close Panel" onClick={() => setTerminalOpen(false)}>
                    <svg viewBox="0 0 16 16" width="14" height="14">
                      <path fill="currentColor" d="M14.36 4.36l-1.42-1.42L8 7.88 3.06 2.94 1.64 4.36 6.58 9.3l-4.94 4.94 1.42 1.42L8 10.72l4.94 4.94 1.42-1.42L9.42 9.3l4.94-4.94z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="vsc-term-body" ref={termRef}>
                {terminalLines.map((l, i) => (
                  <div key={i} className="vsc-term-line" style={{ 
                    color: l.startsWith('❯') ? '#4ec9b0' : 
                           l.includes('error') || l.includes('not found') ? '#f44747' : 
                           l.startsWith('  VITE') ? '#0078d4' : '#cccccc',
                    fontWeight: l.startsWith('  VITE') ? 'bold' : 'normal'
                  }}>
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
                    onChange={(e) => setTermInput(e.target.value)}
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
            <span style={{ marginRight: 4 }}>🔀</span>
            main
          </span>
          <span className="vsc-status-item">
            <span style={{ marginRight: 4 }}>✓</span>
            0
          </span>
          <span className="vsc-status-item">
            <span style={{ marginRight: 4 }}>⚠</span>
            0
          </span>
        </div>
        <div className="vsc-status-right">
          <span className="vsc-status-item">Ln 1, Col 1</span>
          <span className="vsc-status-item">Spaces: 2</span>
          <span className="vsc-status-item">UTF-8</span>
          <span className="vsc-status-item">{ext.toUpperCase() || 'Plain Text'}</span>
          <span className="vsc-status-item">Prettier</span>
          <span className="vsc-status-item">
            <span style={{ marginRight: 4 }}>🔔</span>
          </span>
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

        .vsc-actbar {
          width: 48px;
          background: #333333;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 0;
          gap: 4px;
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
          transition: all 0.1s;
        }
        .vsc-act-btn:hover { color: #ffffff; background: #2a2d2e; }
        .vsc-act-active { 
          color: #ffffff !important; 
          background: #2a2d2e;
        }
        .vsc-act-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #ffffff;
        }

        .vsc-sidebar {
          width: 250px;
          background: #252526;
          border-right: 1px solid #2b2b2b;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .vsc-sidebar-title {
          font-size: 11px;
          color: #cccccc;
          padding: 10px 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
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
        .vsc-file-active { 
          background: #094771; 
          color: #ffffff;
        }

        .vsc-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #1e1e1e;
          overflow: hidden;
        }

        .vsc-tabs {
          display: flex;
          background: #252526;
          overflow-x: auto;
          scrollbar-width: none;
          min-height: 35px;
          border-bottom: 1px solid #2b2b2b;
        }
        .vsc-tabs::-webkit-scrollbar { display: none; }
        .vsc-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px 0 14px;
          font-size: 13px;
          color: #969696;
          background: #2d2d2d;
          border-right: 1px solid #252526;
          border-top: 1px solid transparent;
          cursor: pointer;
          min-width: 120px;
          height: 35px;
        }
        .vsc-tab:hover { background: #2a2d2e; }
        .vsc-tab-active {
          background: #1e1e1e !important;
          color: #ffffff;
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

        .vsc-breadcrumbs {
          display: flex;
          align-items: center;
          padding: 0 16px;
          height: 22px;
          background: #1e1e1e;
          color: #969696;
          font-size: 12px;
          border-bottom: 1px solid #2b2b2b;
        }

        .vsc-editor-container {
          flex: 1;
          position: relative;
          background: #1e1e1e;
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
          padding-left: 64px;
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
          width: 64px;
          min-width: 64px;
          text-align: right;
          padding-right: 16px;
          color: #858585;
          user-select: none;
          font-size: 13px;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .vsc-welcome {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #1e1e1e;
        }

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
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          height: 35px;
          background: #252526;
          border-bottom: 1px solid #2b2b2b;
        }
        .vsc-term-actions {
          display: flex;
          gap: 4px;
          align-items: center;
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
          width: 26px;
          height: 26px;
        }
        .vsc-term-action:hover { opacity: 1; background: rgba(255,255,255,0.1); border-radius: 3px; }
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
          padding: 0 12px;
          height: 22px;
          cursor: pointer;
          font-size: 12px;
        }
        .vsc-status-item:hover {
          background: rgba(255,255,255,0.12);
        }
      `}</style>
    </div>
  );
};

export default VsCode;
