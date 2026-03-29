import React, { useState, useEffect, useRef } from 'react';

export interface ContextMenuOption {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
  shortcut?: string;
  disabled?: boolean;
  submenu?: ContextMenuOption[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: ContextMenuOption[];
}

const ContextMenuItem: React.FC<{
  option: ContextMenuOption;
  onClose: () => void;
}> = ({ option, onClose }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [submenuPos, setSubmenuPos] = useState({ x: 0, y: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (option.submenu) {
      setSubmenuOpen(true);
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        setSubmenuPos({ x: rect.right, y: rect.top });
      }
    }
  };

  const handleMouseLeave = () => {
    if (option.submenu) setSubmenuOpen(false);
  };

  const handleClick = () => {
    if (option.disabled) return;
    if (option.submenu) {
      setSubmenuOpen((prev) => !prev);
      return;
    }
    option.onClick();
    onClose();
  };

  return (
    <div
      ref={itemRef}
      className={`ctx-item ${option.disabled ? 'ctx-disabled' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <span className="ctx-icon">{option.icon}</span>
      <span className="ctx-label">{option.label}</span>
      {option.shortcut && <span className="ctx-shortcut">{option.shortcut}</span>}
      {option.submenu && <span className="ctx-arrow">›</span>}

      {submenuOpen && option.submenu && (
        <div
          className="ctx-submenu"
          style={{ top: 0, left: '100%' }}
        >
          {option.submenu.map((sub, i) => (
            <React.Fragment key={i}>
              <ContextMenuItem option={sub} onClose={onClose} />
              {sub.divider && <div className="ctx-divider" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, options }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let nx = x;
      let ny = y;
      if (x + rect.width > vw) nx = vw - rect.width - 8;
      if (y + rect.height > vh) ny = vh - rect.height - 8;
      setAdjustedPos({ x: nx, y: ny });
    }
  }, [x, y]);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className="ctx-menu"
        style={{
          position: 'fixed',
          top: adjustedPos.y,
          left: adjustedPos.x,
          zIndex: 9999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {options.map((option, index) => (
          <React.Fragment key={index}>
            <ContextMenuItem option={option} onClose={onClose} />
            {option.divider && <div className="ctx-divider" />}
          </React.Fragment>
        ))}
      </div>

      <style>{`
        .ctx-menu {
          min-width: 260px;
          background: rgba(36, 36, 36, 0.92);
          backdrop-filter: blur(60px) saturate(200%);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 4px;
          box-shadow:
            0 2px 4px rgba(0,0,0,0.15),
            0 8px 24px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.06);
          animation: ctx-in 0.12s cubic-bezier(0.2, 0, 0, 1);
          transform-origin: top left;
        }

        @keyframes ctx-in {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }

        .ctx-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px 6px 8px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 400;
          color: rgba(255,255,255,0.92);
          cursor: pointer;
          user-select: none;
          position: relative;
          transition: background 0.08s;
          letter-spacing: 0.01em;
        }

        .ctx-item:hover {
          background: rgba(255,255,255,0.08);
        }

        .ctx-item:active {
          background: rgba(255,255,255,0.05);
        }

        .ctx-disabled {
          opacity: 0.38;
          cursor: default;
          pointer-events: none;
        }

        .ctx-icon {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: rgba(255,255,255,0.75);
          font-size: 15px;
        }

        .ctx-label {
          flex: 1;
          white-space: nowrap;
        }

        .ctx-shortcut {
          font-size: 11px;
          color: rgba(255,255,255,0.38);
          margin-left: 24px;
          white-space: nowrap;
        }

        .ctx-arrow {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          margin-left: 6px;
        }

        .ctx-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 3px 8px;
        }

        .ctx-submenu {
          position: absolute;
          z-index: 10000;
          min-width: 200px;
          background: rgba(36, 36, 36, 0.92);
          backdrop-filter: blur(60px) saturate(200%);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 4px;
          box-shadow:
            0 2px 4px rgba(0,0,0,0.15),
            0 8px 24px rgba(0,0,0,0.4);
          animation: ctx-in 0.1s cubic-bezier(0.2, 0, 0, 1);
        }
      `}</style>
    </>
  );
};

export default ContextMenu;
