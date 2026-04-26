import React, { useEffect, useRef, useState, useMemo } from "react";
import { useFileSystem, type FileItem } from "../../context/FileSystemContext";

const Cmd: React.FC = () => {
  const { files, createFolder, deleteItem } = useFileSystem();
  const [lines, setLines] = useState<string[]>([
    "NEX OS Terminal [Version 2.0.1278]",
    "(c) NEXA Systems. All rights reserved.",
    "",
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [currentDirId, setCurrentDirId] = useState<string>('c-drive');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const currentPath = useMemo(() => {
    const pathParts = [];
    let curr: FileItem | undefined = files.find(f => f.id === currentDirId);
    while (curr) {
      if (curr.id === 'c-drive') {
        pathParts.unshift("C:");
      } else {
        pathParts.unshift(curr.name);
      }
      curr = files.find(f => f.id === curr?.parentId);
    }
    return pathParts.join("\\") + (pathParts.length === 1 ? "\\" : "");
  }, [files, currentDirId]);

  const runCommand = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setLines((prev) => [...prev, `${currentPath}>`]);
      return;
    }

    const args = trimmedInput.split(" ").filter(Boolean);
    const cmd = args[0].toLowerCase();
    const output: string[] = [`${currentPath}>${input}`];

    setHistory((prev) => [trimmedInput, ...prev]);
    setHistoryPointer(-1);

    const getFolderByName = (name: string, parentId: string) => {
      return files.find(f => f.name.toLowerCase() === name.toLowerCase() && f.type === 'folder' && f.parentId === parentId);
    };

    const getItemByName = (name: string, parentId: string) => {
      return files.find(f => (f.name.toLowerCase() === name.toLowerCase() || `${f.name}.${f.ext}`.toLowerCase() === name.toLowerCase()) && f.parentId === parentId);
    };

    switch (cmd) {
      case "cls":
      case "clear":
        setLines([
          "NEX OS Terminal [Version 2.0.1278]",
          "(c) NEXA Systems. All rights reserved.",
          "",
        ]);
        setInput("");
        return;
      case "dir":
      case "ls":
        output.push(` El volumen de la unidad C no tiene etiqueta.`);
        output.push(` El Número de serie del volumen es 8A3C-1F9D`);
        output.push("");
        output.push(` Directorio de ${currentPath}`);
        output.push("");
        let fileCount = 0;
        let dirCount = 0;
        let totalSize = 0;
        
        // Agregar . y ..
        output.push(`${new Date().toLocaleDateString()}  12:00    <DIR>          .`);
        if (currentDirId !== 'c-drive') {
          output.push(`${new Date().toLocaleDateString()}  12:00    <DIR>          ..`);
          dirCount += 2;
        }

        files.filter(f => f.parentId === currentDirId).forEach(f => {
          const isDir = f.type === 'folder';
          const sizeStr = isDir ? '          ' : (f.size || '0 KB').padStart(10, ' ');
          const nameStr = isDir ? f.name : `${f.name}${f.ext ? '.'+f.ext : ''}`;
          output.push(`${f.modified || new Date().toLocaleDateString()}  12:00    ${isDir ? '<DIR>' : '     '} ${sizeStr} ${nameStr}`);
          if (isDir) dirCount++;
          else fileCount++;
        });
        output.push(`               ${fileCount} archivos`);
        output.push(`               ${dirCount} dirs`);
        break;
      case "cd":
        if (args.length === 1) {
          output.push(currentPath);
        } else {
          const target = args[1];
          if (target === "..") {
            const curr = files.find(f => f.id === currentDirId);
            if (curr && curr.parentId) {
              setCurrentDirId(curr.parentId);
            }
          } else if (target === "\\" || target === "/") {
            setCurrentDirId('c-drive');
          } else {
            const folder = getFolderByName(target, currentDirId);
            if (folder) {
              setCurrentDirId(folder.id);
            } else {
              output.push("El sistema no puede encontrar la ruta especificada.");
            }
          }
        }
        break;
      case "mkdir":
      case "md":
        if (args.length < 2) {
          output.push("La sintaxis del comando no es correcta.");
        } else {
          const folderName = args.slice(1).join(" ");
          if (getFolderByName(folderName, currentDirId)) {
            output.push("Ya existe un subdirectorio o archivo con ese nombre.");
          } else {
            createFolder(currentDirId, folderName);
          }
        }
        break;
      case "del":
      case "rm":
      case "rmdir":
        if (args.length < 2) {
          output.push("La sintaxis del comando no es correcta.");
        } else {
          const itemName = args.slice(1).join(" ");
          const item = getItemByName(itemName, currentDirId);
          if (item) {
            deleteItem(item.id);
          } else {
            output.push(`No se pudo encontrar C:\\...\\${itemName}`);
          }
        }
        break;
      case "echo":
        output.push(args.slice(1).join(" "));
        break;
      case "help":
        output.push("Comandos disponibles en NEX OS Terminal:");
        output.push("  CD         Muestra el nombre del directorio actual o cambia a otro.");
        output.push("  CLS        Borra la pantalla.");
        output.push("  DEL        Elimina uno o más archivos.");
        output.push("  DIR        Muestra una lista de archivos y subdirectorios en un directorio.");
        output.push("  ECHO       Muestra mensajes.");
        output.push("  HELP       Proporciona información de ayuda para los comandos de Windows.");
        output.push("  IPCONFIG   Muestra la configuración IP de Windows.");
        output.push("  MKDIR (MD) Crea un directorio.");
        output.push("  PING       Hace ping a un host.");
        output.push("  RMDIR      Quita (elimina) un directorio.");
        output.push("  SYSTEMINFO Muestra las propiedades y la configuración específicas del equipo.");
        output.push("  TREE       Muestra de forma gráfica la estructura de directorios.");
        output.push("  DATE       Muestra la fecha actual.");
        output.push("  TIME       Muestra la hora actual.");
        output.push("  VER        Muestra la versión de Windows.");
        output.push("  WHOAMI     Muestra el nombre de usuario actual.");
        break;
      case "ping":
        const host = args[1] || "127.0.0.1";
        output.push(`Haciendo ping a ${host} con 32 bytes de datos:`);
        output.push(`Respuesta desde ${host}: bytes=32 tiempo<1m TTL=128`);
        output.push(`Respuesta desde ${host}: bytes=32 tiempo<1m TTL=128`);
        output.push(`Respuesta desde ${host}: bytes=32 tiempo=1ms TTL=128`);
        output.push(`Respuesta desde ${host}: bytes=32 tiempo<1m TTL=128`);
        output.push("");
        output.push(`Estadísticas de ping para ${host}:`);
        output.push(`    Paquetes: enviados = 4, recibidos = 4, perdidos = 0`);
        output.push(`    (0% perdidos),`);
        break;
      case "ipconfig":
        output.push("Configuración IP de Windows");
        output.push("");
        output.push("Adaptador de Ethernet Ethernet0:");
        output.push("");
        output.push("   Sufijo DNS específico para la conexión. . : localdomain");
        output.push("   Vínculo: dirección IPv6 local. . . : fe80::a1b2:c3d4:e5f6:7890%12");
        output.push("   Dirección IPv4. . . . . . . . . . . . . . : 192.168.1.105");
        output.push("   Máscara de subred . . . . . . . . . . . . : 255.255.255.0");
        output.push("   Puerta de enlace predeterminada . . . . . : 192.168.1.1");
        break;
      case "tree":
        output.push(`Listado de rutas de carpetas`);
        output.push(`El número de serie del volumen es 8A3C-1F9D`);
        output.push(`C:.`);
        const printTree = (parentId: string, prefix: string = "") => {
          const children = files.filter(f => f.parentId === parentId && f.type === 'folder');
          children.forEach((child, index) => {
            const isLast = index === children.length - 1;
            output.push(`${prefix}${isLast ? '└───' : '├───'}${child.name}`);
            printTree(child.id, prefix + (isLast ? '    ' : '│   '));
          });
        };
        printTree('c-drive');
        break;
      case "date":
        output.push(`La fecha actual es: ${new Date().toLocaleDateString()}`);
        break;
      case "time":
        output.push(`La hora actual es: ${new Date().toLocaleTimeString()}`);
        break;
      case "whoami":
        output.push("nexos\\" + (localStorage.getItem('win11_userName') || 'user').toLowerCase());
        break;
      case "ver":
        output.push("NEX OS [Version 2.0.1278]");
        break;
      case "systeminfo":
        output.push("Nombre del host:           NEX-PC");
        output.push("Nombre del SO:             NEX OS 2.0 Pro");
        output.push("Versión del SO:            2.0.1278 N/A Compilación 1278");
        output.push("Fabricante del SO:         NEXA Systems Inc.");
        output.push("Configuración del SO:      Estación de trabajo independiente");
        output.push("Tipo de compilación del SO: Multiprocessor Free");
        output.push("Procesador(es):            1 procesador(es) instalado(s).");
        output.push("                           [01]: Intel64 Family 6 Model 183 Stepping 1");
        output.push("Memoria física total:      16.384 MB");
        break;
      default:
        output.push(
          `'${cmd}' no se reconoce como un comando interno o externo,`,
        );
        output.push("programa o archivo por lotes ejecutable.");
    }

    setLines((prev) => [...prev, ...output, ""]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyPointer < history.length - 1) {
        const newPointer = historyPointer + 1;
        setHistoryPointer(newPointer);
        setInput(history[newPointer]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyPointer > 0) {
        const newPointer = historyPointer - 1;
        setHistoryPointer(newPointer);
        setInput(history[newPointer]);
      } else {
        setHistoryPointer(-1);
        setInput("");
      }
    }
  };

  return (
    <div className="cmd-container" onClick={() => inputRef.current?.focus()}>
      <div className="cmd-output" ref={scrollRef}>
        {lines.map((line, idx) => (
          <div key={idx} className="cmd-line">
            {line}
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
          />
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
        /* Custom scrollbar para que parezca Windows */
        .cmd-output::-webkit-scrollbar { width: 12px; }
        .cmd-output::-webkit-scrollbar-track { background: #0c0c0c; }
        .cmd-output::-webkit-scrollbar-thumb { background: #333; border: 2px solid #0c0c0c; }
        
        .cmd-line {
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        .cmd-input-row {
          display: flex;
          align-items: center;
          width: 100%;
        }
        .cmd-prompt {
          white-space: nowrap;
          margin-right: 8px;
          font-size: 14px;
        }
        .cmd-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          caret-shape: block;
        }
      `}</style>
    </div>
  );
};

export default Cmd;
