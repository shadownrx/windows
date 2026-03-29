import React, { useEffect, useRef, useState } from "react";

const Cmd: React.FC = () => {
  const [lines, setLines] = useState<string[]>([
    "Microsoft Windows [Version 10.0.19044.3086]",
    "(c) Microsoft Corporation. All rights reserved.",
    "",
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [path, setPath] = useState("C:\\Users\\User");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-focus y Auto-scroll
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const runCommand = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setLines((prev) => [...prev, `${path}>`]);
      return;
    }

    const args = trimmedInput.split(" ");
    const cmd = args[0].toLowerCase();
    const output: string[] = [`${path}> ${input}`];

    // Guardar en historial
    setHistory((prev) => [trimmedInput, ...prev]);
    setHistoryPointer(-1);

    switch (cmd) {
      case "cls":
      case "clear":
        setLines([
          "Microsoft Windows [Version 10.0.19044.3086]",
          "(c) Microsoft Corporation. All rights reserved.",
          "",
          "",
        ]);
        setInput("");
        return;
      case "dir":
        output.push(" Volume in drive C has no label.");
        output.push(" Volume Serial Number is XXXX-XXXX");
        output.push("");
        output.push(" Directory of " + path);
        output.push("04/01/2026  10:00 AM    <DIR>          .");
        output.push("04/01/2026  10:00 AM    <DIR>          ..");
        output.push("03/27/2026  02:15 PM               123 README.txt");
        output.push("03/28/2026  08:19 PM    <DIR>          Souls_Project"); // Basado en tu proyecto actual
        output.push("               1 File(s)            123 bytes");
        output.push("               3 Dir(s)  245,024,123,456 bytes free");
        break;
      case "echo":
        output.push(args.slice(1).join(" "));
        break;
      case "help":
        output.push(
          "Comandos disponibles: cls, dir, echo, help, date, time, whoami, next, ipconfig",
        );
        break;
      case "date":
        output.push(new Date().toLocaleDateString());
        break;
      case "time":
        output.push(new Date().toLocaleTimeString());
        break;
      case "whoami":
        output.push("bienvenido");
        break;
      case "next":
        output.push("next OS - Next Generation Systems");
        output.push("Status: Active Development");
        break;
      case "ipconfig":
        output.push("Configuracion IP de Windows");
        output.push("");
        output.push("Adaptador de Ethernet Ethernet:");
        output.push(
          "   Sufijo DNS especifico para la conexion. . : nex.com",
        );
        output.push(
          "   Vinculo: direccion IPv6 local. . . : fe80::d41a:112a:ef64:1024%12",
        );
        output.push(
          "   Direccion IPv4. . . . . . . . . . . . . . : 192.168.100.42",
        );
        output.push(
          "   Mascara de subred . . . . . . . . . . . . : 255.255.255.0",
        );
        output.push(
          "   Puerta de enlace predeterminada . . . . . : 192.168.100.1",
        );
        output.push("");
        output.push("Adaptador de LAN inalambrica Wi-Fi:");
        output.push("   Sufijo DNS especifico para la conexion. . : nex.lan");
        output.push(
          "   Direccion IPv6 . . . . . . . . . . : 2801:4d2:1100:cafe:dead:beef:1234:5678",
        );
        output.push(
          "   Vinculo: direccion IPv6 local. . . : fe80::5cb1:d180:49ef%3",
        );
        output.push("   Direccion IPv4. . . . . . . . . . . . . . : 10.0.0.15");
        output.push(
          "   Mascara de subred . . . . . . . . . . . . : 255.255.255.0",
        );
        output.push("   Puerta de enlace predeterminada . . . . . : 10.0.0.1");
        break;
      default:
        output.push(
          `'${cmd}' is not recognized as an internal or external command,`,
        );
        output.push("operable program or batch file.");
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
          <span className="cmd-prompt">{path}&gt;</span>
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
        }
        .cmd-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 14px;
          font-family: inherit;
          caret-shape: block; /* Efecto de cursor de bloque */
        }
      `}</style>
    </div>
  );
};

export default Cmd;
