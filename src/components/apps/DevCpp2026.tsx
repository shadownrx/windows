import React, { useState, useRef, useEffect } from 'react';
import { 
  Play24Filled, 
  Wrench24Filled, 
  ArrowClockwise24Filled, 
  Bug24Filled,
  Search24Regular,
  Folder24Filled,
  Document24Regular,
  MoreHorizontal24Regular,
  Settings24Regular,
  ChevronRight24Regular,
  WindowConsoleRegular,
  Circle24Filled,
} from '@fluentui/react-icons';

interface File {
  name: string;
  language: string;
  content: string;
}

const DEV_CPP_FILES: Record<string, File> = {
  'main.cpp': {
    name: 'main.cpp',
    language: 'cpp',
    content: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    vector<string> greets = {"Hello", "from", "Dev-C++", "2026"};
    
    cout << "========================================" << endl;
    cout << "   Welcome to the Future of C++ Dev" << endl;
    cout << "========================================" << endl;

    for (const auto& word : greets) {
        cout << word << " ";
    }
    cout << endl;

    return 0;
}`
  },
  'matrix.h': {
    name: 'matrix.h',
    language: 'cpp',
    content: `#ifndef MATRIX_H
#define MATRIX_H

#include <vector>

class Matrix {
public:
    Matrix(int r, int c) : rows(r), cols(c), data(r, std::vector<double>(c, 0.0)) {}
    
    void set(int r, int c, double val) {
        data[r][c] = val;
    }

private:
    int rows, cols;
    std::vector<std::vector<double>> data;
};

#endif`
  },
  'Makefile': {
    name: 'Makefile',
    language: 'makefile',
    content: `all: main

main: main.cpp
	g++ -O3 main.cpp -o main

clean:
	rm -f main`
  }
};

const CPP_COLORS: Record<string, string> = {
  pp: '#c586c0', // preprocessor
  keyword: '#569cd6',
  string: '#ce9178',
  comment: '#6a9955',
  type: '#4ec9b0',
  function: '#dcdcaa',
  number: '#b5cea8'
};

