import React, { useState, useRef, useEffect, useMemo } from 'react';

/* =====================================================================
   NEX CODE — clon de alta fidelidad de un editor tipo VS Code,
   con IA (Groq) integrada y temas importables desde vscodethemes.com
   ===================================================================== */

/* ---------- TEMAS (paletas reales recreadas) ---------- */
const BUILTIN_THEMES = {
  'NEX Dark+ (default)': {
    bg:'#1e1e1e', bgAlt:'#181818', sidebar:'#252526', activitybar:'#333333', titlebar:'#3c3c3c',
    border:'#2b2b2b', text:'#cccccc', textDim:'#858585', accent:'#0e639c', accentHover:'#1177bb',
    accentText:'#ffffff', selection:'rgba(38,79,120,0.6)', lineHL:'rgba(255,255,255,0.04)',
    statusbar:'#007acc', tabActiveBorder:'#007acc', scrollbar:'rgba(121,121,121,0.4)',
    kw:'#569cd6', str:'#ce9178', com:'#6a9955', fn:'#dcdcaa', num:'#b5cea8',
    type:'#4ec9b0', prop:'#9cdcfe', tag:'#569cd6', bracket:'#ffd700',
  },
  'Dracula Official': {
    bg:'#282a36', bgAlt:'#21222c', sidebar:'#21222c', activitybar:'#1e1f29', titlebar:'#21222c',
    border:'#191a21', text:'#f8f8f2', textDim:'#6272a4', accent:'#bd93f9', accentHover:'#caa9fa',
    accentText:'#282a36', selection:'rgba(99,102,170,0.4)', lineHL:'rgba(255,255,255,0.04)',
    statusbar:'#191a21', tabActiveBorder:'#bd93f9', scrollbar:'rgba(98,114,164,0.4)',
    kw:'#ff79c6', str:'#f1fa8c', com:'#6272a4', fn:'#50fa7b', num:'#bd93f9',
    type:'#8be9fd', prop:'#66d9ef', tag:'#ff79c6', bracket:'#f1fa8c',
  },
  'One Dark Pro': {
    bg:'#282c34', bgAlt:'#21252b', sidebar:'#21252b', activitybar:'#181a1f', titlebar:'#282c34',
    border:'#181a1f', text:'#abb2bf', textDim:'#5c6370', accent:'#528bff', accentHover:'#6e9fff',
    accentText:'#ffffff', selection:'rgba(82,139,255,0.2)', lineHL:'rgba(255,255,255,0.03)',
    statusbar:'#23272e', tabActiveBorder:'#528bff', scrollbar:'rgba(92,99,112,0.4)',
    kw:'#c678dd', str:'#98c379', com:'#5c6370', fn:'#61afef', num:'#d19a66',
    type:'#e5c07b', prop:'#e06c75', tag:'#e06c75', bracket:'#abb2bf',
  },
  'Monokai Pro': {
    bg:'#272822', bgAlt:'#1e1f1c', sidebar:'#1e1f1c', activitybar:'#171814', titlebar:'#272822',
    border:'#171814', text:'#f8f8f2', textDim:'#75715e', accent:'#fd971f', accentHover:'#ffae47',
    accentText:'#272822', selection:'rgba(253,151,31,0.2)', lineHL:'rgba(255,255,255,0.03)',
    statusbar:'#171814', tabActiveBorder:'#fd971f', scrollbar:'rgba(117,113,94,0.4)',
    kw:'#f92672', str:'#e6db74', com:'#75715e', fn:'#a6e22e', num:'#ae81ff',
    type:'#66d9ef', prop:'#a6e22e', tag:'#f92672', bracket:'#f8f8f2',
  },
  'Nord': {
    bg:'#2e3440', bgAlt:'#272c36', sidebar:'#272c36', activitybar:'#1f242d', titlebar:'#2e3440',
    border:'#1f242d', text:'#d8dee9', textDim:'#616e88', accent:'#88c0d0', accentHover:'#9bcedc',
    accentText:'#2e3440', selection:'rgba(136,192,208,0.18)', lineHL:'rgba(255,255,255,0.03)',
    statusbar:'#3b4252', tabActiveBorder:'#88c0d0', scrollbar:'rgba(97,110,136,0.4)',
    kw:'#81a1c1', str:'#a3be8c', com:'#616e88', fn:'#88c0d0', num:'#b48ead',
    type:'#8fbcbb', prop:'#d8dee9', tag:'#81a1c1', bracket:'#ebcb8b',
  },
  'Tokyo Night': {
    bg:'#1a1b26', bgAlt:'#16161e', sidebar:'#16161e', activitybar:'#101014', titlebar:'#1a1b26',
    border:'#101014', text:'#a9b1d6', textDim:'#565f89', accent:'#7aa2f7', accentHover:'#90b5ff',
    accentText:'#1a1b26', selection:'rgba(122,162,247,0.18)', lineHL:'rgba(255,255,255,0.03)',
    statusbar:'#16161e', tabActiveBorder:'#7aa2f7', scrollbar:'rgba(86,95,137,0.4)',
    kw:'#bb9af7', str:'#9ece6a', com:'#565f89', fn:'#7aa2f7', num:'#ff9e64',
    type:'#2ac3de', prop:'#c0caf5', tag:'#f7768e', bracket:'#e0af68',
  },
  'GitHub Dark Default': {
    bg:'#0d1117', bgAlt:'#010409', sidebar:'#010409', activitybar:'#010409', titlebar:'#161b22',
    border:'#21262d', text:'#c9d1d9', textDim:'#6e7681', accent:'#1f6feb', accentHover:'#388bfd',
    accentText:'#ffffff', selection:'rgba(56,139,253,0.2)', lineHL:'rgba(255,255,255,0.03)',
    statusbar:'#0d1117', tabActiveBorder:'#1f6feb', scrollbar:'rgba(110,118,129,0.4)',
    kw:'#ff7b72', str:'#a5d6ff', com:'#8b949e', fn:'#d2a8ff', num:'#79c0ff',
    type:'#ffa657', prop:'#79c0ff', tag:'#7ee787', bracket:'#c9d1d9',
  },
  'Solarized Light': {
    bg:'#fdf6e3', bgAlt:'#eee8d5', sidebar:'#eee8d5', activitybar:'#e4dcc4', titlebar:'#eee8d5',
    border:'#d8d0b8', text:'#586e75', textDim:'#93a1a1', accent:'#268bd2', accentHover:'#3a9bdb',
    accentText:'#ffffff', selection:'rgba(38,139,210,0.15)', lineHL:'rgba(0,0,0,0.03)',
    statusbar:'#268bd2', tabActiveBorder:'#268bd2', scrollbar:'rgba(101,123,131,0.3)',
    kw:'#859900', str:'#2aa198', com:'#93a1a1', fn:'#b58900', num:'#cb4b16',
    type:'#268bd2', prop:'#cb4b16', tag:'#268bd2', bracket:'#586e75',
  },
};

function hexToRgba(hex, a) {
  if (!hex || hex[0] !== '#') return `rgba(0,122,204,${a})`;
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0,2),16), g = parseInt(h.substring(2,4),16), b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

