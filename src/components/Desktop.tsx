import React, { useState } from 'react';
import Taskbar from './Taskbar';
import StartMenu from './StartMenu';
import NotificationsMenu from './NotificationsMenu';
import CalendarMenu from './CalendarMenu';
import Window from './Window';
import ContextMenu from './ContextMenu';
import { useWindowManager, type DesktopIcon } from '../context/WindowManager';
import { 
  Document24Regular, 
  Delete24Regular,
  ArrowClockwise24Regular, 
  TextBulletList24Regular,
  Grid24Regular,
  Desktop24Regular,
  DrawText24Regular,
  ClipboardPaste24Regular,
  Folder24Regular,
  ArrowSort24Regular,
  Apps24Regular,
  ImageMultiple24Regular,
  ImageArrowBack24Regular,
  Settings24Regular,
  Calculator24Regular,
} from '@fluentui/react-icons';
import RecycleBin from './apps/RecycleBin';
import Notepad from './apps/Notepad';
import Cmd from './apps/Cmd';
import BrowserApp, { ChromeIcon } from './apps/BrowserApp';
import IEApp, { IEIcon } from './apps/IEApp';
import CounterStrikeApp, { CounterIcon } from './apps/counter';


interface DesktopProps {
  wallpaper: string;
  onWallpaperChange: (url: string) => void;
  onShutdown: () => void;
  onRestart: () => void;
}

