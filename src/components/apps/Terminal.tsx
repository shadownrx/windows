import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFileSystem } from '../../context/FileSystemContext';
import { useSettings } from '../../context/SettingsContext';
import { useNexRuntime } from '../../context/NexRuntimeContext';
import { useWindowManager } from '../../context/WindowManager';
import {
  Folder24Regular, Document24Regular, Apps24Regular, Calculator24Regular,
  Code24Regular, Globe24Regular, ShieldCheckmark24Regular, Settings24Regular,
} from "@fluentui/react-icons";

// Icon map shared with Cmd
const NEX_ICONS: Record<string, React.ReactNode> = {
  notepad:       <Document24Regular />,
  cmd:           <span style={{ fontFamily: 'Consolas,monospace', fontWeight: 'bold', fontSize: 16 }}>C:\</span>,
  terminal:      <span style={{ fontFamily: 'Consolas,monospace', fontWeight: 'bold', fontSize: 16 }}>C:\</span>,
  chrome:        <Globe24Regular />,
  'file-explorer': <Folder24Regular />,
  paint:         <span style={{ fontSize: 18 }}>🎨</span>,
  calculator:    <Calculator24Regular />,
  taskmanager:   <Apps24Regular />,
  spotify:       <span style={{ fontSize: 18 }}>🎵</span>,
  settings:      <Settings24Regular />,
  wordpad:       <Document24Regular />,
  defender:      <ShieldCheckmark24Regular />,
  mediaplayer:   <span style={{ fontSize: 18 }}>▶️</span>,
  'devcpp-2026': <Code24Regular primaryFill="#3b82f6" />,
};

type Line = { text: string; color?: string };