function parseVscodeThemeJson(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const c = data.colors || {};
    const tcs = data.tokenColors || [];
    const find = (...scopes) => {
      for (const t of tcs) {
        const sc = Array.isArray(t.scope) ? t.scope : [t.scope];
        if (sc.some(s => s && scopes.some(target => s.includes(target))) && t.settings?.foreground) return t.settings.foreground;
      }
      return null;
    };
    const bg = c['editor.background'] || '#1e1e1e';
    const accent = c['focusBorder'] || c['activityBarBadge.background'] || '#007acc';
    return {
      bg, bgAlt: c['sideBar.background'] || bg, sidebar: c['sideBar.background'] || bg,
      activitybar: c['activityBar.background'] || bg, titlebar: c['titleBar.activeBackground'] || bg,
      border: c['sideBar.border'] || c['panel.border'] || '#2b2b2b',
      text: c['editor.foreground'] || '#cccccc', textDim: c['editorLineNumber.foreground'] || '#858585',
      accent, accentHover: accent, accentText: '#ffffff',
      selection: hexToRgba((c['editor.selectionBackground'] || accent).slice(0,7), 0.3),
      lineHL: 'rgba(255,255,255,0.04)', statusbar: c['statusBar.background'] || accent,
      tabActiveBorder: accent, scrollbar: 'rgba(121,121,121,0.4)',
      kw: find('keyword','storage') || '#569cd6', str: find('string') || '#ce9178',
      com: find('comment') || '#6a9955', fn: find('entity.name.function','support.function') || '#dcdcaa',
      num: find('constant.numeric') || '#b5cea8', type: find('entity.name.type','support.class') || '#4ec9b0',
      prop: find('variable.parameter','variable') || '#9cdcfe', tag: find('entity.name.tag') || '#569cd6',
      bracket: c['editorBracketHighlight.foreground1'] || '#ffd700',
    };
  } catch { return null; }
}

/* ---------- ARCHIVOS INICIALES ---------- */
const INITIAL_FILES = {
  'src/App.tsx': { language:'tsx', content: `import React, { useState } from 'react';
import './index.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Hello, NEX CODE</h1>
      <p>Editor profesional con autocompletado e IA integrada (Groq).</p>
      <button onClick={() => setCount((c) => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

export default App;
` },
  'src/index.tsx': { language:'tsx', content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
` },
  'src/index.css': { language:'css', content: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', sans-serif;
  background: #ffffff;
  color: #1e1e1e;
}

.app {
  max-width: 760px;
  margin: 0 auto;
  padding: 64px 24px;
  text-align: center;
}

h1 {
  color: #0078d4;
  font-size: 28px;
}

button {
  padding: 10px 24px;
  background: #0078d4;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 24px;
  font-size: 14px;
}

button:hover {
  background: #005a9e;
}
` },
  'package.json': { language:'json', content: `{
  "name": "nex-code-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
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
}
` },
  'tsconfig.json': { language:'json', content: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
` },
  'README.md': { language:'markdown', content: `# NEX CODE

Editor de código con IA integrada (Groq) y soporte de temas de vscodethemes.com.

## Atajos
- **Ctrl+Shift+P** — Paleta de comandos
- **Ctrl+K Ctrl+T** — Cambiar de tema
- **Tab** — Aceptar sugerencia de NEX AI
- **Esc** — Descartar sugerencia
` },
};

const LANG_META = {
  tsx:{c:'#3178c6', label:'TSX'}, ts:{c:'#3178c6', label:'TS'}, typescript:{c:'#3178c6', label:'TypeScript'},
  json:{c:'#cbcb41', label:'JSON'}, css:{c:'#264de4', label:'CSS'}, markdown:{c:'#519aba', label:'Markdown'}, md:{c:'#519aba', label:'Markdown'},
};

function FileIcon({ ext, size = 14 }) {
  const m = LANG_META[ext];
  if (ext === 'tsx' || ext === 'jsx') return (
    <svg viewBox="-11.5 -10.23 23 20.46" width={size} height={size}><circle r="2.05" fill="#61dafb"/><g stroke="#61dafb" strokeWidth="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>
  );
  if (ext === 'ts' || ext === 'typescript') return (
    <svg viewBox="0 0 256 256" width={size} height={size}><rect width="256" height="256" rx="28" fill="#3178C6"/><path d="M114.28 152.09l-34.93-1.07-1.1-28.79 73.1 1.05-.75 29.58-20.76 1.06-1.55 64.91-13.88.19 1.12-65.7zM189.9 220.35c-43.07 1.4-56.98-20.58-57.92-41.67l31.13-2c1.78 12.33 6.64 20.25 24.16 19.33 13.91-.73 20.08-8.22 19.8-15.53-.45-12.03-12.19-14.73-30.84-21.75-25.61-9.64-39.73-24.36-39.06-46.06.91-23.75 19.87-41.49 48.06-42.3 35.8-1.03 52.82 17.5 54.34 38.08l-30.33 4.25c-1.35-10.46-7.85-18.06-22.18-17.55-12.28.44-18.52 6.83-18.52 14.53.37 10.36 10.02 12.02 26.68 18.26 25.13 9.42 43.68 20.55 42.66 47.16-1.22 31.74-23.86 46.04-48.25 46.8" fill="#fff"/></svg>
  );
  if (ext === 'json') return <span style={{ color:'#cbcb41', fontSize:size-3, fontWeight:700, fontFamily:'monospace' }}>{'{ }'}</span>;
  if (ext === 'css') return <span style={{ color:'#519aba', fontSize:size-2, fontWeight:700 }}>#</span>;
  if (ext === 'md' || ext === 'markdown') return <span style={{ color:'#519aba', fontSize:size-2, fontWeight:700 }}>M↓</span>;
  return <span style={{ color: m?.c || '#cccccc' }}>●</span>;
}

function tokenize(code, lang, p) {
  const lines = code.split('\n');
  return lines.map((line, i) => {
    let h = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    let n = 0; const stash = {};
    const put = (html) => { const k = `\u0001${n++}\u0001`; stash[k] = html; return k; };
    if (lang === 'tsx' || lang === 'ts' || lang === 'typescript') {
      h = h.replace(/(\/\/.*)/g, m => put(`<span style="color:${p.com}">${m}</span>`));
      h = h.replace(/(['"`])((?:[^\\]|\\.)*?)\1/g, m => put(`<span style="color:${p.str}">${m}</span>`));
      h = h.replace(/(&lt;\/?)([\w.]+)/g, (m,a,b) => put(`${a}<span style="color:${p.type}">${b}</span>`));
      h = h.replace(/\b([a-zA-Z_$][\w$]*)(?=\s*:)/g, m => put(`<span style="color:${p.prop}">${m}</span>`));
      h = h.replace(/\b(import|export|from|const|let|var|function|return|default|interface|type|extends|class|new|if|else|for|while|async|await|React|useState|useEffect|useRef|useCallback|void|null|undefined|true|false)\b/g, m => put(`<span style="color:${p.kw}">${m}</span>`));
      h = h.replace(/([{}()[\]])/g, m => put(`<span style="color:${p.bracket}">${m}</span>`));
    } else if (lang === 'json') {
      h = h.replace(/("[\w$]+")\s*:/g, (m,a) => `${put(`<span style="color:${p.prop}">${a}</span>`)}:`);
      h = h.replace(/:\s*(".*?")/g, (m,a) => `: ${put(`<span style="color:${p.str}">${a}</span>`)}`);
      h = h.replace(/:\s*(\d+\.?\d*)/g, (m,a) => `: ${put(`<span style="color:${p.num}">${a}</span>`)}`);
    } else if (lang === 'css') {
      h = h.replace(/([\w-]+)\s*:/g, (m,a) => `${put(`<span style="color:${p.prop}">${a}</span>`)}:`);
      h = h.replace(/:\s*(.*?)(;|$)/g, (m,a,b) => `: ${put(`<span style="color:${p.str}">${a}</span>`)}${b}`);
    } else if (lang === 'markdown' || lang === 'md') {
      h = h.replace(/^(#+\s.*)$/g, m => put(`<span style="color:${p.kw};font-weight:700">${m}</span>`));
      h = h.replace(/(\*\*.*?\*\*)/g, m => put(`<span style="color:${p.fn}">${m}</span>`));
    }
    for (let j = n - 1; j >= 0; j--) h = h.replace(`\u0001${j}\u0001`, stash[`\u0001${j}\u0001`]);
    return { i, html: h || '&nbsp;' };
  });
}

