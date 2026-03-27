import React, { useState } from 'react';

const Notepad: React.FC = () => {
  const [text, setText] = useState('');

  return (
    <div className="notepad-container">
      <div className="notepad-menu">
        <span>File</span>
        <span>Edit</span>
        <span>Format</span>
        <span>View</span>
        <span>Help</span>
      </div>
      <textarea 
        className="notepad-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something here..."
        autoFocus
      />

      <style>{`
        .notepad-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e1e;
        }
        .notepad-menu {
          display: flex;
          gap: 16px;
          padding: 4px 12px;
          font-size: 12px;
          color: #ccc;
          background: #2d2d2d;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .notepad-menu span:hover {
          color: white;
          cursor: pointer;
        }
        .notepad-textarea {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          padding: 12px;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 14px;
          outline: none;
          resize: none;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default Notepad;
