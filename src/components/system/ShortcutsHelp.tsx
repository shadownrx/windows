import React from 'react';
import { Keyboard24Regular } from '@fluentui/react-icons';
import { NEX_SHORTCUTS } from '../../utils/nexShortcuts';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROWS: Array<[string, string]> = [
  [NEX_SHORTCUTS.palette, 'Paleta de comandos (apps, archivos, acciones)'],
  [NEX_SHORTCUTS.run, 'Abrir Ejecutar'],
  [NEX_SHORTCUTS.explorer, 'Abrir Explorador de archivos'],
  [NEX_SHORTCUTS.taskView, 'Vista de tareas'],
  [NEX_SHORTCUTS.assistant, 'Abrir Nex Assistant'],
  [NEX_SHORTCUTS.center, 'Centro de notificaciones'],
  [NEX_SHORTCUTS.clipboardHistory, 'Historial del portapapeles'],
  [NEX_SHORTCUTS.snip, 'Recorte de pantalla'],
  [NEX_SHORTCUTS.showDesktop, 'Mostrar escritorio'],
  [NEX_SHORTCUTS.appSwitcher, 'Cambiar de app'],
  [NEX_SHORTCUTS.snapLeft, 'Acoplar ventana a la izquierda'],
  [NEX_SHORTCUTS.snapRight, 'Acoplar ventana a la derecha'],
  [NEX_SHORTCUTS.maximize, 'Maximizar / restaurar ventana'],
  [NEX_SHORTCUTS.desktopPrev, 'Escritorio virtual anterior'],
  [NEX_SHORTCUTS.desktopNext, 'Escritorio virtual siguiente'],
  [NEX_SHORTCUTS.shortcutsHelp, 'Ver esta ayuda'],
  ['Alt+F4', 'Cerrar ventana enfocada'],
];

const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="sk-mask" onClick={onClose}>
      <div className="sk-panel mica" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Atajos de teclado">
        <div className="sk-header">
          <span className="sk-title"><Keyboard24Regular /> Atajos de teclado</span>
          <kbd className="sk-kbd">esc</kbd>
        </div>
        <div className="sk-list">
          {ROWS.map(([keys, desc]) => (
            <div key={keys + desc} className="sk-row">
              <span className="sk-keys">{keys}</span>
              <span className="sk-desc">{desc}</span>
            </div>
          ))}
        </div>
        <style>{`
          .sk-mask { position: fixed; inset: 0; z-index: 1600; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.5); padding: 16px; }
          .sk-panel {
            width: min(480px, 100%); max-height: 80vh; display: flex; flex-direction: column; overflow: hidden;
            border-radius: 10px; background: var(--mica-bg);
            backdrop-filter: blur(40px) saturate(180%);
            border: 1px solid var(--border-color);
            box-shadow: 0 24px 64px rgba(0,0,0,0.5);
            font-family: 'Segoe UI', system-ui, sans-serif; color: white;
          }
          .sk-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border-color); }
          .sk-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
          .sk-kbd { font-family: inherit; font-size: 11px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 6px; color: rgba(255,255,255,0.7); }
          .sk-list { overflow-y: auto; padding: 8px 16px 16px; }
          .sk-row { display: flex; align-items: center; gap: 14px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
          .sk-keys { min-width: 130px; font-size: 12px; font-weight: 600; color: var(--win-accent); }
          .sk-desc { font-size: 12.5px; color: rgba(255,255,255,0.85); }
        `}</style>
      </div>
    </div>
  );
};

export default ShortcutsHelp;