const Terminal: React.FC = () => {
  const { files, createFolder, createFile, deleteItem } = useFileSystem();
  const { userName } = useSettings();
  const { npmRun, pnpmRun, resolveNex } = useNexRuntime();
  const { openWindow } = useWindowManager();

  const [history, setHistory] = useState<Line[]>([
    { text: 'NEX OS Terminal [Versión 2.0.1278]' },
    { text: '(c) NEXA Systems. Todos los derechos reservados.' },
    { text: '' },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [currentDirId, setCurrentDirId] = useState('c-drive');
  const [isRunning, setIsRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  // Compute virtual path
  const currentPath = (() => {
    const parts: string[] = [];
    let curr = files.find(f => f.id === currentDirId);
    while (curr) {
      parts.unshift(curr.id === 'c-drive' ? 'C:' : curr.name);
      curr = files.find(f => f.id === curr?.parentId);
    }
    return parts.join('\\') + (parts.length === 1 ? '\\' : '');
  })();

  const pushLine = useCallback((text: string, color?: string) => {
    setHistory(prev => [...prev, { text, color }]);
  }, []);

  const runAsync = useCallback(async (gen: AsyncGenerator<string>, color?: string) => {
    setIsRunning(true);
    for await (const line of gen) {
      if (line === undefined) continue;
      setHistory(prev => [...prev, { text: line, color }]);
      await new Promise(r => setTimeout(r, 0));
    }
    setHistory(prev => [...prev, { text: '' }]);
    setIsRunning(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const getFolderByName = (name: string, parentId: string) =>
    files.find(f => f.name.toLowerCase() === name.toLowerCase() && f.type === 'folder' && f.parentId === parentId);

  const handleCommand = useCallback((cmd: string) => {
    if (isRunning) return;
    const parts = cmd.trim().split(' ').filter(Boolean);
    const command = parts[0]?.toLowerCase() ?? '';
    const args = parts.slice(1);

    setHistory(prev => [...prev, { text: `${userName.toLowerCase()}@nexos:${currentPath.toLowerCase()}$ ${cmd}`, color: '#86efac' }]);
    setCmdHistory(prev => [cmd, ...prev]);
    setHistoryPointer(-1);

    // ── npm ─────────────────────────────────────────────────────────────
    if (command === 'npm') {
      runAsync(npmRun(args, currentPath), '#4ade80');
      return;
    }

    // ── pnpm ─────────────────────────────────────────────────────────────
    if (command === 'pnpm') {
      runAsync(pnpmRun(args, currentPath), '#a78bfa');
      return;
    }

    // ── .nex files ────────────────────────────────────────────────────────
    const isNex = command.endsWith('.nex') || command.startsWith('./') || command.startsWith('.\\');
    if (isNex) {
      const exe = resolveNex(command);
      if (exe) {
        setHistory(prev => [...prev, { text: `Iniciando ${exe.title}...`, color: '#60a5fa' }, { text: '' }]);
        setTimeout(() => openWindow(exe.appId, exe.appId, exe.title, NEX_ICONS[exe.appId] ?? <Document24Regular />), 200);
      } else {
        setHistory(prev => [...prev, { text: `bash: ${command}: Archivo no encontrado`, color: '#f87171' }, { text: '' }]);
      }
      return;
    }

    let output: Line[] = [];

    switch (command) {
      case 'clear':
      case 'cls':
        setHistory([
          { text: 'NEX OS Terminal [Versión 2.0.1278]' },
          { text: '(c) NEXA Systems. Todos los derechos reservados.' },
          { text: '' },
        ]);
        return;

      case 'ls':
      case 'dir': {
        const items = files.filter(f => f.parentId === currentDirId);
        items.forEach(f => {
          const isDir = f.type === 'folder';
          const name = f.ext ? `${f.name}.${f.ext}` : f.name;
          const color = f.ext === 'nex' ? '#60a5fa' : isDir ? '#fbbf24' : undefined;
          output.push({ text: `${isDir ? 'd' : '-'}rwxr-xr-x  ${f.size ?? '4.0K'}  ${f.modified}  ${name}`, color });
        });
        if (items.length === 0) output.push({ text: '(vacío)' });
        break;
      }

      case 'cd': {
        if (!args[0]) { output.push({ text: currentPath }); break; }
        if (args[0] === '..') {
          const curr = files.find(f => f.id === currentDirId);
          if (curr?.parentId) setCurrentDirId(curr.parentId);
        } else if (args[0] === '~' || args[0] === '/') {
          setCurrentDirId('c-drive');
        } else {
          const folder = getFolderByName(args[0], currentDirId);
          if (folder) setCurrentDirId(folder.id);
          else output.push({ text: `bash: cd: ${args[0]}: No existe el archivo o el directorio`, color: '#f87171' });
        }
        break;
      }

      case 'mkdir': {
        if (!args[0]) { output.push({ text: 'mkdir: falta operando' }); break; }
        const name = args.join(' ');
        if (getFolderByName(name, currentDirId)) {
          output.push({ text: `mkdir: no se puede crear el directorio '${name}': El archivo ya existe`, color: '#f87171' });
        } else {
          createFolder(currentDirId, name);
          output.push({ text: `Directorio creado: ${name}`, color: '#4ade80' });
        }
        break;
      }

      case 'touch': {
        if (!args[0]) { output.push({ text: 'touch: falta operando' }); break; }
        const nameParts = args[0].split('.');
        const ext = nameParts.length > 1 ? nameParts.pop()! : 'txt';
        const baseName = nameParts.join('.');
        createFile(currentDirId, baseName, ext);
        output.push({ text: `Archivo creado: ${args[0]}`, color: '#4ade80' });
        break;
      }

      case 'rm':
      case 'rmdir': {
        if (!args[0]) { output.push({ text: `${command}: falta operando` }); break; }
        const item = files.find(f => f.parentId === currentDirId &&
          (f.name === args[0] || `${f.name}.${f.ext}` === args[0]));
        if (item) { deleteItem(item.id); output.push({ text: `Eliminado: ${args[0]}`, color: '#4ade80' }); }
        else output.push({ text: `${command}: no se puede eliminar '${args[0]}': No existe`, color: '#f87171' });
        break;
      }

      case 'echo':
        output.push({ text: args.join(' ') });
        break;

      case 'pwd':
        output.push({ text: currentPath });
        break;

      case 'whoami':
        output.push({ text: userName.toLowerCase() + '@nexos' });
        break;

      case 'uname':
        output.push({ text: 'NEX OS 2.0.1278 x86_64 NEX-Kernel/5.15.0' });
        break;

      case 'node':
      case 'node.exe': {
        if (!args[0] || args[0] === '--version' || args[0] === '-v') {
          output.push({ text: 'v20.15.0', color: '#4ade80' });
        } else {
          output.push({ text: `Running ${args[0]}...`, color: '#9ca3af' });
          output.push({ text: 'Process exited with code 0', color: '#9ca3af' });
        }
        break;
      }

      case 'which': {
        const targets: Record<string, string> = {
          node: '/usr/local/bin/node',
          npm: '/usr/local/bin/npm',
          pnpm: '/usr/local/bin/pnpm',
        };
        output.push({ text: targets[args[0]] ?? `which: no ${args[0]} in PATH`, color: targets[args[0]] ? '#4ade80' : '#f87171' });
        break;
      }

      case 'env': {
        output.push({ text: 'NODE_ENV=development' });
        output.push({ text: 'PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin' });
        output.push({ text: `USER=${userName.toLowerCase()}` });
        output.push({ text: `HOME=/home/${userName.toLowerCase()}` });
        output.push({ text: 'SHELL=/bin/bash' });
        output.push({ text: 'TERM=xterm-256color' });
        break;
      }

      case 'start': {
        const exe = resolveNex(args[0] ?? '');
        if (exe) {
          output.push({ text: `Iniciando ${exe.title}...`, color: '#60a5fa' });
          setTimeout(() => openWindow(exe.appId, exe.appId, exe.title, NEX_ICONS[exe.appId] ?? <Document24Regular />), 200);
        } else {
          output.push({ text: `No se encontró: ${args[0]}`, color: '#f87171' });
        }
        break;
      }

      case 'cat': {
        if (!args[0]) { output.push({ text: 'cat: falta operando' }); break; }
        const file = files.find(f => f.parentId === currentDirId &&
          (f.name === args[0] || `${f.name}.${f.ext}` === args[0]));
        if (file) {
          if (file.content) {
            file.content.split('\n').forEach(l => output.push({ text: l }));
          } else {
            output.push({ text: `(archivo vacío)`, color: '#9ca3af' });
          }
        } else {
          output.push({ text: `cat: ${args[0]}: No existe el archivo o el directorio`, color: '#f87171' });
        }
        break;
      }

      case 'ping': {
        const host = args[0] || '127.0.0.1';
        output.push({ text: `PING ${host}: 56 data bytes` });
        for (let i = 0; i < 4; i++) {
          output.push({ text: `64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${(Math.random() * 3).toFixed(3)} ms` });
        }
        output.push({ text: '' });
        output.push({ text: `--- ${host} ping statistics ---` });
        output.push({ text: '4 packets transmitted, 4 received, 0% packet loss' });
        break;
      }

      case 'help': {
        output.push({ text: 'Comandos disponibles:', color: '#60a5fa' });
        output.push({ text: '' });
        output.push({ text: '  ls / dir     Lista el contenido del directorio' });
        output.push({ text: '  cd <dir>     Cambia el directorio' });
        output.push({ text: '  mkdir <dir>  Crea un directorio' });
        output.push({ text: '  touch <file> Crea un archivo' });
        output.push({ text: '  rm <file>    Elimina un archivo' });
        output.push({ text: '  cat <file>   Muestra el contenido de un archivo' });
        output.push({ text: '  echo <text>  Muestra un mensaje' });
        output.push({ text: '  pwd          Directorio actual' });
        output.push({ text: '  whoami       Usuario actual' });
        output.push({ text: '  env          Variables de entorno' });
        output.push({ text: '  which <cmd>  Ruta de un comando' });
        output.push({ text: '  node         Runtime de Node.js' });
        output.push({ text: '  ping <host>  Ping a un host' });
        output.push({ text: '  uname        Info del sistema' });
        output.push({ text: '  clear        Limpia la pantalla' });
        output.push({ text: '' });
        output.push({ text: '  npm  <cmd>   Gestor de paquetes npm', color: '#4ade80' });
        output.push({ text: '  pnpm <cmd>   Gestor de paquetes pnpm', color: '#a78bfa' });
        output.push({ text: '' });
        output.push({ text: '  <app>.nex    Ejecuta un binario .nex', color: '#60a5fa' });
        break;
      }

      case '':
        break;

      default: {
        // PATH lookup for .nex
        const exe = resolveNex(command);
        if (exe) {
          setHistory(prev => [...prev, { text: `Iniciando ${exe.title}...`, color: '#60a5fa' }, { text: '' }]);
          setTimeout(() => openWindow(exe.appId, exe.appId, exe.title, NEX_ICONS[exe.appId] ?? <Document24Regular />), 200);
          return;
        }
        output.push({ text: `bash: ${command}: command not found`, color: '#f87171' });
        output.push({ text: `Escribe 'help' para ver los comandos disponibles.`, color: '#9ca3af' });
      }
    }

    if (output.length > 0) {
      setHistory(prev => [...prev, ...output, { text: '' }]);
    } else if (command !== '' && command !== 'clear' && command !== 'cls') {
      setHistory(prev => [...prev, { text: '' }]);
    }
  }, [isRunning, userName, currentPath, files, currentDirId, npmRun, pnpmRun, resolveNex, openWindow, runAsync, createFolder, createFile, deleteItem]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyPointer < cmdHistory.length - 1) {
        const p = historyPointer + 1;
        setHistoryPointer(p);
        setInput(cmdHistory[p]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPointer > 0) {
        const p = historyPointer - 1;
        setHistoryPointer(p);
        setInput(cmdHistory[p]);
      } else {
        setHistoryPointer(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const partial = input.split(' ').pop() ?? '';
      if (!partial) return;
      const match = files.find(f =>
        f.parentId === currentDirId &&
        (f.name.toLowerCase().startsWith(partial.toLowerCase()) ||
          `${f.name}.${f.ext}`.toLowerCase().startsWith(partial.toLowerCase()))
      );
      if (match) {
        const completed = match.ext ? `${match.name}.${match.ext}` : match.name;
        const parts = input.split(' ');
        parts[parts.length - 1] = completed;
        setInput(parts.join(' '));
      }
    }
  };

  const prompt = `${userName.toLowerCase()}@nexos:${currentPath.toLowerCase()}$`;

  return (
    <div className="terminal-root" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-scroll" ref={scrollRef}>
        {history.map((line, i) => (
          <div
            key={i}
            className="terminal-line"
            style={line.color ? { color: line.color } : undefined}
          >
            {line.text}
          </div>
        ))}
        <div className="terminal-input-line">
          <span className="terminal-prompt">{prompt}&nbsp;</span>
          <input
            ref={inputRef}
            id="term-input"
            type="text"
            className="terminal-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            disabled={isRunning}
            placeholder={isRunning ? 'Procesando...' : ''}
          />
          {isRunning && <span style={{ color: '#fbbf24', fontSize: 12, animation: 'term-blink 1s step-end infinite' }}>⏳</span>}
        </div>
      </div>

      <style>{`
        .terminal-root {
          background: #0d1117;
          color: #c9d1d9;
          font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
          height: 100%;
          padding: 12px;
          font-size: 13px;
          overflow: hidden;
          cursor: text;
        }
        .terminal-scroll {
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .terminal-line {
          white-space: pre-wrap;
          line-height: 1.5;
        }
        .terminal-input-line {
          display: flex;
          align-items: center;
          margin-top: 2px;
        }
        .terminal-prompt {
          color: #86efac;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .terminal-field {
          flex: 1;
          background: transparent;
          border: none;
          color: #f0f6fc;
          outline: none;
          font-family: inherit;
          font-size: inherit;
          caret-color: #58a6ff;
        }
        .terminal-field:disabled {
          opacity: 0.5;
        }
        .terminal-field::placeholder {
          color: #484f58;
          font-style: italic;
        }
        .terminal-scroll::-webkit-scrollbar { width: 8px; }
        .terminal-scroll::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        .terminal-scroll::-webkit-scrollbar-thumb:hover { background: #484f58; }
        @keyframes term-blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default Terminal;