const Desktop: React.FC<DesktopProps> = ({ wallpaper, onWallpaperChange, onShutdown, onRestart }) => {
  const { 
    isStartOpen, 
    toggleStart, 
    closeStart,
    windows,
    openWindow,
    desktopIcons,
    addDesktopIcon,
    updateDesktopIcon,
    removeDesktopIcon,
    sortDesktopIcons,
    isWidgetsOpen,
    toggleWidgets,
    closeWidgets,
    closeFocusedWindow,
    minimizeAllWindows,
    currentDesktopId,
    virtualDesktops,
    switchDesktop,
    addDesktop,
    isDesktopSwitcherOpen,
  } = useWindowManager();

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [draggingIconId, setDraggingIconId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mouseX: number, mouseY: number, iconX: number, iconY: number } | null>(null);
  const [iconSize, setIconSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [iconContextTarget, setIconContextTarget] = useState<string | null>(null);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [runCommand, setRunCommand] = useState('');
  const [runError, setRunError] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setIconContextTarget(null);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const executeRunCommand = (command: string) => {
    const normalized = command.trim().toLowerCase();
    if (!normalized) {
      setRunError('El comando no puede estar vacío');
      return;
    }

    setRunError('');
    if (normalized === 'cmd' || normalized === 'cmd.exe') {
      openWindow('cmd', 'Terminal', <span style={{ fontFamily: 'Consolas, monospace', fontSize: 18 }}>C:\\</span>, <Cmd />);
    } else if (normalized === 'explorer' || normalized === 'file explorer') {
      openWindow('file-explorer', 'File Explorer', <Desktop24Regular />, <div className="p-4">Explorador de archivos no disponible (mockup)</div>);
    } else if (normalized === 'notepad') {
      openWindow('notepad', 'Notepad', <Document24Regular />, <Notepad />);
    } else if (normalized === 'taskmgr' || normalized === 'task manager') {
      openWindow('taskmanager', 'Administrador de tareas', <Settings24Regular />, <div className="p-4" style={{ color: 'white' }}><h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Administrador de tareas</h2><p>Esta es una simulación del Administrador de tareas.</p></div>);
    } else if (normalized === 'calc' || normalized === 'calculator') {
      openWindow('calculator', 'Calculadora', <Calculator24Regular />, <div className="p-4" style={{ color: 'white' }}><h2>Calculadora simulada</h2></div>);
    } else if (normalized === 'shutdown') {
      onShutdown();
    } else {
      setRunError(`'${command}' no se reconoce como un comando interno o externo.`);
      return;
    }

    setRunDialogOpen(false);
    setRunCommand('');
  };


  const handleNewFile = () => {
    addDesktopIcon({
      title: 'Nuevo archivo.txt',
      icon: <Document24Regular primaryFill="#ecf0f1" />,
      type: 'file',
      x: contextMenu?.x || 100,
      y: contextMenu?.y || 100,
      content: <Notepad />
    });
  };

  const handleNewFolder = () => {
    addDesktopIcon({
      title: 'Nueva carpeta',
      icon: <Folder24Regular primaryFill="#f1c40f" />,
      type: 'folder',
      x: contextMenu?.x || 100,
      y: contextMenu?.y || 100,
    });
  };

  const handleIconSizeChange = (size: 'small' | 'medium' | 'large') => {
    setIconSize(size);
    setContextMenu(null);
  };

  const handleSortIcons = (by: 'name' | 'type' | 'position') => {
    sortDesktopIcons(by);
    setContextMenu(null);
  };

  const handleDeleteIcon = (id: string) => {
    removeDesktopIcon(id);
  };

  const onIconDoubleClick = (icon: DesktopIcon) => {
  if (icon.id === 'recycle-bin') {
    openWindow('recycle-bin', 'Papelera de reciclaje', icon.icon, <RecycleBin />);
  } else if (icon.id === 'chrome') {
    openWindow('chrome', 'Google Chrome', <ChromeIcon />, <BrowserApp />);
  } else if (icon.id === 'ie') {
    openWindow('ie', 'Internet Explorer', <IEIcon />, <IEApp />);
  } else if (icon.id === 'counter-strike') {
    // IMPORTANTE: Pasarlo como <CounterStrikeApp /> (o como lo hayas importado)
    openWindow('counter-strike', 'Counter-Strike 1.6 Online', <CounterIcon />, <CounterStrikeApp />);
  } else {
    openWindow(icon.id, icon.title, icon.icon, icon.content || <div className="p-4">Archivo vacío</div>);
  }
};
  const handleIconMouseDown = (e: React.MouseEvent, icon: DesktopIcon) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setDraggingIconId(icon.id);
    setDragStart({ mouseX: e.clientX, mouseY: e.clientY, iconX: icon.x, iconY: icon.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingIconId || !dragStart) return;
    e.preventDefault();

    const newX = Math.max(10, dragStart.iconX + (e.clientX - dragStart.mouseX));
    const newY = Math.max(10, dragStart.iconY + (e.clientY - dragStart.mouseY));

    updateDesktopIcon(draggingIconId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDraggingIconId(null);
    setDragStart(null);
  };

  const closeAllMenus = () => {
    closeStart();
    closeWidgets();
    setContextMenu(null);
    setIsNotificationsOpen(false);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        closeFocusedWindow();
      }
      if (e.metaKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        minimizeAllWindows();
      }
      if (e.metaKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        openWindow('file-explorer', 'File Explorer', <Desktop24Regular />, <div className="p-4">File Explorer no está disponible aun.</div>);
      }
      if (e.metaKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setRunDialogOpen(true);
        setRunCommand('');
        setRunError('');
      }
      if (e.metaKey && e.ctrlKey && e.key.toLowerCase() === 'arrowleft') {
        e.preventDefault();
        const currentIndex = virtualDesktops.findIndex((d) => d.id === currentDesktopId);
        const prevIndex = (currentIndex - 1 + virtualDesktops.length) % virtualDesktops.length;
        switchDesktop(virtualDesktops[prevIndex].id);
      }
      if (e.metaKey && e.ctrlKey && e.key.toLowerCase() === 'arrowright') {
        e.preventDefault();
        const currentIndex = virtualDesktops.findIndex((d) => d.id === currentDesktopId);
        const nextIndex = (currentIndex + 1) % virtualDesktops.length;
        switchDesktop(virtualDesktops[nextIndex].id);
      }
      if (e.key === 'Escape' && runDialogOpen) {
        setRunDialogOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeFocusedWindow, minimizeAllWindows, openWindow, runDialogOpen, currentDesktopId, switchDesktop, virtualDesktops]);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen) {
      setIsCalendarOpen(false);
      closeStart();
    }
  };

  const toggleCalendar = () => {
    setIsCalendarOpen((prev) => !prev);
    if (!isCalendarOpen) {
      setIsNotificationsOpen(false);
      closeStart();
    }
  };

  const handleStartToggle = () => {
    toggleStart();
    setIsNotificationsOpen(false);
    closeWidgets();
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-cover bg-center"
      onContextMenu={handleContextMenu}
      onClick={closeAllMenus}
      style={{
        backgroundImage: `url("${wallpaper}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div 
        className="w-full h-full relative" 
        onClick={closeAllMenus}
      >
        <div
          className="desktop-icons"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {desktopIcons.map((icon) => {
            const sizeMap = { small: 60, medium: 80, large: 100 } as const;
            const iconFont = { small: 24, medium: 32, large: 40 } as const;
            return (
            <div
              key={icon.id}
              className={`desktop-icon ${draggingIconId === icon.id ? 'dragging' : ''}`}
              onDoubleClick={() => onIconDoubleClick(icon)}
              onMouseDown={(e) => handleIconMouseDown(e, icon)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIconContextTarget(icon.id);
                setContextMenu({ x: e.clientX, y: e.clientY });
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                left: icon.x,
                top: icon.y,
                width: sizeMap[iconSize],
                cursor: 'grab',
                userSelect: 'none',
              }}
            >
              <div className="icon-wrapper" style={{ fontSize: iconFont[iconSize], marginBottom: 6 }}>{icon.icon}</div>
              <span className="icon-label">{icon.title}</span>
            </div>
            );
          })}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          {windows.filter((win) => win.desktopId === currentDesktopId).map((win) => win.isOpen && <Window key={win.id} window={win} />)}
          {isStartOpen && <StartMenu isOpen={isStartOpen} onClose={closeStart} onWallpaperChange={onWallpaperChange} onShutdown={onShutdown} onRestart={onRestart} />}
          {runDialogOpen && (
            <div className="run-overlay" onClick={() => setRunDialogOpen(false)}>
              <div className="run-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="run-title">Ejecutar</div>
                <input
                  className="run-input"
                  value={runCommand}
                  onChange={(e) => setRunCommand(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && executeRunCommand(runCommand)}
                  autoFocus
                />
                <div className="run-actions">
                  <button className="run-btn" onClick={() => executeRunCommand(runCommand)}>Ejecutar</button>
                  <button className="run-btn" onClick={() => setRunDialogOpen(false)}>Cancelar</button>
                </div>
                {runError && <div className="run-error">{runError}</div>}
              </div>
            </div>
          )}
          {isWidgetsOpen && (
            <div className="widgets-panel" onClick={(e) => e.stopPropagation()}>
              <h3>Widgets</h3>
              <div className="widget-grid">
                <div className="widget-card"><strong>Clima</strong><p>nublado, 17°C</p></div>
                <div className="widget-card"><strong>Noticias</strong><p>Tu sistema Windows 11 está casi listo.</p></div>
                <div className="widget-card"><strong>Agenda</strong><p>Reunión a las 4:00 PM</p></div>
                <div className="widget-card"><strong>Rendimiento</strong><p>CPU 27%, Memoria 48%</p></div>
              </div>
            </div>
          )}
        </div>

        {isDesktopSwitcherOpen && (
          <div className="virtual-desktop-strip">
            {virtualDesktops.map((desk) => (
              <button
                key={desk.id}
                className={`desktop-switch ${currentDesktopId === desk.id ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); switchDesktop(desk.id); }}
              >
                {desk.name}
              </button>
            ))}
            <button className="desktop-add" onClick={(e) => { e.stopPropagation(); addDesktop(); }} title="Agregar escritorio">+</button>
          </div>
        )}

        <Taskbar 
          onStartClick={handleStartToggle} 
          isStartOpen={isStartOpen} 
          onNotificationsClick={() => toggleNotifications()}
          onClockClick={() => toggleCalendar()}
          isNotificationsOpen={isNotificationsOpen}
          onShutdown={onShutdown}
          onRestart={onRestart}
        />

        <CalendarMenu isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
        <NotificationsMenu isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => {
            setContextMenu(null);
            setIconContextTarget(null);
          }}
          options={iconContextTarget ? [
            {
              label: 'Abrir',
              icon: <Folder24Regular />,
              onClick: () => {
                const icon = desktopIcons.find((i) => i.id === iconContextTarget);
                if (icon) onIconDoubleClick(icon);
                setContextMenu(null);
                setIconContextTarget(null);
              }
            },
            {
              label: 'Eliminar',
              icon: <Delete24Regular />,
              onClick: () => {
                if (iconContextTarget) handleDeleteIcon(iconContextTarget);
                setContextMenu(null);
                setIconContextTarget(null);
              }
            },
            { label: 'Propiedades', icon: <Grid24Regular />, onClick: () => { setContextMenu(null); setIconContextTarget(null); }, disabled: true }
          ] : [
            {
              label: 'Widgets',
              icon: <Grid24Regular />,
              onClick: () => { toggleWidgets(); setContextMenu(null); },
            },
            {
              label: 'Ver',
              icon: <Grid24Regular />,
              onClick: () => {},
              submenu: [
                { label: 'Iconos grandes', icon: <Apps24Regular />, onClick: () => handleIconSizeChange('large') },
                { label: 'Iconos medianos', icon: <Grid24Regular />, onClick: () => handleIconSizeChange('medium') },
                { label: 'Iconos pequeños', icon: <ImageMultiple24Regular />, onClick: () => handleIconSizeChange('small') },
              ]
            },
            {
              label: 'Ordenar por',
              icon: <ArrowSort24Regular />,
              onClick: () => {},
              divider: true,
              submenu: [
                { label: 'Nombre', icon: <TextBulletList24Regular />, onClick: () => handleSortIcons('name') },
                { label: 'Tipo de elemento', icon: <TextBulletList24Regular />, onClick: () => handleSortIcons('type') },
                { label: 'Posición', icon: <TextBulletList24Regular />, onClick: () => handleSortIcons('position') },
              ]
            },
            { label: 'Actualizar', icon: <ArrowClockwise24Regular />, onClick: () => window.location.reload(), divider: true },
            { label: 'Pegar', icon: <ClipboardPaste24Regular />, onClick: () => {}, shortcut: 'Ctrl+V', disabled: true },
            { label: 'Pegar acceso directo', icon: <ImageArrowBack24Regular />, onClick: () => {}, disabled: true, divider: true },
            {
              label: 'Nuevo',
              icon: <Document24Regular />,
              onClick: () => {},
              divider: true,
              submenu: [
                { label: 'Carpeta', icon: <Folder24Regular />, onClick: handleNewFolder, shortcut: 'Ctrl+Shift+N' },
                { label: 'Archivo de texto', icon: <DrawText24Regular />, onClick: handleNewFile },
              ]
            },
            { label: 'Configuración de pantalla', icon: <Desktop24Regular />, onClick: () => {} },
            { label: 'Personalizar', icon: <Apps24Regular />, onClick: () => {} },
          ]}
        />
      )}

      <style>{`
  .desktop-icons {
    position: relative;
    width: 100%;
    height: calc(100% - var(--taskbar-height));
    overflow: hidden;
    padding: 10px; /* Un poco de margen para que no toquen el borde */
  }

  .desktop-icon {
    width: 90px; /* Aumentamos un poco el ancho para que el texto respire */
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 5px;
    border-radius: 6px;
    cursor: grab;
    transition: background 0.2s, transform 0.1s;
    color: white;
    text-shadow: 0 1px 3px rgba(0,0,0,0.9); /* Sombra más definida para leer sobre cualquier fondo */
  }

  .desktop-icon.dragging {
    cursor: grabbing;
    transform: scale(1.05);
    z-index: 20;
    background: rgba(255, 255, 255, 0.15);
  }

  .desktop-icon:hover {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px); /* Sutil toque de desenfoque al pasar el mouse */
  }

  .icon-wrapper {
    font-size: 32px;
    margin-bottom: 6px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); /* Sombra al icono para que resalte */
  }

  .icon-label {
    font-size: 11px;
    text-align: center;
    line-height: 1.2;
    max-width: 100%;
    /* CORRECCIÓN DE TEXTO: */
    word-break: normal; /* Cambiado de break-all para no romper palabras */
    overflow-wrap: break-word; /* Permite saltos de línea naturales */
    display: -webkit-box;
    -webkit-line-clamp: 2; /* Máximo 2 líneas de texto */
    -webkit-box-orient: vertical;
    overflow: hidden;
    padding: 0 2px;
  }

  /* --- PANELES Y WIDGETS (MANTENIENDO TU ESTILO) --- */
  .widgets-panel {
    position: fixed;
    top: 80px;
    right: 24px;
    width: 360px;
    max-height: calc(100vh - 120px);
    background: rgba(24, 24, 24, 0.88);
    backdrop-filter: blur(12px); /* Reforzamos el desenfoque */
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 16px;
    overflow: auto;
    z-index: 1500;
    box-shadow: 0 8px 36px rgba(0,0,0,0.45);
  }

  .widgets-panel h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 700;
  }

  .widget-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .widget-card {
    background: rgba(255,255,255,0.08);
    padding: 10px;
    border-radius: 10px;
    min-height: 68px;
    color: white;
    font-size: 12px;
    border: 1px solid rgba(255,255,255,0.05);
  }

  .virtual-desktop-strip {
    position: fixed;
    bottom: calc(var(--taskbar-height) + 60px);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(25, 25, 25, 0.75);
    border: 1px solid rgba(255,255,255,0.14);
    backdrop-filter: blur(10px);
    z-index: 1100;
  }

  .desktop-switch {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.6);
    padding: 4px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .desktop-switch.active {
    background: rgba(255,255,255,0.18);
    color: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .desktop-add {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }
  
  .desktop-add:hover {
    background: rgba(255,255,255,0.2);
  }
`}</style>

    </div>
  );
};

export default Desktop;
