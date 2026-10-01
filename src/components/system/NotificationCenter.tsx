import React from 'react';
import { Alert24Regular, Dismiss16Regular, Delete24Regular } from '@fluentui/react-icons';
import { useSettings } from '../../context/SettingsContext';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(d: Date): string {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    removeNotification,
    clearNotifications,
    isDoNotDisturb,
    setIsDoNotDisturb,
  } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="nc-mask" onClick={onClose}>
      <div className="nc-panel mica" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Centro de notificaciones">
        <div className="nc-header">
          <span className="nc-title"><Alert24Regular /> Notificaciones</span>
          <label className="nc-dnd" title="Silenciar sonidos y avisos">
            <input
              type="checkbox"
              checked={isDoNotDisturb}
              onChange={(e) => setIsDoNotDisturb(e.target.checked)}
            />
            No molestar
          </label>
        </div>
        <div className="nc-list">
          {notifications.length === 0 && (
            <div className="nc-empty">No hay notificaciones.<br />Estás al día.</div>
          )}
          {notifications.map((n) => (
            <div key={n.id} className="nc-item">
              <span className="nc-item-icon">{n.icon || <Alert24Regular />}</span>
              <span className="nc-item-body">
                <span className="nc-item-title">{n.title}</span>
                <span className="nc-item-msg">{n.message}</span>
                <span className="nc-item-time">{formatTime(n.timestamp)}</span>
              </span>
              <button className="nc-item-x" onClick={() => removeNotification(n.id)} aria-label="Descartar">
                <Dismiss16Regular />
              </button>
            </div>
          ))}
        </div>
        {notifications.length > 0 && (
          <button className="nc-clear" onClick={clearNotifications}>
            <Delete24Regular /> Borrar todas
          </button>
        )}
        <style>{`
          .nc-mask { position: fixed; inset: 0; z-index: 1500; background: transparent; }
          .nc-panel {
            position: fixed; right: 12px; bottom: calc(var(--taskbar-height) + 12px);
            width: min(360px, calc(100vw - 24px)); max-height: 60vh;
            display: flex; flex-direction: column; overflow: hidden;
            border-radius: 10px; background: var(--mica-bg);
            backdrop-filter: blur(40px) saturate(180%);
            border: 1px solid var(--border-color);
            box-shadow: 0 16px 48px rgba(0,0,0,0.5);
            font-family: 'Segoe UI', system-ui, sans-serif; color: white;
          }
          .nc-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--border-color); }
          .nc-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
          .nc-dnd { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.75); cursor: pointer; }
          .nc-list { overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }
          .nc-empty { padding: 28px 16px; text-align: center; font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.6; }
          .nc-item { display: flex; gap: 10px; align-items: flex-start; padding: 10px; border-radius: 8px; background: var(--card-bg); border: 1px solid var(--border-color); }
          .nc-item-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; display: flex; }
          .nc-item-body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
          .nc-item-title { font-size: 13px; font-weight: 600; }
          .nc-item-msg { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 2px; }
          .nc-item-time { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 4px; }
          .nc-item-x { background: transparent; border: none; color: rgba(255,255,255,0.5); cursor: pointer; padding: 2px; }
          .nc-item-x:hover { color: white; }
          .nc-clear { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 4px 8px 10px; padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: transparent; color: white; font-size: 12.5px; cursor: pointer; font-family: inherit; }
          .nc-clear:hover { background: var(--hover-bg); }
        `}</style>
      </div>
    </div>
  );
};

export default NotificationCenter;
