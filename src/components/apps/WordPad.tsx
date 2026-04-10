import React, { useState } from 'react';
import {
  Save24Regular,
  Open24Regular,
  Print24Regular,
  TextBold24Regular,
  TextItalic24Regular,
  TextUnderline24Regular,
  TextAlignLeft24Regular,
  TextAlignCenter24Regular,
  TextAlignRight24Regular,
  ChevronDown20Regular,
} from '@fluentui/react-icons';

const WordPad: React.FC = () => {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');

  const handleSave = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', 'document.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleOpen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'text/plain';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        setText(event.target.result);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=400,width=600');
    if (printWindow) {
      printWindow.document.write(`
        <pre style="font-family: ${fontFamily}; font-size: ${fontSize}px; 
                    font-weight: ${isBold ? 'bold' : 'normal'};
                    font-style: ${isItalic ? 'italic' : 'normal'};
                    text-decoration: ${isUnderline ? 'underline' : 'none'};
                    text-align: ${alignment};">
          ${text}
        </pre>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Menu Bar */}
      <div className="bg-gradient-to-b from-gray-100 to-gray-50 border-b border-gray-300 p-3">
        <div className="flex gap-1 flex-wrap mb-3">
          {/* File Operations */}
          <button
            onClick={handleOpen}
            className="flex items-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded border border-gray-400 text-sm"
          >
            <Open24Regular /> Abrir
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded border border-gray-400 text-sm"
          >
            <Save24Regular /> Guardar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded border border-gray-400 text-sm"
          >
            <Print24Regular /> Imprimir
          </button>

          <div className="border-l border-gray-400 mx-2"></div>

          {/* Font Selection */}
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-400 rounded text-sm"
          >
            <option>Calibri</option>
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Courier New</option>
            <option>Verdana</option>
            <option>Georgia</option>
          </select>

          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-400 rounded text-sm w-16"
          >
            {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <div className="border-l border-gray-400 mx-2"></div>

          {/* Text Formatting */}
          <button
            onClick={() => setIsBold(!isBold)}
            className={`flex items-center gap-1 px-3 py-2 rounded border ${
              isBold
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-gray-200 hover:bg-gray-300 border-gray-400'
            }`}
          >
            <TextBold24Regular />
          </button>
          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`flex items-center gap-1 px-3 py-2 rounded border ${
              isItalic
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-gray-200 hover:bg-gray-300 border-gray-400'
            }`}
          >
            <TextItalic24Regular />
          </button>
          <button
            onClick={() => setIsUnderline(!isUnderline)}
            className={`flex items-center gap-1 px-3 py-2 rounded border ${
              isUnderline
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-gray-200 hover:bg-gray-300 border-gray-400'
            }`}
          >
            <TextUnderline24Regular />
          </button>

          <div className="border-l border-gray-400 mx-2"></div>

          {/* Alignment */}
          <button
            onClick={() => setAlignment('left')}
            className={`flex items-center gap-1 px-3 py-2 rounded border ${
              alignment === 'left'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-gray-200 hover:bg-gray-300 border-gray-400'
            }`}
          >
            <TextAlignLeft24Regular />
          </button>
          <button
            onClick={() => setAlignment('center')}
            className={`flex items-center gap-1 px-3 py-2 rounded border ${
              alignment === 'center'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-gray-200 hover:bg-gray-300 border-gray-400'
            }`}
          >
            <TextAlignCenter24Regular />
          </button>
          <button
            onClick={() => setAlignment('right')}
            className={`flex items-center gap-1 px-3 py-2 rounded border ${
              alignment === 'right'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-gray-200 hover:bg-gray-300 border-gray-400'
            }`}
          >
            <TextAlignRight24Regular />
          </button>
        </div>
      </div>

      {/* Text Area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 p-4 resize-none focus:outline-none border-none"
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight: isBold ? 'bold' : 'normal',
          fontStyle: isItalic ? 'italic' : 'normal',
          textDecoration: isUnderline ? 'underline' : 'none',
          textAlign: alignment,
        }}
        placeholder="Empieza a escribir..."
      />
    </div>
  );
};

export default WordPad;
