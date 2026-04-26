import React, { useState, useEffect } from 'react';
import { useFileSystem } from '../../context/FileSystemContext';

interface NotepadProps {
  fileId?: string;
}

const Notepad: React.FC<NotepadProps> = ({ fileId }) => {
  const { files, updateFileContent } = useFileSystem();
  const file = fileId ? files.find(f => f.id === fileId) : undefined;
  
  const [text, setText] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    if (file && file.content) {
      setText(file.content);
      setIsSaved(true);
    }
  }, [file]);

  const handleSave = () => {
    if (fileId) {
      updateFileContent(fileId, text);
      setIsSaved(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsSaved(false);
  };

  return (
    <div className="notepad-container">
      <div className="notepad-menu">
        <span onClick={handleSave} style={{ opacity: fileId ? 1 : 0.5, cursor: fileId ? 'pointer' : 'default' }}>
          File {fileId && !isSaved ? '(*)' : ''}
        </span>
        <span>Edit</span>
        <span>Format</span>
        <span>View</span>
        <span>Help</span>
      </div>
      <textarea 
        className="notepad-textarea"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={fileId ? "Type something here..." : "Cannot save. Please create a .txt file first to save contents."}
        autoFocus
        disabled={!fileId}
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
          user-select: none;
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
        .notepad-textarea:disabled {
          color: #888;
        }
      `}</style>
    </div>
  );
};

export default Notepad;
