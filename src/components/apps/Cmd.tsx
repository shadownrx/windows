import React, { useEffect, useRef, useState } from 'react';

const Cmd: React.FC = () => {
  const [lines, setLines] = useState<string[]>([
    'Microsoft Windows [Version 10.0.19044.3086]',
    '(c) Microsoft Corporation. All rights reserved.',
    '',
  ]);
  const [input, setInput] = useState('');
  const [path, setPath] = useState('C:\\Users\\User');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runCommand = () => {
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    const output: string[] = [];

    if (cmd === 'cls' || cmd === 'clear') {
      setLines([`Microsoft Windows [Version 10.0.19044.3086]`, '(c) Microsoft Corporation. All rights reserved.', '', '']);
      setInput('');
      return;
    }

    output.push(`${path}> ${input}`);

    if (cmd === 'dir') {
      output.push(' Volume in drive C has no label.');
      output.push(' Volume Serial Number is XXXX-XXXX');
      output.push('');
      output.push(' Directory of ' + path);
      output.push('04/01/2026  10:00 AM    <DIR>          .');
      output.push('04/01/2026  10:00 AM    <DIR>          ..');
      output.push('03/27/2026  02:15 PM               123 README.txt');
      output.push('03/26/2026  09:05 PM    <DIR>          Projects');
      output.push('               1 File(s)            123 bytes');
      output.push('               3 Dir(s)  245,024,123,456 bytes free');
    } else if (cmd === 'echo hello' || cmd.startsWith('echo')) {
      output.push(input.substring(5));
    } else if (cmd === 'help') {
      output.push('Supported commands: cls, clear, dir, echo, help, date, time, exit');
    } else if (cmd === 'date') {
      output.push(new Date().toLocaleDateString());
    } else if (cmd === 'time') {
      output.push(new Date().toLocaleTimeString());
    } else if (cmd === 'exit') {
      output.push('Use the window close button to exit.');
    } else {
      output.push(`'${input}' is not recognized as an internal or external command,`);
      output.push('operable program or batch file.');
    }

    setLines((prev) => [...prev, ...output, '']);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand();
    }
  };

  return (
    <div className="cmd-container" onClick={() => inputRef.current?.focus()}>
      <div className="cmd-output">
        {lines.map((line, idx) => (
          <div key={idx} className="cmd-line">{line}</div>
        ))}
      </div>
      <div className="cmd-input-row">
        <span className="cmd-prompt">{path}&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="cmd-input"
          spellCheck={false}
        />
      </div>

      <style>{`
        .cmd-container {
          height: 100%;
          background: #010a17;
          color: #f5f5f5;
          font-family: 'Consolas', 'Courier New', monospace;
          padding: 12px;
          display: flex;
          flex-direction: column;
        }
        .cmd-output {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 8px;
        }
        .cmd-line {
          white-space: pre-wrap;
          font-size: 13px;
        }
        .cmd-input-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cmd-prompt {
          color: #64b5f6;
        }
        .cmd-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 13px;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};

export default Cmd;
