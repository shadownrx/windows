import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useFileSystem, type FileItem } from "../../context/FileSystemContext";
import { useNexRuntime } from "../../context/NexRuntimeContext";
import { useWindowManager } from "../../context/WindowManager";
import {
  Folder24Regular, Document24Regular, Apps24Regular, Calculator24Regular,
  Code24Regular, Globe24Regular, ShieldCheckmark24Regular, Settings24Regular,
} from "@fluentui/react-icons";

// ── Icon map for .nex launches ─────────────────────────────────────────────
const NEX_ICONS: Record<string, React.ReactNode> = {
  notepad:       <Document24Regular />,
  cmd:           <span style={{ fontFamily: 'Consolas, monospace', fontWeight: 'bold', fontSize: 16 }}>C:\</span>,
  terminal:      <span style={{ fontFamily: 'Consolas, monospace', fontWeight: 'bold', fontSize: 16 }}>C:\</span>,
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

// ── Helpers ────────────────────────────────────────────────────────────────

type Line = { text: string; color?: string };

const Cmd: React.FC = () => {
  const { files, createFolder, createFile, updateFileContent, deleteItem } = useFileSystem();
  const { npmRun, pnpmRun, resolveNex } = useNexRuntime();
  const { openWindow } = useWindowManager();

  const [lines, setLines] = useState<Line[]>([
    { text: "NEX OS Terminal [Version 2.0.1278]" },
    { text: "(c) NEXA Systems. All rights reserved." },
    { text: "" },
  ]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [currentDirId, setCurrentDirId] = useState<string>("c-drive");
  const [isRunning, setIsRunning] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  // ── Virtual path from dir ID ─────────────────────────────────────────────

  const currentPath = useMemo(() => {
    const pathParts: string[] = [];
    let curr: FileItem | undefined = files.find(f => f.id === currentDirId);
    while (curr) {
      if (curr.id === "c-drive") pathParts.unshift("C:");
      else pathParts.unshift(curr.name);
      curr = files.find(f => f.id === curr?.parentId);
    }
    return pathParts.join("\\") + (pathParts.length === 1 ? "\\" : "");
  }, [files, currentDirId]);

  // ── Append output ────────────────────────────────────────────────────────

  const pushLine = useCallback((text: string, color?: string) => {
    setLines(prev => [...prev, { text, color }]);
  }, []);

  const pushLines = useCallback((texts: string[], color?: string) => {
    setLines(prev => [...prev, ...texts.map(text => ({ text, color }))]);
  }, []);

  // ── Helper: find folder by name in current dir ──────────────────────────

  const getFolderByName = (name: string, parentId: string) =>
    files.find(f => f.name.toLowerCase() === name.toLowerCase() && f.type === "folder" && f.parentId === parentId);

  const getItemByName = (name: string, parentId: string) =>
    files.find(f =>
      (f.name.toLowerCase() === name.toLowerCase() ||
        `${f.name}.${f.ext}`.toLowerCase() === name.toLowerCase()) &&
      f.parentId === parentId
    );

  // ── Run async (npm/pnpm) ────────────────────────────────────────────────

  const runAsync = useCallback(async (gen: AsyncGenerator<string>, color?: string) => {
    setIsRunning(true);
    for await (const line of gen) {
      if (line === undefined) continue;
      setLines(prev => [...prev, { text: line, color }]);
      // Let the DOM update
      await new Promise(r => setTimeout(r, 0));
    }
    setLines(prev => [...prev, { text: "" }]);
    setIsRunning(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // ── Main command runner ──────────────────────────────────────────────────

  const runCommand = useCallback(() => {
    if (isRunning) return;
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setLines(prev => [...prev, { text: `${currentPath}>` }]);
      setInput("");
      return;
    }

    const args = trimmedInput.split(" ").filter(Boolean);
    const cmd = args[0].toLowerCase();
    const rest = args.slice(1);
    const output: Line[] = [{ text: `${currentPath}>${input}` }];

    setCmdHistory(prev => [trimmedInput, ...prev]);
    setHistoryPointer(-1);
    setInput("");

    // ── npm ──────────────────────────────────────────────────────────────
    if (cmd === "npm") {
      setLines(prev => [...prev, ...output]);
      runAsync(npmRun(rest, currentPath), "#4ade80");
      return;
    }

    // ── pnpm ─────────────────────────────────────────────────────────────
    if (cmd === "pnpm") {
      setLines(prev => [...prev, ...output]);
      runAsync(pnpmRun(rest, currentPath), "#a78bfa");
      return;
    }

    // ── .nex execution: ./app.nex | app.nex | app ────────────────────────
    const isNexInvocation =
      cmd.endsWith(".nex") ||
      cmd.startsWith(".\\") ||
      cmd.startsWith("./");

    if (isNexInvocation) {
      const exe = resolveNex(cmd);
      if (exe) {
        output.push({ text: `Launching ${exe.title}...`, color: "#60a5fa" });
        setLines(prev => [...prev, ...output, { text: "" }]);
        setTimeout(() => {
          openWindow(exe.appId, exe.appId, exe.title, NEX_ICONS[exe.appId] ?? <Document24Regular />);
        }, 200);
        return;
      } else {
        output.push({ text: `'${cmd}': El ejecutable .nex no fue encontrado.`, color: "#f87171" });
        setLines(prev => [...prev, ...output, { text: "" }]);
        return;
      }
    }

    // ── Standard commands ────────────────────────────────────────────────
    switch (cmd) {
      case "cls":
      case "clear":
        setLines([
          { text: "NEX OS Terminal [Version 2.0.1278]" },
          { text: "(c) NEXA Systems. All rights reserved." },
          { text: "" },
        ]);
        return;

      case "node":
      case "node.exe": {
        if (rest.length === 0 || rest[0] === '--version' || rest[0] === '-v') {
          output.push({ text: rest[0] ? 'v20.15.0' : 'Welcome to Node.js v20.15.0.' });
          if (!rest[0]) {
            output.push({ text: 'Type ".help" for more information.' });
            output.push({ text: '> (NEX OS does not run interactive REPL — use a .js file)' });
          }
        } else {
          output.push({ text: `node: Running ${rest[0]}...`, color: "#4ade80" });
          output.push({ text: `Process exited with code 0`, color: "#9ca3af" });
        }
        break;
      }

      case "dir":
      case "ls": {
        output.push({ text: ` El volumen de la unidad C no tiene etiqueta.` });
        output.push({ text: ` El N\u00famero de serie del volumen es 8A3C-1F9D` });
        output.push({ text: "" });
        output.push({ text: ` Directorio de ${currentPath}` });
        output.push({ text: "" });
        let fileCount = 0, dirCount = 0;
        output.push({ text: `${new Date().toLocaleDateString()}  12:00    <DIR>          .` });
        if (currentDirId !== "c-drive") {
          output.push({ text: `${new Date().toLocaleDateString()}  12:00    <DIR>          ..` });
          dirCount += 2;
        }
        files.filter(f => f.parentId === currentDirId).forEach(f => {
          const isDir = f.type === "folder";
          const sizeStr = isDir ? "          " : (f.size || "0 KB").padStart(10, " ");
          const nameStr = isDir ? f.name : `${f.name}${f.ext ? "." + f.ext : ""}`;
          const color = f.ext === 'nex' ? '#60a5fa' : f.type === 'folder' ? '#fbbf24' : undefined;
          output.push({ text: `${f.modified || new Date().toLocaleDateString()}  12:00    ${isDir ? "<DIR>" : "     "} ${sizeStr} ${nameStr}`, color });
          if (isDir) dirCount++; else fileCount++;
        });
        output.push({ text: `               ${fileCount} archivos` });
        output.push({ text: `               ${dirCount} dirs` });
        break;
      }

      case "cd": {
        if (rest.length === 0) {
          output.push({ text: currentPath });
        } else {
          const target = rest[0];
          if (target === ".." || target === "..\\") {
            const curr = files.find(f => f.id === currentDirId);
            if (curr?.parentId) setCurrentDirId(curr.parentId);
          } else if (target === "\\" || target === "/") {
            setCurrentDirId("c-drive");
          } else {
            const folder = getFolderByName(target, currentDirId);
            if (folder) setCurrentDirId(folder.id);
            else output.push({ text: "El sistema no puede encontrar la ruta especificada.", color: "#f87171" });
          }
        }
        break;
      }

      case "mkdir":
      case "md": {
        if (rest.length < 1) {
          output.push({ text: "La sintaxis del comando no es correcta.", color: "#f87171" });
        } else {
          const folderName = rest.join(" ");
          if (getFolderByName(folderName, currentDirId)) {
            output.push({ text: "Ya existe un subdirectorio o archivo con ese nombre.", color: "#f87171" });
          } else {
            createFolder(currentDirId, folderName);
            output.push({ text: `Directorio creado: ${folderName}`, color: "#4ade80" });
          }
        }
        break;
      }

      case "del":
      case "rm":
      case "rmdir": {
        if (rest.length < 1) {
          output.push({ text: "La sintaxis del comando no es correcta.", color: "#f87171" });
        } else {
          const itemName = rest.join(" ");
          const item = getItemByName(itemName, currentDirId);
          if (item) {
            deleteItem(item.id);
            output.push({ text: `Eliminado: ${itemName}`, color: "#4ade80" });
          } else {
            output.push({ text: `No se pudo encontrar: ${itemName}`, color: "#f87171" });
          }
        }
        break;
      }

      case "touch":
      case "new-item": {
        if (rest.length < 1) {
          output.push({ text: "Especifica el nombre del archivo." });
        } else {
          const parts = rest[0].split(".");
          const name = parts.slice(0, -1).join(".");
          const ext = parts[parts.length - 1];
          createFile(currentDirId, name || rest[0], ext || "txt");
          output.push({ text: `Archivo creado: ${rest[0]}`, color: "#4ade80" });
        }
        break;
      }

      case "echo":
        output.push({ text: rest.join(" ") });
        break;

      case "ping": {
        const host = rest[0] || "127.0.0.1";
        output.push({ text: `Haciendo ping a ${host} con 32 bytes de datos:` });
        output.push({ text: `Respuesta desde ${host}: bytes=32 tiempo<1m TTL=128` });
        output.push({ text: `Respuesta desde ${host}: bytes=32 tiempo<1m TTL=128` });
        output.push({ text: `Respuesta desde ${host}: bytes=32 tiempo=1ms TTL=128` });
        output.push({ text: `Respuesta desde ${host}: bytes=32 tiempo<1m TTL=128` });
        output.push({ text: "" });
        output.push({ text: `Estadísticas de ping para ${host}:` });
        output.push({ text: `    Paquetes: enviados = 4, recibidos = 4, perdidos = 0 (0% perdidos)` });
        break;
      }

      case "ipconfig": {
        output.push({ text: "Configuración IP de Windows" });
        output.push({ text: "" });
        output.push({ text: "Adaptador Ethernet0:" });
        output.push({ text: "" });
        output.push({ text: "   Dirección IPv4. . . . . : 192.168.1.105" });
        output.push({ text: "   Máscara de subred . . . : 255.255.255.0" });
        output.push({ text: "   Puerta de enlace . . . . : 192.168.1.1" });
        break;
      }

      case "systeminfo": {
        output.push({ text: "Nombre del host:           NEX-PC" });
        output.push({ text: "Nombre del SO:             NEX OS 2.0 Pro" });
        output.push({ text: "Versión del SO:            2.0.1278 Compilación 1278" });
        output.push({ text: "Fabricante del SO:         NEXA Systems Inc." });
        output.push({ text: "Memoria física total:      16.384 MB" });
        output.push({ text: "Node.js:                   v20.15.0", color: "#4ade80" });
        output.push({ text: "npm:                       10.8.1",   color: "#4ade80" });
        output.push({ text: "pnpm:                      9.5.0",    color: "#a78bfa" });
        break;
      }

      case "tree": {
        output.push({ text: "C:." });
        const printTree = (parentId: string, prefix = "") => {
          const children = files.filter(f => f.parentId === parentId && f.type === "folder");
          children.forEach((child, index) => {
            const isLast = index === children.length - 1;
            output.push({ text: `${prefix}${isLast ? "└───" : "├───"}${child.name}`, color: child.folderType === 'program_files' ? '#fbbf24' : undefined });
            printTree(child.id, prefix + (isLast ? "    " : "│   "));
          });
        };
        printTree("c-drive");
        break;
      }

      case "date":
        output.push({ text: `La fecha actual es: ${new Date().toLocaleDateString()}` });
        break;

      case "time":
        output.push({ text: `La hora actual es: ${new Date().toLocaleTimeString()}` });
        break;

      case "whoami":
        output.push({ text: "nexos\\" + (localStorage.getItem("win11_userName") || "user").toLowerCase() });
        break;

      case "ver":
        output.push({ text: "NEX OS [Version 2.0.1278]" });
        output.push({ text: "Node.js v20.15.0 | npm 10.8.1 | pnpm 9.5.0", color: "#60a5fa" });
        break;

      case "path": {
        output.push({ text: "C:\\Program Files\\NEX;C:\\Windows\\System32;C:\\Windows" });
        output.push({ text: "C:\\Users\\User\\AppData\\Local\\npm" });
        break;
      }

      case "start": {
        // start <app>
        const appName = rest[0];
        if (appName) {
          const exe = resolveNex(appName);
          if (exe) {
            output.push({ text: `Iniciando ${exe.title}...`, color: "#60a5fa" });
            setTimeout(() => {
              openWindow(exe.appId, exe.appId, exe.title, NEX_ICONS[exe.appId] ?? <Document24Regular />);
            }, 200);
          } else {
            output.push({ text: `No se puede encontrar el archivo especificado.`, color: "#f87171" });
          }
        }
        break;
      }

      case "help": {
        output.push({ text: "Comandos disponibles en NEX OS Terminal:", color: "#60a5fa" });
        output.push({ text: "" });
        output.push({ text: "  CD         Cambia el directorio actual." });
        output.push({ text: "  CLS        Borra la pantalla." });
        output.push({ text: "  DEL        Elimina archivos." });
        output.push({ text: "  DIR        Muestra el contenido del directorio." });
        output.push({ text: "  ECHO       Muestra mensajes." });
        output.push({ text: "  HELP       Muestra esta ayuda." });
        output.push({ text: "  IPCONFIG   Configuración de red." });
        output.push({ text: "  MKDIR      Crea un directorio." });
        output.push({ text: "  NODE       Runtime de Node.js." });
        output.push({ text: "  PATH       Muestra las rutas del sistema." });
        output.push({ text: "  PING       Ping a un host." });
        output.push({ text: "  RMDIR      Elimina un directorio." });
        output.push({ text: "  START      Inicia una aplicación." });
        output.push({ text: "  SYSTEMINFO Info del sistema." });
        output.push({ text: "  TOUCH      Crea un nuevo archivo." });
        output.push({ text: "  TREE       Estructura de directorios." });
        output.push({ text: "  VER        Versión del sistema." });
        output.push({ text: "  WHOAMI     Usuario actual." });
        output.push({ text: "" });
        output.push({ text: "  npm        Gestor de paquetes Node.js", color: "#4ade80" });
        output.push({ text: "  pnpm       Gestor de paquetes rápido", color: "#a78bfa" });
        output.push({ text: "" });
        output.push({ text: "  <app>.nex  Ejecuta un archivo .nex (nativo NEX OS)", color: "#60a5fa" });
        break;
      }

      default: {
        // Try to resolve as a .nex by name (without extension) — like PATH lookup
        const exe = resolveNex(cmd);
        if (exe) {
          output.push({ text: `Launching ${exe.title}...`, color: "#60a5fa" });
          setLines(prev => [...prev, ...output, { text: "" }]);
          setTimeout(() => {
            openWindow(exe.appId, exe.appId, exe.title, NEX_ICONS[exe.appId] ?? <Document24Regular />);
          }, 200);
          return;
        }
        output.push({ text: `'${cmd}' no se reconoce como un comando interno o externo,` });
        output.push({ text: `programa o archivo por lotes ejecutable.` });
        output.push({ text: `Escribe HELP para ver los comandos disponibles.`, color: "#9ca3af" });
      }
    }

    setLines(prev => [...prev, ...output, { text: "" }]);
  }, [input, currentPath, currentDirId, files, isRunning, npmRun, pnpmRun, resolveNex, openWindow, runAsync, createFolder, deleteItem, pushLine]);

  // ── Key handler ──────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyPointer < cmdHistory.length - 1) {
        const newPointer = historyPointer + 1;
        setHistoryPointer(newPointer);
        setInput(cmdHistory[newPointer]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyPointer > 0) {
        const newPointer = historyPointer - 1;
        setHistoryPointer(newPointer);
        setInput(cmdHistory[newPointer]);
      } else {
        setHistoryPointer(-1);
        setInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Basic autocomplete: match files in current dir
      const partial = input.split(" ").pop() ?? "";
      if (!partial) return;
      const match = files.find(f => 
        f.parentId === currentDirId && 
        (f.name.toLowerCase().startsWith(partial.toLowerCase()) || 
         `${f.name}.${f.ext}`.toLowerCase().startsWith(partial.toLowerCase()))
      );
      if (match) {
        const completed = match.ext ? `${match.name}.${match.ext}` : match.name;
        const parts = input.split(" ");
        parts[parts.length - 1] = completed;
        setInput(parts.join(" "));
      }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="cmd-container" onClick={() => inputRef.current?.focus()}>
      <div className="cmd-output" ref={scrollRef}>
        {lines.map((line, idx) => (
          <div
            key={idx}
            className="cmd-line"
            style={line.color ? { color: line.color } : undefined}
          >
            {line.text}
          </div>
        ))}
        <div className="cmd-input-row">
          <span className="cmd-prompt">{currentPath}&gt;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="cmd-input"
            spellCheck={false}
            autoComplete="off"
            disabled={isRunning}
            placeholder={isRunning ? "Procesando..." : ""}
          />
          {isRunning && <span className="cmd-running-indicator">⏳</span>}
        </div>
      </div>

      <style>{`
        .cmd-container {
          height: 100%;
          background: #0c0c0c;
          color: #cccccc;
          font-family: 'Consolas', 'Courier New', monospace;
          padding: 8px;
          display: flex;
          flex-direction: column;
        }
        .cmd-output {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
        }
        .cmd-output::-webkit-scrollbar { width: 12px; }
        .cmd-output::-webkit-scrollbar-track { background: #0c0c0c; }
        .cmd-output::-webkit-scrollbar-thumb { background: #333; border: 2px solid #0c0c0c; }
        .cmd-line {
          white-space: pre-wrap;
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 1px;
        }
        .cmd-input-row {
          display: flex;
          align-items: center;
          width: 100%;
          gap: 4px;
        }
        .cmd-prompt {
          white-space: nowrap;
          margin-right: 8px;
          font-size: 13px;
          color: #e5e7eb;
        }
        .cmd-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 13px;
          font-family: inherit;
          caret-shape: block;
        }
        .cmd-input:disabled {
          opacity: 0.5;
        }
        .cmd-input::placeholder {
          color: #555;
          font-style: italic;
        }
        .cmd-running-indicator {
          font-size: 12px;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default Cmd;
