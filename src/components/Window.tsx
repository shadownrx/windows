import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dismiss20Regular, Subtract20Regular, Square20Regular, Copy20Regular } from '@fluentui/react-icons';
import { useWindowManager, type AppWindow } from '../context/WindowManager';
import { useSettings } from '../context/SettingsContext';

interface WindowProps {
  window: AppWindow;
}

const Window: React.FC<WindowProps> = ({ window }) => {
  const { closeWindow, minimizeWindow, maximizeWindow, snapWindow, focusWindow } = useWindowManager();
  const { neonTheme } = useSettings();
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [position, setPosition] = useState({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [snapPreview, setSnapPreview] = useState<'maximize' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null>(null);
  const [showSnapLayouts, setShowSnapLayouts] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
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
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
    {snapPreview && (
      <div 
        className="snap-preview-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: snapPreview === 'right' ? '50vw' : 0,
          width: snapPreview === 'maximize' ? '100vw' : '50vw',
          height: 'calc(100vh - var(--taskbar-height))',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: window.zIndex - 1,
          borderRadius: 'var(--win-radius)',
          pointerEvents: 'none',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />
    )}
    <motion.div
      ref={windowRef}
      initial={{ scale: 0.9, opacity: 0, y: 40, filter: 'blur(10px)' }}
      exit={{ scale: 0.9, opacity: 0, y: 40, filter: 'blur(10px)', transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }}
      animate={{ 
        scale: window.isMinimized ? 0.8 : 1, 
        opacity: window.isMinimized ? 0 : 1,
        y: window.isMinimized ? 100 : 0,
        filter: window.isMinimized ? 'blur(10px)' : 'blur(0px)',
        width: window.isMaximized ? '100vw' : (window.snap?.includes('left') || window.snap?.includes('right')) ? '50vw' : size.width,
        height: window.isMaximized ? 'calc(100vh - var(--taskbar-height))' : 
                (window.snap?.includes('top') || window.snap?.includes('bottom')) ? 'calc((100vh - var(--taskbar-height)) / 2)' : 
                'calc(100vh - var(--taskbar-height) - 40px)',
        top: window.isMaximized ? 0 : 
             window.snap?.includes('top') ? 0 : 
             window.snap?.includes('bottom') ? 'calc((100vh - var(--taskbar-height)) / 2)' : 
             (window.snap !== 'none' && window.snap ? 0 : position.y),
        left: window.isMaximized ? 0 : 
              window.snap?.includes('left') ? 0 : 
              window.snap?.includes('right') ? '50vw' : 
              position.x,
      }}
      transition={isDragging || isResizing ? { duration: 0 } : { type: 'spring', damping: 22, stiffness: 220, mass: 0.8 }}
      style={{ 
        zIndex: window.zIndex, 
        position: 'absolute', 
        willChange: 'transform, opacity, width, height, top, left',
        pointerEvents: window.isMinimized ? 'none' : 'auto',
        transformOrigin: 'bottom center'
      }}
      onMouseDown={() => {
        if (!window.isMinimized) focusWindow(window.id);
      }}
      className={`window mica premium-shadow border-glow ${neonTheme !== 'none' ? 'neon-border' : ''} ${neonTheme === 'cyberpunk' ? 'scanlines' : ''}`}
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
          let currentTargetX = position.x;
          let currentTargetY = position.y;

          if (window.isMaximized || (window.snap && window.snap !== 'none')) {
            if (window.isMaximized) maximizeWindow(window.id);
            if (window.snap && window.snap !== 'none') snapWindow(window.id, 'none');
            
            currentTargetX = e.clientX - (size.width / 2);
            currentTargetY = 0;
            setPosition({ x: currentTargetX, y: currentTargetY });
          }

          setIsDragging(true);
          const startX = e.clientX;
          const startY = e.clientY;
          const startXPos = currentTargetX;
          const startYPos = currentTargetY;
          let dragSnapPreview: 'maximize' | 'left' | 'right' | null = null;

          const onMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const currentY = moveEvent.clientY;

            if (currentY <= 0) {
              dragSnapPreview = 'maximize';
            } else if (currentX <= 0) {
              dragSnapPreview = 'left';
            } else if (currentX >= globalThis.innerWidth - 1) {
              dragSnapPreview = 'right';
            } else {
              dragSnapPreview = null;
            }
            setSnapPreview(dragSnapPreview);

            setPosition({
              x: startXPos + (currentX - startX),
              y: startYPos + (currentY - startY)
            });
          };

          const onMouseUp = () => {
            setIsDragging(false);
            if (dragSnapPreview === 'maximize') {
              if (!window.isMaximized) maximizeWindow(window.id);
            } else if (dragSnapPreview === 'left') {
              snapWindow(window.id, 'left');
            } else if (dragSnapPreview === 'right') {
              snapWindow(window.id, 'right');
            }
            setSnapPreview(null);
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
          <div 
            style={{ position: 'relative', height: '100%', display: 'flex' }}
            onMouseEnter={() => setShowSnapLayouts(true)}
            onMouseLeave={() => setShowSnapLayouts(false)}
          >
            <button onClick={() => maximizeWindow(window.id)}>
              {window.isMaximized ? <Copy20Regular /> : <Square20Regular />}
            </button>
            {showSnapLayouts && (
              <SnapLayoutsMenu onSnap={(s) => { snapWindow(window.id, s); setShowSnapLayouts(false); }} />
            )}
          </div>
          <button className="close" onClick={() => closeWindow(window.id)}><Dismiss20Regular /></button>
        </div>
      </div>
      <div className="window-content" style={{ pointerEvents: isDragging || isResizing ? 'none' : 'auto' }}>
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

        .snap-layouts-menu {
          position: absolute;
          top: 36px;
          right: 0;
          background: rgba(30, 30, 30, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          z-index: 2000;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        .snap-group {
          width: 80px;
          height: 50px;
          display: grid;
          gap: 4px;
          cursor: pointer;
        }

        .snap-zone {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          transition: all 0.2s;
        }

        .snap-zone:hover {
          background: var(--win-accent);
          border-color: white;
        }
      `}</style>
    </motion.div>
    </>
  );
};

const SnapLayoutsMenu = ({ onSnap }: { onSnap: (s: any) => void }) => (
  <div className="snap-layouts-menu">
    {/* Layout 1: Mitades */}
    <div className="snap-group" style={{ gridTemplateColumns: '1fr 1fr' }}>
       <div className="snap-zone" onClick={() => onSnap('left')} />
       <div className="snap-zone" onClick={() => onSnap('right')} />
    </div>
    {/* Layout 2: Quadrants */}
    <div className="snap-group" style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }}>
       <div className="snap-zone" onClick={() => onSnap('top-left')} />
       <div className="snap-zone" onClick={() => onSnap('top-right')} />
       <div className="snap-zone" onClick={() => onSnap('bottom-left')} />
       <div className="snap-zone" onClick={() => onSnap('bottom-right')} />
    </div>
  </div>
);

export default Window;
