import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dismiss20Regular, Subtract20Regular, Square20Regular, Copy20Regular } from '@fluentui/react-icons';
import { useWindowManager, type AppWindow } from '../context/WindowManager';

interface WindowProps {
  window: AppWindow;
}

const Window: React.FC<WindowProps> = ({ window }) => {
  const { closeWindow, minimizeWindow, maximizeWindow, snapWindow, focusWindow } = useWindowManager();
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [position, setPosition] = useState({ x: 100, y: 50 });
  const windowRef = useRef<HTMLDivElement>(null);

  if (window.isMinimized) return null;

  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startXPos = position.x;
    const startYPos = position.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startXPos;
      let newY = startYPos;

      if (direction.includes('e')) newWidth = Math.max(300, startWidth + deltaX);
      if (direction.includes('s')) newHeight = Math.max(200, startHeight + deltaY);
      if (direction.includes('w')) {
        const potentialWidth = startWidth - deltaX;
        if (potentialWidth > 300) {
          newWidth = potentialWidth;
          newX = startXPos + deltaX;
        }
      }
      if (direction.includes('n')) {
        const potentialHeight = startHeight - deltaY;
        if (potentialHeight > 200) {
          newHeight = potentialHeight;
          newY = startYPos + deltaY;
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <motion.div
      ref={windowRef}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        width: window.isMaximized ? '100vw' : window.snap === 'left' || window.snap === 'right' ? '50vw' : size.width,
        height: window.isMaximized ? 'calc(100vh - var(--taskbar-height))' : 'calc(100vh - var(--taskbar-height) - 40px)',
        top: window.isMaximized ? 0 : (window.snap ? 0 : (position.y)),
        left: window.isMaximized ? 0 : window.snap === 'left' ? 0 : window.snap === 'right' ? '50vw' : position.x,
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{ zIndex: window.zIndex, position: 'absolute' }}
      onMouseDown={() => focusWindow(window.id)}
      className="window mica premium-shadow border-glow"
    >
      {/* Resizers */}
      {!window.isMaximized && (
        <>
          <div className="resizer n" onMouseDown={(e) => handleResize(e, 'n')} />
          <div className="resizer e" onMouseDown={(e) => handleResize(e, 'e')} />
          <div className="resizer s" onMouseDown={(e) => handleResize(e, 's')} />
          <div className="resizer w" onMouseDown={(e) => handleResize(e, 'w')} />
          <div className="resizer ne" onMouseDown={(e) => handleResize(e, 'ne')} />
          <div className="resizer se" onMouseDown={(e) => handleResize(e, 'se')} />
          <div className="resizer sw" onMouseDown={(e) => handleResize(e, 'sw')} />
          <div className="resizer nw" onMouseDown={(e) => handleResize(e, 'nw')} />
        </>
      )}

      <div 
        className="window-header" 
        onDoubleClick={() => maximizeWindow(window.id)}
        onMouseDown={(e) => {
          if (window.isMaximized) return;
          const startX = e.clientX;
          const startY = e.clientY;
          const startXPos = position.x;
          const startYPos = position.y;

          const onMouseMove = (moveEvent: MouseEvent) => {
            setPosition({
              x: startXPos + (moveEvent.clientX - startX),
              y: startYPos + (moveEvent.clientY - startY)
            });
          };

          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }}
      >
        <div className="window-title">
          <div className="title-icon">{window.icon}</div>
          <span>{window.title}</span>
        </div>
        <div className="window-controls" onMouseDown={(e) => e.stopPropagation()}>
          <button onClick={() => snapWindow(window.id, 'left')} title="Acoplar izquierda">◀</button>
          <button onClick={() => snapWindow(window.id, 'right')} title="Acoplar derecha">▶</button>
          <button onClick={() => minimizeWindow(window.id)}><Subtract20Regular /></button>
          <button onClick={() => maximizeWindow(window.id)}>
            {window.isMaximized ? <Copy20Regular /> : <Square20Regular />}
          </button>
          <button className="close" onClick={() => closeWindow(window.id)}><Dismiss20Regular /></button>
        </div>
      </div>
      <div className="window-content">
        {window.content}
      </div>

      <style>{`
        .window {
          border-radius: var(--win-radius);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          user-select: none;
        }

        .window-header {
          height: 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 0 0 12px;
          background: rgba(0, 0, 0, 0.1);
          cursor: default;
        }

        .window-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.9);
        }

        .title-icon {
          font-size: 16px;
          display: flex;
          align-items: center;
        }

        .window-controls {
          display: flex;
          height: 100%;
        }

        .window-controls button {
          width: 32px;
          height: 100%;
          background: transparent;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.1s;
          font-size: 14px;
          font-weight: bold;
        }

        .window-controls button:hover {
          background: var(--hover-bg);
        }

        .window-controls button.close:hover {
          background: #c42b1c;
        }

        .window-content {
          flex: 1;
          background: rgba(25, 25, 25, 0.4);
          overflow: auto;
          position: relative;
        }

        /* Resizers */
        .resizer {
          position: absolute;
          z-index: 10;
        }
        .resizer.n { top: -4px; left: 0; right: 0; height: 8px; cursor: n-resize; }
        .resizer.s { bottom: -4px; left: 0; right: 0; height: 8px; cursor: s-resize; }
        .resizer.e { top: 0; bottom: 0; right: -4px; width: 8px; cursor: e-resize; }
        .resizer.w { top: 0; bottom: 0; left: -4px; width: 8px; cursor: w-resize; }
        .resizer.ne { top: -4px; right: -4px; width: 12px; height: 12px; cursor: ne-resize; }
        .resizer.nw { top: -4px; left: -4px; width: 12px; height: 12px; cursor: nw-resize; }
        .resizer.se { bottom: -4px; right: -4px; width: 12px; height: 12px; cursor: se-resize; }
        .resizer.sw { bottom: -4px; left: -4px; width: 12px; height: 12px; cursor: sw-resize; }
      `}</style>
    </motion.div>
  );
};

export default Window;