function tokenizeCpp(code: string): React.ReactNode[] {
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

    // Comments
    highlighted = highlighted.replace(/(\/\/.*)/g, (m) => stash(`<span style="color:${CPP_COLORS.comment}">${m}</span>`));
    
    // Strings
    highlighted = highlighted.replace(/(['"`])((?:[^\\]|\\.)*?)\1/g, (m) => stash(`<span style="color:${CPP_COLORS.string}">${m}</span>`));
    
    // Preprocessor
    highlighted = highlighted.replace(/(#\s*\w+)/g, (m) => stash(`<span style="color:${CPP_COLORS.pp}">${m}</span>`));
    
    // Numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, (m) => stash(`<span style="color:${CPP_COLORS.number}">${m}</span>`));
    
    // Keywords
    highlighted = highlighted.replace(/\b(int|float|double|char|bool|void|unsigned|signed|long|short|class|struct|union|enum|public|private|protected|virtual|static|const|extern|volatile|mutable|template|typename|using|namespace|inline|if|else|for|while|do|switch|case|default|break|continue|return|goto|try|catch|throw|new|delete|sizeof|typeid|dynamic_cast|static_cast|reinterpret_cast|const_cast|true|false|this|auto|decltype|noexcept|nullptr|constexpr|std|cout|cin|endl|vector|string)\b/g, (m) => {
        let color = CPP_COLORS.keyword;
        if (['int', 'float', 'double', 'char', 'bool', 'void', 'vector', 'string'].includes(m)) color = CPP_COLORS.type;
        return stash(`<span style="color:${color}">${m}</span>`);
    });

    // Re-insert tokens
    for (let j = tokenCounter - 1; j >= 0; j--) {
      highlighted = highlighted.replace(`___TK${j}___`, tokenMap[`___TK${j}___`]);
    }

    return (
      <div key={i} className="devcpp-line">
        <span className="devcpp-ln">{i + 1}</span>
        <span dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />
      </div>
    );
  });
}

const DevCpp2026: React.FC = () => {
  const [activeFile, setActiveFile] = useState('main.cpp');
  const [isCompiling, setIsCompiling] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'Dev-C++ 2026 Compiler Service v1.0.4 - Ready',
    'Root workspace: C:\\Users\\User\\Project',
  ]);
  const [status, setStatus] = useState('Listo');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const termRef = useRef<HTMLDivElement>(null);
  const file = DEV_CPP_FILES[activeFile];

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const handleCompile = () => {
    setIsCompiling(true);
    setStatus('Compilando...');
    setTerminalLines(prev => [...prev, `[${new Date().toLocaleTimeString()}] g++ -O3 ${activeFile} -o main.exe`]);
    
    setTimeout(() => {
      setIsCompiling(false);
      setStatus('Compilación finalizada con éxito');
      setTerminalLines(prev => [...prev, 'Compilation finished successfully in 452ms.', 'Output written to main.exe']);
    }, 1500);
  };

  const handleRun = () => {
    setStatus('Ejecutando...');
    setTerminalLines(prev => [...prev, '❯ Running main.exe...']);
    
    setTimeout(() => {
      const output = [
        '========================================',
        '   Welcome to the Future of C++ Dev',
        '========================================',
        'Hello from Dev-C++ 2026 ',
        '',
        'Process exited with return value 0'
      ];
      setTerminalLines(prev => [...prev, ...output]);
      setStatus('Listo');
    }, 500);
  };

  return (
    <div className="devcpp-container">
      {/* Header bar */}
      <div className="devcpp-header">
        <div className="devcpp-title-group">
          <div className="devcpp-app-icon">
            <Play24Filled primaryFill="#3b82f6" style={{ transform: 'rotate(-45deg)', fontSize: 14 }} />
          </div>
          <span className="devcpp-title">Dev-C++ 2026 Professional</span>
        </div>
        
        <div className="devcpp-toolbar">
          <button className="dev-tool-btn" title="Compilar (F9)" onClick={handleCompile} disabled={isCompiling}>
            <Wrench24Filled primaryFill={isCompiling ? "#4a5568" : "#fbbf24"} />
          </button>
          <button className="dev-tool-btn" title="Ejecutar (F10)" onClick={handleRun}>
            <Play24Filled primaryFill="#10b981" />
          </button>
          <button className="dev-tool-btn" title="Compilar y Ejecutar (F11)" onClick={() => { handleCompile(); setTimeout(handleRun, 1600); }}>
             <div style={{ position: 'relative' }}>
                <Wrench24Filled primaryFill="#3b82f6" />
                <Play24Filled primaryFill="#10b981" style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 12, border: '2px solid #0f172a', borderRadius: '50%' }} />
             </div>
          </button>
          <div className="devcpp-divider" />
          <button className="dev-tool-btn" title="Reconstruir todo">
            <ArrowClockwise24Filled primaryFill="#6366f1" />
          </button>
          <button className="dev-tool-btn" title="Depurar">
            <Bug24Filled primaryFill="#f43f5e" />
          </button>
        </div>

        <div className="devcpp-header-right">
            <Search24Regular />
            <Settings24Regular />
        </div>
      </div>

      <div className="devcpp-content">
        {/* Project Sidebar */}
        {sidebarOpen && (
          <div className="devcpp-sidebar">
            <div className="sidebar-header">
              <span>EXPLORADOR DE PROYECTO</span>
              <MoreHorizontal24Regular style={{ cursor: 'pointer' }} />
            </div>
            
            <div className="sidebar-section">
              <div className="folder-item">
                <ChevronRight24Regular style={{ transform: 'rotate(90deg)', fontSize: 14 }} />
                <Folder24Filled primaryFill="#fbbf24" style={{ fontSize: 16 }} />
                <span>MyProject</span>
              </div>
              
              <div className="file-list">
                {Object.keys(DEV_CPP_FILES).map(name => (
                  <div 
                    key={name} 
                    className={`file-item ${activeFile === name ? 'active' : ''}`}
                    onClick={() => setActiveFile(name)}
                  >
                    <Document24Regular primaryFill={name.endsWith('.cpp') || name.endsWith('.h') ? '#3b82f6' : '#94a3b8'} style={{ fontSize: 16 }} />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar-ad">
                <div className="ad-content">
                    <Bug24Filled primaryFill="#3b82f6" style={{ fontSize: 24, marginBottom: 8 }} />
                    <p>AI Debugger enabled</p>
                    <button>Review issues</button>
                </div>
            </div>
          </div>
        )}

        {/* Main Editor Area */}
        <div className="devcpp-main">
          <div className="editor-tabs">
             {Object.keys(DEV_CPP_FILES).map(name => (
               <div key={name} className={`editor-tab ${activeFile === name ? 'active' : ''}`} onClick={() => setActiveFile(name)}>
                 <span>{name}</span>
                 {activeFile === name && <div className="tab-indicator" />}
               </div>
             ))}
          </div>

          <div className="editor-body">
            {tokenizeCpp(file.content)}
          </div>

          {/* Bottom Panel (Terminal) */}
          <div className="devcpp-bottom">
            <div className="bottom-tabs">
                <div className="bottom-tab active">
                    <WindowConsoleRegular style={{ fontSize: 14 }} />
                    <span>Compilación / Salida</span>
                </div>
                <div className="bottom-tab">
                    <Bug24Filled style={{ fontSize: 14 }} />
                    <span>Depuración</span>
                </div>
            </div>
            <div className="bottom-content" ref={termRef}>
               {terminalLines.map((line, idx) => (
                 <div key={idx} className="terminal-line">{line}</div>
               ))}
               {isCompiling && (
                 <div className="compiling-loader">
                    <div className="spinner" />
                    <span>Linker is working...</span>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="devcpp-status">
        <div className="status-left">
          <div className="status-indicator">
             <Circle24Filled primaryFill={status === 'Listo' ? '#10b981' : '#fbbf24'} style={{ fontSize: 8 }} />
             <span>{status}</span>
          </div>
          <div className="status-sep" />
          <span>Línea: 1, Col: 1</span>
        </div>
        <div className="status-right">
          <span>UTF-8</span>
          <div className="status-sep" />
          <span>C++ 20 (GCC)</span>
          <div className="status-sep" />
          <span>Windows 11 x64</span>
        </div>
      </div>

      <style>{`
        .devcpp-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(25px);
          color: #e2e8f0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .devcpp-header {
          height: 48px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          background: rgba(30, 41, 59, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          justify-content: space-between;
        }

        .devcpp-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .devcpp-app-icon {
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .devcpp-title {
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.3px;
        }

        .devcpp-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 8px;
          border-radius: 10px;
          margin: 0 20px;
        }

        .dev-tool-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dev-tool-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .dev-tool-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .dev-tool-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .devcpp-divider {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 6px;
        }

        .devcpp-header-right {
            display: flex;
            align-items: center;
            gap: 16px;
            color: #94a3b8;
        }

        .devcpp-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .devcpp-sidebar {
          width: 240px;
          background: rgba(15, 23, 42, 0.4);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 12px 16px;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 1px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .folder-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
        }

        .file-list {
          padding-left: 20px;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 16px;
          font-size: 12px;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 6px 0 0 6px;
          margin-bottom: 2px;
        }

        .file-item:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #e2e8f0;
        }

        .file-item.active {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border-right: 2px solid #3b82f6;
        }

        .sidebar-ad {
            margin-top: auto;
            padding: 16px;
        }

        .ad-content {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.2));
            padding: 16px;
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.2);
            text-align: center;
        }

        .ad-content p {
            font-size: 11px;
            font-weight: 600;
            margin: 0 0 12px 0;
        }

        .ad-content button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
        }

        .devcpp-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .editor-tabs {
          height: 36px;
          display: flex;
          background: rgba(30, 41, 59, 0.5);
          gap: 2px;
          padding: 0 8px;
        }

        .editor-tab {
          display: flex;
          align-items: center;
          padding: 0 16px;
          font-size: 12px;
          color: #94a3b8;
          cursor: pointer;
          position: relative;
        }

        .editor-tab.active {
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }

        .tab-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #3b82f6;
        }

        .editor-body {
          flex: 1;
          padding: 20px;
          font-family: 'Cascadia Code', 'Consolas', monospace;
          font-size: 14px;
          line-height: 1.6;
          overflow: auto;
          background: rgba(15, 23, 42, 0.6);
        }

        .devcpp-line {
          display: flex;
          gap: 24px;
        }

        .devcpp-ln {
          width: 32px;
          text-align: right;
          color: #475569;
          user-select: none;
        }

        .devcpp-bottom {
          height: 180px;
          display: flex;
          flex-direction: column;
          background: #020617;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .bottom-tabs {
            display: flex;
            height: 32px;
            background: #0f172a;
            padding: 0 16px;
        }

        .bottom-tab {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 16px;
            font-size: 11px;
            color: #64748b;
            cursor: pointer;
        }

        .bottom-tab.active {
            color: #e2e8f0;
            border-bottom: 2px solid #3b82f6;
        }

        .bottom-content {
          flex: 1;
          padding: 12px 16px;
          font-family: 'Consolas', monospace;
          font-size: 12px;
          overflow-y: auto;
          color: #cbd5e1;
        }

        .terminal-line {
          margin-bottom: 4px;
        }

        .compiling-loader {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 12px;
            color: #fbbf24;
        }

        .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid rgba(251, 191, 36, 0.3);
            border-top-color: #fbbf24;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .devcpp-status {
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          background: #3b82f6;
          color: white;
          font-size: 11px;
        }

        .status-left, .status-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .status-sep {
          width: 1px;
          height: 14px;
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default DevCpp2026;