/* ---------- Cliente del backend NEX AI (Vercel Serverless Functions en /api) ----------
   Antes esta función llamaba directo a https://api.groq.com desde el navegador,
   lo que exponía la API key en el cliente. Ahora habla con funciones serverless
   propias (api/chat.js, api/health.js), que son las únicas que conocen la key
   (vía variable de entorno en Vercel). Al desplegar frontend y /api juntos en el
   mismo proyecto de Vercel, las rutas son relativas al mismo dominio, por eso
   el default es '' (string vacío). Para apuntar a otra URL (otro deploy, otro
   dominio) se puede sobreescribir con VITE_API_BASE. */
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || '';

async function callNexAI(messages, { model = 'llama-3.3-70b-versatile', maxTokens = 700 } = {}) {
  const res = await fetch(`${API_BASE}/api/groq/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, maxTokens }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status} del backend`);
  return data.content ?? '';
}

const LINE_H = 19; // altura real de línea de VS Code a 14px

export default function NexCode() {
  const [files, setFiles] = useState(INITIAL_FILES);
  const [dirty, setDirty] = useState({});
  const [activeFile, setActiveFile] = useState('src/App.tsx');
  const [openFiles, setOpenFiles] = useState(['src/App.tsx','src/index.tsx','src/index.css','package.json']);
  const [activityView, setActivityView] = useState('explorer');
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalTab, setTerminalTab] = useState('terminal');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [maximized] = useState(true);
  const [explorerOpenFolders, setExplorerOpenFolders] = useState({ src: true });

  const [terminalLines, setTerminalLines] = useState([
    'Microsoft Windows [Version 10.0.22631.4317]',
    '(c) Microsoft Corporation. Todos los derechos reservados.', '',
  ]);
  const [termInput, setTermInput] = useState('');
  const termRef = useRef(null);
  const editorRef = useRef(null);
  const highlightRef = useRef(null);
  const minimapRef = useRef(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Temas
  const [themeName, setThemeName] = useState('NEX Dark+ (default)');
  const [customThemes, setCustomThemes] = useState({});
  const allThemes = { ...BUILTIN_THEMES, ...customThemes };
  const p = allThemes[themeName] || BUILTIN_THEMES['NEX Dark+ (default)'];

  // Command palette / theme picker
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMode, setPaletteMode] = useState('commands'); // commands | themes | files
  const [paletteQuery, setPaletteQuery] = useState('');
  const [themeJsonInput, setThemeJsonInput] = useState('');
  const [themeImportError, setThemeImportError] = useState('');
  const [settingsTabOpen, setSettingsTabOpen] = useState(false);

  // Backend NEX AI (Vercel Serverless Functions en /api) — ya no se pide ni se guarda la API key en el cliente.
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [backendStatus, setBackendStatus] = useState({ checked:false, online:false, groqConfigured:false });
  const [chatMessages, setChatMessages] = useState([
    { role:'assistant', content:'Hola, soy NEX AI. Estoy conectado a las funciones serverless de Vercel en /api. Si no respondo, fijate que GROQ_API_KEY esté configurada en Vercel → Settings → Environment Variables.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBoxRef = useRef(null);

  // Autocompletado
  const [ghostText, setGhostText] = useState('');
  const [ghostLoading, setGhostLoading] = useState(false);
  const ghostTimer = useRef(null);
  const ghostAbort = useRef(0);

  const file = files[activeFile];

  /* ---- chequeo de salud del backend al montar ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/groq/health`);
        const data = await res.json();
        if (!cancelled) setBackendStatus({ checked:true, online:true, groqConfigured: Boolean(data.groqConfigured) });
      } catch {
        if (!cancelled) setBackendStatus({ checked:true, online:false, groqConfigured:false });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ---- atajos de teclado globales ---- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault(); setPaletteMode('commands'); setPaletteQuery(''); setPaletteOpen(true);
      } else if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false);
      } else if (e.ctrlKey && e.key.toLowerCase() === '`') {
        e.preventDefault(); setTerminalOpen(t => !t);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen]);

  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [terminalLines]);
  useEffect(() => { if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight; }, [chatMessages, chatLoading]);

  const openFile = (name) => {
    if (!openFiles.includes(name)) setOpenFiles(o => [...o, name]);
    setActiveFile(name); setGhostText('');
  };
  const closeFile = (name, e) => {
    e?.stopPropagation();
    const next = openFiles.filter(f => f !== name);
    setOpenFiles(next);
    if (activeFile === name) setActiveFile(next[next.length - 1] || '');
  };

  const handleCodeChange = (e) => {
    const v = e.target.value;
    setFiles(prev => ({ ...prev, [activeFile]: { ...prev[activeFile], content: v } }));
    setDirty(d => ({ ...d, [activeFile]: true }));
    setGhostText('');
    if (!backendStatus.online || !backendStatus.groqConfigured) return;
    clearTimeout(ghostTimer.current);
    const myId = ++ghostAbort.current;
    ghostTimer.current = setTimeout(async () => {
      const cursor = e.target.selectionStart;
      const before = v.slice(Math.max(0, cursor - 1200), cursor);
      const after = v.slice(cursor, cursor + 200);
      if (!before.trim()) return;
      setGhostLoading(true);
      try {
        const completion = await callNexAI([
          { role:'system', content:'Sos un motor de autocompletado tipo Copilot. Te dan el código antes y después del cursor. Respondé SOLO con la continuación natural desde el cursor (sin repetir nada anterior, sin explicaciones, sin markdown, máx 3 líneas).' },
          { role:'user', content:`LENGUAJE: ${file?.language}\n--- ANTES ---\n${before}\n--- DESPUÉS ---\n${after}\n--- Continuá: ---` },
        ], { model: groqModel, maxTokens: 80 });
        if (myId === ghostAbort.current) setGhostText(completion.replace(/```[\w]*\n?|```/g, ''));
      } catch { /* silencioso */ } finally { if (myId === ghostAbort.current) setGhostLoading(false); }
    }, 600);
  };

  const updateCursor = (ta) => {
    const v = ta.value.slice(0, ta.selectionStart);
    const lines = v.split('\n');
    setCursorPos({ line: lines.length, col: lines[lines.length-1].length + 1 });
  };

  const onEditorKeyDown = (e) => {
    if (e.key === 'Tab' && ghostText) {
      e.preventDefault();
      const ta = editorRef.current; const cursor = ta.selectionStart; const v = file.content;
      const newVal = v.slice(0, cursor) + ghostText + v.slice(cursor);
      setFiles(prev => ({ ...prev, [activeFile]: { ...prev[activeFile], content: newVal } }));
      setDirty(d => ({ ...d, [activeFile]: true }));
      setGhostText('');
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = cursor + ghostText.length; updateCursor(ta); });
      return;
    }
    if (e.key === 'Escape' && ghostText) { setGhostText(''); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target; const s = ta.selectionStart, en = ta.selectionEnd; const v = file.content;
      const newVal = v.slice(0, s) + '  ' + v.slice(en);
      setFiles(prev => ({ ...prev, [activeFile]: { ...prev[activeFile], content: newVal } }));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
      return;
    }
    requestAnimationFrame(() => updateCursor(e.target));
  };

  const handleScroll = (e) => {
    if (highlightRef.current) { highlightRef.current.scrollTop = e.currentTarget.scrollTop; highlightRef.current.scrollLeft = e.currentTarget.scrollLeft; }
  };

  const saveFile = () => { setDirty(d => ({ ...d, [activeFile]: false })); pushTerm([`Guardado: ${activeFile}`]); };
  useEffect(() => {
    const onSave = (e) => { if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); saveFile(); } };
    window.addEventListener('keydown', onSave);
    return () => window.removeEventListener('keydown', onSave);
  }, [activeFile]);

  const getPreviewHtml = () => {
    const appFile = files['src/App.tsx'];
    if (!appFile) return '<html><body style="background:#fff;color:#333;font-family:sans-serif;padding:40px"><h3>No App.tsx</h3></body></html>';
    const code = appFile.content.replace(/import .*? from ['"].*?['"];?/g, '').replace(/export default function/g, 'function').replace(/export default \w+;?/g, '');
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>body{font-family:'Segoe UI',sans-serif;background:#fff;color:#1e1e1e;padding:0;margin:0}.app{max-width:760px;margin:0 auto;padding:64px 24px;text-align:center}h1{color:#0078d4;font-size:28px}button{padding:10px 24px;background:#0078d4;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-top:24px;font-size:14px}button:hover{background:#005a9e}</style>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script></head>
    <body><div id="root"></div><script type="text/babel">
      const { useState, useEffect, useRef, useMemo, useCallback } = React;
      try {
        ${code}
        const match = \`${code.replace(/`/g,'\\`')}\`.match(/function\\s+([A-Z]\\w*)/);
        const C = match ? match[1] : 'App';
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(eval(C)));
      } catch(e) {
        document.getElementById('root').innerHTML = '<div style="color:#d13438;font-family:monospace;white-space:pre-wrap;padding:20px">Error: ' + e.message + '</div>';
      }
    </script></body></html>`;
  };

  const pushTerm = (lines) => setTerminalLines(prev => [...prev, ...lines]);
  const handleTermInput = (e) => {
    if (e.key !== 'Enter') return;
    const cmd = termInput.trim();
    pushTerm([`PS C:\\nex-code-app> ${cmd}`]);
    setTermInput('');
    if (!cmd) return;
    if (cmd.includes('run dev') || cmd === 'npm start') {
      pushTerm(['', '> vite', '', '  VITE v5.4.2  ready in 287 ms', '', '  ➜  Local:   http://localhost:5173/']);
      setTimeout(() => setPreviewOpen(true), 500);
    } else if (cmd.includes('install')) {
      pushTerm(['']);
      setTimeout(() => pushTerm(['added 142 packages in 2.1s', '', 'found 0 vulnerabilities']), 900);
    } else if (cmd === 'cls' || cmd === 'clear') {
      setTerminalLines([]);
    } else if (cmd === 'dir' || cmd === 'ls') {
      pushTerm(Object.keys(files).map(f => `    ${f}`));
    } else if (cmd.startsWith('cat ') || cmd.startsWith('type ')) {
      const target = cmd.split(' ').slice(1).join(' ').trim();
      const full = Object.keys(files).find(f => f.toLowerCase().includes(target.toLowerCase()));
      pushTerm(full ? files[full].content.split('\n') : [`No se encuentra: ${target}`]);
    } else {
      pushTerm([`'${cmd.split(' ')[0]}' no se reconoce como un comando interno o externo.`]);
    }
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;
    if (!backendStatus.online) {
      setChatMessages(p2 => [...p2, { role:'user', content:text }, { role:'assistant', content:'⚠️ No puedo conectarme a las funciones serverless (/api). Si estás en local corré "vercel dev"; si está desplegado, revisá los logs de la función en el dashboard de Vercel.' }]);
      setChatInput(''); return;
    }
    if (!backendStatus.groqConfigured) {
      setChatMessages(p2 => [...p2, { role:'user', content:text }, { role:'assistant', content:'⚠️ Las funciones están arriba pero falta GROQ_API_KEY en las variables de entorno de Vercel.' }]);
      setChatInput(''); return;
    }
    const newMsgs = [...chatMessages, { role:'user', content:text }];
    setChatMessages(newMsgs); setChatInput(''); setChatLoading(true);
    try {
      const sysMsg = { role:'system', content:`Sos NEX AI, asistente integrado de NEX CODE. Archivo activo: "${activeFile}" (${file?.language}).\n\n${file?.content?.slice(0,4000)}\n\nRespondé en español, conciso, con bloques de código si corresponde.` };
      const reply = await callNexAI([sysMsg, ...newMsgs.slice(-10)], { model: groqModel, maxTokens: 800 });
      setChatMessages(p2 => [...p2, { role:'assistant', content:reply }]);
    } catch (err) {
      setChatMessages(p2 => [...p2, { role:'assistant', content:`❌ Error: ${err.message}` }]);
    } finally { setChatLoading(false); }
  };

  const explainSelection = async () => {
    const ta = editorRef.current;
    const sel = file.content.slice(ta.selectionStart, ta.selectionEnd) || file.content;
    setAiPanelOpen(true);
    setChatMessages(p2 => [...p2, { role:'user', content:`Explicá/Refactorizá:\n\n\`\`\`${file.language}\n${sel}\n\`\`\`` }]);
    if (!backendStatus.online || !backendStatus.groqConfigured) {
      setChatMessages(p2 => [...p2, { role:'assistant', content:'⚠️ Las funciones de /api no están disponibles o le falta GROQ_API_KEY en Vercel.' }]);
      return;
    }
    setChatLoading(true);
    try {
      const reply = await callNexAI([
        { role:'system', content:'Sos NEX AI. Explicá brevemente el código y sugerí mejoras si aplica. Español.' },
        { role:'user', content: sel },
      ], { model: groqModel, maxTokens: 700 });
      setChatMessages(p2 => [...p2, { role:'assistant', content:reply }]);
    } catch (err) { setChatMessages(p2 => [...p2, { role:'assistant', content:`❌ Error: ${err.message}` }]); }
    finally { setChatLoading(false); }
  };

  const importTheme = () => {
    setThemeImportError('');
    const parsed = parseVscodeThemeJson(themeJsonInput);
    if (!parsed) { setThemeImportError('JSON inválido. Pegá el tema completo (botón "Get theme" en vscodethemes.com).'); return; }
    let name = `Importado ${Object.keys(customThemes).length + 1}`;
    try { name = JSON.parse(themeJsonInput).name || name; } catch {}
    setCustomThemes(t => ({ ...t, [name]: parsed }));
    setThemeName(name); setThemeJsonInput(''); setPaletteOpen(false);
  };

  /* ---- comandos de la paleta ---- */
  const commands = useMemo(() => ([
    { id:'theme', label:'Preferencias: Cambiar tema de color', action: () => { setPaletteMode('themes'); setPaletteQuery(''); } },
    { id:'theme-import', label:'NEX CODE: Importar tema desde vscodethemes.com', action: () => { setPaletteMode('themeImport'); } },
    { id:'groq-status', label:'NEX AI: Ver estado de las funciones (/api en Vercel)', action: () => { setPaletteMode('groqStatus'); } },
    { id:'groq-model', label:'NEX AI: Elegir modelo de Groq', action: () => { setPaletteMode('groqModel'); } },
    { id:'toggle-terminal', label:'Ver: Alternar terminal integrada', action: () => setTerminalOpen(t => !t) },
    { id:'toggle-ai', label:'Ver: Alternar panel NEX AI', action: () => setAiPanelOpen(o => !o) },
    { id:'toggle-preview', label:'NEX CODE: Alternar vista previa', action: () => setPreviewOpen(v => !v) },
    { id:'save', label:'Archivo: Guardar (Ctrl+S)', action: saveFile },
    { id:'settings', label:'Preferencias: Abrir configuración', action: () => { setSettingsTabOpen(true); setPaletteOpen(false); } },
  ]), []);

  const ext = activeFile.split('.').pop() || '';

  /* ---------- render del árbol de explorador ---------- */
  const tree = [
    { name:'src', type:'folder', children:[{ name:'App.tsx', path:'src/App.tsx' }, { name:'index.tsx', path:'src/index.tsx' }, { name:'index.css', path:'src/index.css' }] },
    { name:'package.json', path:'package.json' }, { name:'tsconfig.json', path:'tsconfig.json' }, { name:'README.md', path:'README.md' },
  ];
  const renderTree = (items, level = 0) => items.map((item, idx) => {
    if (item.type === 'folder') {
      const open = !!explorerOpenFolders[item.name];
      return (
        <div key={idx}>
          <div onClick={() => setExplorerOpenFolders(o => ({ ...o, [item.name]: !o[item.name] }))}
            style={{ display:'flex', alignItems:'center', gap:5, padding:`3px 8px 3px ${8+level*14}px`, fontSize:13, cursor:'pointer', userSelect:'none' }}>
            <span style={{ fontSize:10, color:p.textDim, transform: open ? 'rotate(90deg)' : 'none', display:'inline-block', width:10 }}>▶</span>
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M1.5 1A1.5 1.5 0 0 0 0 2.5v11A1.5 1.5 0 0 0 1.5 15h13a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H8L6.5 3H1.5z" fill={p.textDim}/></svg>
            <span>{item.name}</span>
          </div>
          {open && renderTree(item.children, level + 1)}
        </div>
      );
    }
    const fext = item.path.split('.').pop();
    const active = activeFile === item.path;
    return (
      <div key={idx} onClick={() => openFile(item.path)} style={{
        display:'flex', alignItems:'center', gap:6, padding:`3px 8px 3px ${22+level*14}px`, fontSize:13, cursor:'pointer',
        background: active ? p.selection : 'transparent', color: active ? '#fff' : p.text, userSelect:'none',
      }}>
        <FileIcon ext={fext} />
        <span>{item.name}</span>
        {dirty[item.path] && <span style={{ marginLeft:'auto', marginRight:8, width:8, height:8, borderRadius:'50%', background: p.text, opacity:0.7 }} />}
      </div>
    );
  });

  const paletteFiltered = paletteMode === 'commands'
    ? commands.filter(c => c.label.toLowerCase().includes(paletteQuery.toLowerCase()))
    : paletteMode === 'themes'
    ? Object.keys(allThemes).filter(t => t.toLowerCase().includes(paletteQuery.toLowerCase()))
    : [];

  const tokenized = useMemo(() => file ? tokenize(file.content, file.language, p) : [], [file?.content, file?.language, p]);

  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100%', background:p.bg, color:p.text,
      fontFamily:"'Segoe UI',system-ui,sans-serif", overflow:'hidden', position:'relative',
      border: maximized ? 'none' : `1px solid ${p.border}`,
    }}>
      <style>{`
        .nex-scroll::-webkit-scrollbar { width: 14px; height: 14px; }
        .nex-scroll::-webkit-scrollbar-thumb { background: ${p.scrollbar}; border: 3px solid transparent; background-clip: content-box; border-radius: 7px; }
        .nex-scroll::-webkit-scrollbar-track { background: transparent; }
        .nex-input::placeholder { color: ${p.textDim}; }
        @keyframes nexBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
      `}</style>

      {/* ---------- Title bar ---------- */}
      <div style={{ height:30, background:p.titlebar, display:'flex', alignItems:'center', flexShrink:0, fontSize:12, color:p.text, WebkitAppRegion:'drag' }}>
        <div style={{ display:'flex', gap:8, padding:'0 12px', alignItems:'center' }}>
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#ff5f57', display:'inline-block' }} />
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#febc2e', display:'inline-block' }} />
          <span style={{ width:12, height:12, borderRadius:'50%', background:'#28c840', display:'inline-block' }} />
        </div>
        <div style={{ flex:1, textAlign:'center', color:p.textDim, fontSize:12 }}>
          {activeFile}{dirty[activeFile] ? ' •' : ''} — nex-code-app — NEX CODE
        </div>
        <div style={{ width:140 }} />
      </div>

      {/* Menubar */}
      <div style={{ height:28, background:p.titlebar, display:'flex', alignItems:'center', paddingLeft:8, fontSize:12, flexShrink:0, borderBottom:`1px solid ${p.border}` }}>
        <svg viewBox="0 0 100 100" width="15" height="15" style={{ marginRight:8 }}>
          <path d="M74.9 10.4L50 35.3l-11-11L10 42.8v14.4l11-8.2 11 11 28-28.9V74l-11-8-11 11 28.9 13L90 79V21z" fill={p.accent} />
        </svg>
        {['Archivo','Editar','Selección','Ver','Ir','Ejecutar','Terminal','Ayuda'].map(item => (
          <div key={item} style={{ padding:'5px 9px', color:p.textDim, cursor:'pointer', borderRadius:3 }}
            onMouseEnter={e => e.currentTarget.style.background = p.selection}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => { if (item === 'Ver') { setPaletteMode('commands'); setPaletteOpen(true); } }}
          >{item}</div>
        ))}
        <div style={{ flex:1 }} />
        <div onClick={() => { setPaletteMode('commands'); setPaletteQuery(''); setPaletteOpen(true); }}
          style={{ display:'flex', alignItems:'center', gap:6, background:p.bgAlt, border:`1px solid ${p.border}`, borderRadius:4, padding:'2px 10px', margin:'0 10px', fontSize:11.5, color:p.textDim, cursor:'pointer', minWidth:280, justifyContent:'space-between' }}>
          <span>nex-code-app</span><span>Ctrl+Shift+P</span>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* ---------- Activity bar ---------- */}
        <div style={{ width:48, background:p.activitybar, display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0', flexShrink:0 }}>
          {[
            { id:'explorer', icon:(<svg viewBox="0 0 16 16" width="22" height="22" fill="currentColor" style={{padding:4}}><path d="M2 1.5A1.5 1.5 0 0 1 3.5 0h6a.5.5 0 0 1 .35.15l2 2A.5.5 0 0 1 12 2.5v12a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 14.5v-13zM3.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V2.707L9.793 1.5H3.5z"/></svg>) },
            { id:'search', icon:(<svg viewBox="0 0 16 16" width="22" height="22" fill="currentColor" style={{padding:4}}><path fillRule="evenodd" d="M15.7 14.3l-3.8-3.8A5.5 5.5 0 1 0 10.5 11.9l3.8 3.8a1 1 0 0 0 1.4-1.4zM7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/></svg>) },
            { id:'git', icon:(<svg viewBox="0 0 16 16" width="22" height="22" fill="currentColor" style={{padding:4}}><path fillRule="evenodd" d="M10.5 7.5a2.5 2.5 0 0 1-2.45 2h-.1a2.5 2.5 0 0 1-2.35-1.75.5.5 0 1 0-.96.28A3.5 3.5 0 0 0 7.95 10h.1a3.5 3.5 0 1 0 2.45-6zM7 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm6 9a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/></svg>) },
            { id:'nexai', icon:(<span style={{ fontSize:18 }}>✨</span>) },
          ].map(item => (
            <button key={item.id} onClick={() => item.id === 'nexai' ? setAiPanelOpen(o => !o) : setActivityView(item.id)} title={item.id}
              style={{
                width:48, height:42, background:'transparent', border:'none', cursor:'pointer', position:'relative',
                color: activityView === item.id ? '#fff' : p.textDim, display:'flex', alignItems:'center', justifyContent:'center',
              }}>
              {activityView === item.id && <span style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background:'#fff' }} />}
              {item.icon}
            </button>
          ))}
          <div style={{ flex:1 }} />
          <button onClick={() => { setPaletteMode('groqStatus'); setPaletteOpen(true); }} title="Estado del backend NEX AI"
            style={{ width:48, height:42, background:'transparent', border:'none', cursor:'pointer', color: backendStatus.online && backendStatus.groqConfigured ? '#4ec9b0' : p.textDim, fontSize:18 }}>⚙</button>
        </div>

        {/* ---------- Sidebar ---------- */}
        {activityView === 'explorer' && (
          <div className="nex-scroll" style={{ width:240, background:p.sidebar, borderRight:`1px solid ${p.border}`, display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
            <div style={{ fontSize:11, padding:'10px 16px 6px', textTransform:'uppercase', fontWeight:700, letterSpacing:0.5 }}>Explorador</div>
            <div style={{ fontSize:11, fontWeight:700, padding:'4px 12px', textTransform:'uppercase', color:p.textDim, display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:9, transform:'rotate(90deg)', display:'inline-block' }}>▶</span> NEX-CODE-APP
            </div>
            {renderTree(tree)}
          </div>
        )}
        {activityView === 'search' && (
          <div style={{ width:240, background:p.sidebar, borderRight:`1px solid ${p.border}`, flexShrink:0, padding:10 }}>
            <div style={{ fontSize:11, textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>Búsqueda</div>
            <input className="nex-input" placeholder="Buscar" style={{ width:'100%', background:p.bgAlt, border:`1px solid ${p.border}`, color:p.text, padding:'6px 8px', borderRadius:3, fontSize:12.5, outline:'none' }} />
          </div>
        )}
        {activityView === 'git' && (
          <div style={{ width:240, background:p.sidebar, borderRight:`1px solid ${p.border}`, flexShrink:0, padding:10, fontSize:12.5 }}>
            <div style={{ fontSize:11, textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>Control de código</div>
            <div style={{ color:p.textDim }}>main · sin cambios pendientes</div>
          </div>
        )}

        {/* ---------- Main ---------- */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ flex:1, display:'flex', minHeight:0 }}>
            {/* Editor column */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
              {/* Tabs */}
              <div style={{ display:'flex', background:p.sidebar, borderBottom:`1px solid ${p.border}`, minHeight:35, alignItems:'stretch' }}>
                <div className="nex-scroll" style={{ display:'flex', flex:1, overflowX:'auto' }}>
                  {openFiles.map(fname => {
                    const fext = fname.split('.').pop(); const fn = fname.split('/').pop(); const isActive = activeFile === fname;
                    return (
                      <div key={fname} onClick={() => openFile(fname)} style={{
                        display:'flex', alignItems:'center', gap:6, padding:'0 6px 0 12px', fontSize:13, minWidth:130,
                        background: isActive ? p.bg : 'transparent', color: isActive ? p.text : p.textDim,
                        borderTop: isActive ? `1px solid ${p.tabActiveBorder}` : '1px solid transparent',
                        borderRight:`1px solid ${p.border}`, cursor:'pointer', height:35, position:'relative',
                      }}>
                        <FileIcon ext={fext} />
                        <span style={{ fontStyle: isActive ? 'normal':'normal' }}>{fn}</span>
                        {dirty[fname]
                          ? <span style={{ marginLeft:6, width:8, height:8, borderRadius:'50%', background:p.text, opacity:0.8 }} />
                          : <button onClick={e => closeFile(fname, e)} style={{ marginLeft:6, background:'transparent', border:'none', color:p.textDim, cursor:'pointer', fontSize:13, opacity:0.8 }}>✕</button>}
                      </div>
                    );
                  })}
                </div>
                <button onClick={explainSelection} title="Explicar selección con NEX AI"
                  style={{ background:'transparent', border:'none', color:p.text, cursor:'pointer', fontSize:12, padding:'0 12px', borderLeft:`1px solid ${p.border}` }}>✨ Explicar</button>
                <button onClick={() => setPreviewOpen(v => !v)} title="Vista previa"
                  style={{ background:'transparent', border:'none', color:p.text, cursor:'pointer', fontSize:12, padding:'0 12px', borderLeft:`1px solid ${p.border}` }}>▶ Run</button>
              </div>

              {/* Breadcrumb */}
              {file && (
                <div style={{ display:'flex', alignItems:'center', padding:'3px 16px', fontSize:12, color:p.textDim, borderBottom:`1px solid ${p.border}`, gap:4 }}>
                  {activeFile.split('/').map((part, i, arr) => (
                    <React.Fragment key={i}>
                      <span style={{ color: i === arr.length-1 ? p.text : p.textDim }}>{part}</span>
                      {i < arr.length-1 && <span>›</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Editor */}
              {file ? (
                <div style={{ flex:1, display:'flex', minHeight:0, position:'relative' }}>
                  <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
                    <textarea
                      ref={editorRef}
                      value={file.content}
                      onChange={handleCodeChange}
                      onScroll={handleScroll}
                      onKeyDown={onEditorKeyDown}
                      onClick={e => updateCursor(e.target)}
                      spellCheck={false}
                      wrap="off"
                      className="nex-scroll"
                      style={{
                        position:'absolute', inset:0, padding:`10px 0 10px 0`, background:'transparent',
                        color:p.text, caretColor:p.text, border:'none', outline:'none', resize:'none',
                        fontFamily:"'Cascadia Code','Consolas','Courier New',monospace", fontSize:14, lineHeight:`${LINE_H}px`,
                        whiteSpace:'pre', overflow:'auto', zIndex:2, WebkitTextFillColor:'transparent', boxSizing:'border-box',
                        paddingLeft:54,
                      }}
                    />
                    <div ref={highlightRef} style={{
                      position:'absolute', inset:0, padding:'10px 0', pointerEvents:'none',
                      fontFamily:"'Cascadia Code','Consolas','Courier New',monospace", fontSize:14, lineHeight:`${LINE_H}px`,
                      whiteSpace:'pre', overflow:'hidden', zIndex:1, boxSizing:'border-box',
                    }}>
                      {tokenized.map(l => (
                        <div key={l.i} style={{ display:'flex', height:LINE_H, background: l.i+1 === cursorPos.line ? p.lineHL : 'transparent' }}>
                          <span style={{ width:54, minWidth:54, textAlign:'right', paddingRight:18, color: l.i+1 === cursorPos.line ? p.text : p.textDim, fontSize:13, flexShrink:0, userSelect:'none' }}>{l.i+1}</span>
                          <span dangerouslySetInnerHTML={{ __html: l.html }} />
                        </div>
                      ))}
                      {ghostText && <span style={{ color:p.textDim, opacity:0.5, fontStyle:'italic' }}>{ghostText}</span>}
                    </div>
                    {ghostLoading && <div style={{ position:'absolute', bottom:10, right:18, fontSize:11, color:p.textDim, zIndex:3 }}>NEX AI pensando…</div>}
                    {ghostText && !ghostLoading && <div style={{ position:'absolute', bottom:10, right:18, fontSize:11, color:p.accent, zIndex:3 }}>Tab acepta · Esc descarta</div>}
                  </div>

                  {/* Minimap real */}
                  <div style={{ width:90, background:p.bg, borderLeft:`1px solid ${p.border}`, overflow:'hidden', position:'relative', flexShrink:0 }}>
                    <div ref={minimapRef} style={{ position:'absolute', top:0, left:0, right:0, padding:'4px 0', transform:'scale(0.62)', transformOrigin:'top left', width:'161%' }}>
                      {tokenized.map(l => (
                        <div key={l.i} style={{ height:6, fontSize:5.5, lineHeight:'6px', whiteSpace:'pre', overflow:'hidden' }} dangerouslySetInnerHTML={{ __html: l.html }} />
                      ))}
                    </div>
                    <div style={{ position:'absolute', top:0, right:0, width:6, background:p.scrollbar, height:60, borderRadius:3 }} />
                  </div>
                </div>
              ) : (
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:p.textDim }}>Abrí un archivo para empezar</div>
              )}
            </div>

            {/* Preview */}
            {previewOpen && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, borderLeft:`1px solid ${p.border}`, background:'#fff' }}>
                <div style={{ height:35, background:p.sidebar, display:'flex', alignItems:'center', padding:'0 10px', borderBottom:`1px solid ${p.border}`, fontSize:12, color:p.text, gap:8 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#28c840' }} />
                  <span style={{ color:p.textDim }}>http://localhost:5173/</span>
                  <div style={{ flex:1 }} />
                  <button onClick={() => setPreviewOpen(false)} style={{ background:'transparent', border:'none', color:p.text, cursor:'pointer' }}>✕</button>
                </div>
                <iframe srcDoc={getPreviewHtml()} style={{ flex:1, border:'none', background:'#fff' }} sandbox="allow-scripts allow-same-origin" />
              </div>
            )}

            {/* NEX AI panel */}
            {aiPanelOpen && (
              <div style={{ width:330, display:'flex', flexDirection:'column', borderLeft:`1px solid ${p.border}`, background:p.sidebar, flexShrink:0 }}>
                <div style={{ height:35, display:'flex', alignItems:'center', padding:'0 10px', borderBottom:`1px solid ${p.border}`, fontSize:12, fontWeight:700, gap:6 }}>
                  <span>✨ NEX AI</span>
                  {backendStatus.online && backendStatus.groqConfigured
                    ? <span style={{ color:'#4ec9b0', fontSize:10 }}>● {groqModel}</span>
                    : backendStatus.online
                      ? <span style={{ color:'#e5c07b', fontSize:10 }}>● falta GROQ_API_KEY</span>
                      : <span style={{ color:'#f44747', fontSize:10 }}>● backend desconectado</span>}
                  <div style={{ flex:1 }} />
                  <button onClick={() => setAiPanelOpen(false)} style={{ background:'transparent', border:'none', color:p.text, cursor:'pointer' }}>✕</button>
                </div>
                <div ref={chatBoxRef} className="nex-scroll" style={{ flex:1, overflowY:'auto', padding:10, fontSize:12.5 }}>
                  {chatMessages.map((m,i) => (
                    <div key={i} style={{ marginBottom:10, padding:'8px 10px', borderRadius:6, lineHeight:1.5, whiteSpace:'pre-wrap', background: m.role==='user' ? p.selection : p.bgAlt }}>
                      <div style={{ fontSize:10, fontWeight:700, marginBottom:4, color:p.textDim }}>{m.role==='user' ? 'Vos' : 'NEX AI'}</div>
                      {m.content}
                    </div>
                  ))}
                  {chatLoading && <div style={{ color:p.textDim, fontSize:12 }}>NEX AI escribiendo…</div>}
                </div>
                <div style={{ borderTop:`1px solid ${p.border}`, padding:8, display:'flex', gap:6 }}>
                  <input className="nex-input" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')sendChat();}}
                    placeholder="Preguntale a NEX AI..." style={{ flex:1, background:p.bgAlt, border:`1px solid ${p.border}`, color:p.text, padding:'6px 8px', borderRadius:4, fontSize:12, outline:'none' }} />
                  <button onClick={sendChat} style={{ background:p.accent, color:p.accentText, border:'none', borderRadius:4, padding:'0 12px', cursor:'pointer' }}>➤</button>
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          {terminalOpen && (
            <div style={{ height:210, borderTop:`1px solid ${p.border}`, background:p.bg, display:'flex', flexDirection:'column', flexShrink:0 }}>
              <div style={{ height:32, display:'flex', alignItems:'center', padding:'0 12px', background:p.sidebar, borderBottom:`1px solid ${p.border}`, gap:16 }}>
                {[['terminal','TERMINAL'],['problems','PROBLEMAS'],['output','SALIDA']].map(([id,label]) => (
                  <span key={id} onClick={()=>setTerminalTab(id)} style={{ fontSize:11, letterSpacing:0.4, cursor:'pointer', color: terminalTab===id ? p.text : p.textDim, borderBottom: terminalTab===id?`1px solid ${p.text}`:'none', paddingBottom:8 }}>{label}</span>
                ))}
                <div style={{ flex:1 }} />
                <button onClick={()=>setTerminalLines([])} style={{ background:'transparent', border:'none', color:p.textDim, cursor:'pointer', fontSize:13 }} title="Limpiar">🗑</button>
                <button onClick={()=>setTerminalOpen(false)} style={{ background:'transparent', border:'none', color:p.textDim, cursor:'pointer' }}>✕</button>
              </div>
              {terminalTab === 'terminal' ? (
                <div ref={termRef} className="nex-scroll" style={{ flex:1, overflowY:'auto', padding:'8px 14px', fontSize:13, fontFamily:"'Cascadia Code',Consolas,monospace", lineHeight:1.5 }}>
                  {terminalLines.map((l,i) => <div key={i} style={{ whiteSpace:'pre-wrap', color: l.includes('vulnerabilit') ? '#4ec9b0' : p.text }}>{l}</div>)}
                  <div style={{ display:'flex', alignItems:'center' }}>
                    <span style={{ color:p.accent }}>PS C:\nex-code-app&gt;</span>
                    <input value={termInput} onChange={e=>setTermInput(e.target.value)} onKeyDown={handleTermInput}
                      style={{ flex:1, background:'transparent', border:'none', color:p.text, outline:'none', marginLeft:8, fontFamily:"'Cascadia Code',Consolas,monospace", fontSize:13 }} />
                  </div>
                </div>
              ) : (
                <div style={{ flex:1, padding:14, color:p.textDim, fontSize:12.5 }}>Sin {terminalTab === 'problems' ? 'problemas' : 'salida'} por el momento.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ height:22, background:p.statusbar, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 10px', fontSize:11.5, color:'#fff', flexShrink:0 }}>
        <div style={{ display:'flex', gap:14 }}>
          <span>🔀 main</span>
          <span>✓ 0 ⚠ 0</span>
          <span onClick={()=>setTerminalOpen(t=>!t)} style={{ cursor:'pointer' }}>⌨ Terminal</span>
        </div>
        <div style={{ display:'flex', gap:14 }}>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Espacios: 2</span>
          <span>UTF-8</span>
          <span>{LANG_META[ext]?.label || 'Texto'}</span>
          <span onClick={()=>{setPaletteMode('themes');setPaletteOpen(true);}} style={{ cursor:'pointer' }}>🎨 {themeName}</span>
          <span onClick={()=>{setPaletteMode('groqStatus');setPaletteOpen(true);}} style={{ cursor:'pointer' }}>
            {backendStatus.online && backendStatus.groqConfigured ? `Groq ✓ ${groqModel}` : backendStatus.online ? 'Backend ✓ / sin key' : 'Backend desconectado'}
          </span>
        </div>
      </div>

      {/* ---------- Command palette ---------- */}
      {paletteOpen && (
        <div onClick={()=>setPaletteOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', justifyContent:'center', paddingTop:90 }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:560, maxHeight:420, background:p.sidebar, border:`1px solid ${p.border}`, borderRadius:6, boxShadow:'0 8px 30px rgba(0,0,0,0.5)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
            {(paletteMode === 'commands' || paletteMode === 'themes') && (
              <>
                <input autoFocus value={paletteQuery} onChange={e=>setPaletteQuery(e.target.value)}
                  placeholder={paletteMode === 'commands' ? '> Escribí un comando...' : 'Seleccioná un tema...'}
                  style={{ padding:'12px 14px', background:'transparent', border:'none', borderBottom:`1px solid ${p.border}`, color:p.text, fontSize:14, outline:'none' }} />
                <div className="nex-scroll" style={{ overflowY:'auto', maxHeight:340 }}>
                  {paletteMode === 'commands' && paletteFiltered.map(c => (
                    <div key={c.id} onClick={()=>{ c.action(); if (c.id !== 'theme' && c.id !== 'groq-status' && c.id !== 'groq-model' && c.id !== 'theme-import') setPaletteOpen(false); }}
                      style={{ padding:'8px 14px', fontSize:13, cursor:'pointer' }}
                      onMouseEnter={e=>e.currentTarget.style.background=p.selection} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      {c.label}
                    </div>
                  ))}
                  {paletteMode === 'themes' && paletteFiltered.map(name => (
                    <div key={name} onClick={()=>{ setThemeName(name); setPaletteOpen(false); }}
                      style={{ padding:'8px 14px', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:8, background: themeName===name ? p.selection : 'transparent' }}
                      onMouseEnter={e=>e.currentTarget.style.background=p.selection} onMouseLeave={e=>e.currentTarget.style.background = themeName===name?p.selection:'transparent'}>
                      <span style={{ width:14, height:14, borderRadius:3, background:allThemes[name].accent, border:`1px solid ${p.border}` }} />
                      {name}
                    </div>
                  ))}
                </div>
              </>
            )}
            {paletteMode === 'themeImport' && (
              <div style={{ padding:16 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Importar tema desde vscodethemes.com</div>
                <div style={{ fontSize:12, color:p.textDim, marginBottom:8, lineHeight:1.5 }}>
                  Abrí <a href="https://vscodethemes.com/" target="_blank" rel="noreferrer" style={{ color:p.accent }}>vscodethemes.com</a>, elegí un tema, tocá "Get theme" / copiar JSON, y pegalo abajo:
                </div>
                <textarea value={themeJsonInput} onChange={e=>setThemeJsonInput(e.target.value)} placeholder='{ "name": "...", "colors": {...}, "tokenColors": [...] }'
                  style={{ width:'100%', height:130, background:p.bgAlt, border:`1px solid ${p.border}`, color:p.text, fontSize:12, padding:8, borderRadius:4, fontFamily:'monospace', outline:'none', resize:'vertical' }} />
                {themeImportError && <div style={{ color:'#f44747', fontSize:12, marginTop:6 }}>{themeImportError}</div>}
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <button onClick={importTheme} style={{ background:p.accent, color:p.accentText, border:'none', padding:'7px 14px', borderRadius:4, cursor:'pointer', fontSize:12 }}>Importar</button>
                  <button onClick={()=>setPaletteOpen(false)} style={{ background:'transparent', border:`1px solid ${p.border}`, color:p.text, padding:'7px 14px', borderRadius:4, cursor:'pointer', fontSize:12 }}>Cerrar</button>
                </div>
              </div>
            )}
            {paletteMode === 'groqStatus' && (
              <div style={{ padding:16 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Estado de las funciones NEX AI (/api en Vercel)</div>
                <div style={{ fontSize:12, color:p.textDim, lineHeight:1.6 }}>
                  <div>Funciones: {backendStatus.online ? <span style={{ color:'#4ec9b0' }}>responden{API_BASE ? ` en ${API_BASE}` : ' (mismo dominio)'}</span> : <span style={{ color:'#f44747' }}>no responden</span>}</div>
                  <div>GROQ_API_KEY: {backendStatus.groqConfigured ? <span style={{ color:'#4ec9b0' }}>configurada</span> : <span style={{ color:'#e5c07b' }}>falta en Vercel</span>}</div>
                  <div style={{ marginTop:8 }}>
                    La API key de Groq vive solo en el servidor (variable de entorno en Vercel) — el navegador nunca la ve.
                    Local: <code>vercel dev</code> (lee .env.local). Producción: Project → Settings → Environment Variables.
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <button onClick={async ()=>{
                    try {
                      const res = await fetch(`${API_BASE}/api/groq/health`);
                      const data = await res.json();
                      setBackendStatus({ checked:true, online:true, groqConfigured: Boolean(data.groqConfigured) });
                    } catch { setBackendStatus({ checked:true, online:false, groqConfigured:false }); }
                  }} style={{ background:p.accent, color:p.accentText, border:'none', padding:'7px 14px', borderRadius:4, cursor:'pointer', fontSize:12 }}>Reintentar</button>
                  <button onClick={()=>setPaletteOpen(false)} style={{ background:'transparent', border:`1px solid ${p.border}`, color:p.text, padding:'7px 14px', borderRadius:4, cursor:'pointer', fontSize:12 }}>Cerrar</button>
                </div>
              </div>
            )}
            {paletteMode === 'groqModel' && (
              <div style={{ padding:16 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Modelo de Groq</div>
                {['llama-3.3-70b-versatile','llama-3.1-8b-instant','mixtral-8x7b-32768','gemma2-9b-it'].map(m => (
                  <div key={m} onClick={()=>{ setGroqModel(m); setPaletteOpen(false); }}
                    style={{ padding:'8px 10px', fontSize:13, cursor:'pointer', borderRadius:4, background: groqModel===m ? p.selection : 'transparent' }}>
                    {m}{groqModel===m ? ' ✓' : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}