import React, { useState, useRef, useEffect } from 'react';
import { useFileSystem } from '../../context/FileSystemContext';
import { useSettings } from '../../context/SettingsContext';

const Terminal: React.FC = () => {
  const { files } = useFileSystem();
  const { userName } = useSettings();
  const [history, setHistory] = useState<{ type: 'input' | 'output', text: string }[]>([
    { type: 'output', text: 'NEX OS Terminal [Versión 2.0.1278]' },
    { type: 'output', text: '(c) NEXA Systems. Todos los derechos reservados.' },
    { type: 'output', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState('C:\\Users\\' + userName);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    setHistory(prev => [...prev, { type: 'input', text: `${currentPath}> ${cmd}` }]);

    let output = '';
    switch (command) {
      case 'help':
        output = 'Comandos disponibles: HELP, CLS, DIR, DATE, TIME, ECHO, WHOAMI, VER, EXIT';
        break;
      case 'cls':
        setHistory([]);
        return;
      case 'dir':
        output = ' Directorio de ' + currentPath + '\n\n';
        const currentFolder = files.find(f => f.name === currentPath.split('\\').pop());
        const visibleFiles = files.filter(f => f.parentId === (currentFolder?.id || 'c-drive'));
        visibleFiles.forEach(f => {
          output += `${f.modified}    ${f.type === 'folder' ? '<DIR>' : '     '}    ${f.name}${f.ext ? '.' + f.ext : ''}\n`;
        });
        output += `\n               ${visibleFiles.length} archivos`;
        break;
      case 'date':
        output = 'La fecha actual es: ' + new Date().toLocaleDateString();
        break;
      case 'time':
        output = 'La hora actual es: ' + new Date().toLocaleTimeString();
        break;
      case 'whoami':
        output = 'nexos\\' + userName.toLowerCase();
        break;
      case 'ver':
        output = 'NEX OS [Versión 2.0.1278]';
        break;
      case 'echo':
        output = args.join(' ');
        break;
      case '':
        return;
      default:
        output = `'${command}' no se reconoce como un comando interno o externo, programa o archivo por lotes ejecutable.`;
    }

    if (output) {
      setHistory(prev => [...prev, { type: 'output', text: output }]);
    }
  };

  return (
    <div className="terminal-root" onClick={() => document.getElementById('term-input')?.focus()}>
      <div className="terminal-scroll" ref={scrollRef}>
        {history.map((line, i) => (
          <div key={i} className={`terminal-line ${line.type}`}>
            {line.text}
          </div>
        ))}
        <div className="terminal-input-line">
          <span className="terminal-prompt">{currentPath}&gt;</span>
          <input
            id="term-input"
            type="text"
            className="terminal-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommand(input);
                setInput('');
              }
            }}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>

      <style>{`
        .terminal-root {
          background: #0c0c0c;
          color: #cccccc;
          font-family: 'Consolas', 'Lucida Console', monospace;
          height: 100%;
          padding: 10px;
          font-size: 14px;
          overflow: hidden;
          cursor: text;
        }
        .terminal-scroll {
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .terminal-line {
          white-space: pre-wrap;
          margin-bottom: 2px;
        }
        .terminal-line.input { color: white; }
        .terminal-line.output { color: #aaaaaa; }
        .terminal-input-line {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .terminal-prompt { color: white; }
        .terminal-field {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          outline: none;
          font-family: inherit;
          font-size: inherit;
        }
        .terminal-scroll::-webkit-scrollbar { width: 10px; }
        .terminal-scroll::-webkit-scrollbar-thumb { background: #333; }
        .terminal-scroll::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </div>
  );
};

export default Terminal;
