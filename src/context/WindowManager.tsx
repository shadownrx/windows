import React, { type ReactNode, createContext, useContext, useState } from 'react';
import { 
  Delete24Regular,
  Edit24Regular,
  Document24Regular,
  CheckmarkCircle24Regular,
  Settings24Regular,
  Calendar24Regular,
  Search24Regular,
} from '@fluentui/react-icons';
import { BrowserApp, ChromeIcon } from "../components/apps/BrowserApp";
import { IEIcon } from '../components/apps/IEApp';
import { CounterIcon } from '../components/apps/counter';
import Paint from '../components/apps/Paint';
import WordPad from '../components/apps/WordPad';
import TaskManager from '../components/apps/TaskManager';
import ControlPanel from '../components/apps/ControlPanel';
import Calendar from '../components/apps/Calendar';
import SearchApp from '../components/apps/SearchApp';

export interface AppWindow {
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
  desktopId: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  snap?: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';
  zIndex: number;
}

export interface DesktopIcon {
  id: string;
  title: string;
  icon: ReactNode;
  type: 'file' | 'folder' | 'system';
  content?: ReactNode;
  x: number;
  y: number;
}

export interface VirtualDesktop {
  id: string;
  name: string;
}

interface WindowManagerContextType {
  windows: AppWindow[];
  isStartOpen: boolean;
  desktopIcons: DesktopIcon[];
  toggleStart: () => void;
  closeStart: () => void;
  openWindow: (id: string, title: string, icon: ReactNode, content: ReactNode) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  minimizeAllWindows: () => void;
  closeFocusedWindow: () => void;
  maximizeWindow: (id: string) => void;
  snapWindow: (id: string, direction: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none') => void;
  focusWindow: (id: string) => void;
  currentDesktopId: string;
  virtualDesktops: VirtualDesktop[];
  switchDesktop: (id: string) => void;
  addDesktop: () => void;
  isDesktopSwitcherOpen: boolean;
  toggleDesktopSwitcher: () => void;
  addDesktopIcon: (icon: Omit<DesktopIcon, 'id'>) => void;
  removeDesktopIcon: (id: string) => void;
  updateDesktopIcon: (id: string, updates: Partial<DesktopIcon>) => void;
  sortDesktopIcons: (by: 'name' | 'type' | 'position') => void;
  isWidgetsOpen: boolean;
  toggleWidgets: () => void;
  closeWidgets: () => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

const WindowManagerProviderComponent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isWidgetsOpen, setIsWidgetsOpen] = useState(false);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [currentDesktopId, setCurrentDesktopId] = useState('desktop-1');
  const [virtualDesktops, setVirtualDesktops] = useState<VirtualDesktop[]>([
    { id: 'desktop-1', name: 'Escritorio 1' },
    { id: 'desktop-2', name: 'Escritorio 2' },
    { id: 'desktop-3', name: 'Escritorio 3' },
  ]);
  const [isDesktopSwitcherOpen, setIsDesktopSwitcherOpen] = useState(false);
  const [desktopIcons, setDesktopIcons] = useState<DesktopIcon[]>([
    { 
      id: 'recycle-bin', 
      title: 'Papelera de reciclaje', 
      icon: <Delete24Regular primaryFill="#ecf0f1" />, 
      type: 'system',
      x: 20, 
      y: 20 
    },
    {
      id: 'ie',
      title: 'Internet Explorer',
      icon: <IEIcon />,
      type: 'system',
      x: 20,
      y: 120,
    },
    {
      id: 'chrome',
      title: 'Google Chrome',
      icon: <ChromeIcon />, 
      type: 'system',
      content: <BrowserApp />,
      x: 20,
      y: 220,
    },
    { 
      id: 'counter-strike', 
      title: 'Counter-Strike 1.6', 
      icon: <CounterIcon />,
      type: 'system',
      x: 20, 
      y: 320
    },
    {
      id: 'paint',
      title: 'Paint',
      icon: <Edit24Regular primaryFill="#FF6E40" />,
      type: 'system',
      content: <Paint />,
      x: 120,
      y: 20,
    },
    {
      id: 'wordpad',
      title: 'WordPad',
      icon: <Document24Regular primaryFill="#4CAF50" />,
      type: 'system',
      content: <WordPad />,
      x: 120,
      y: 120,
    },
    {
      id: 'task-manager',
      title: 'Administrador de tareas',
      icon: <CheckmarkCircle24Regular primaryFill="#2196F3" />,
      type: 'system',
      content: <TaskManager />,
      x: 120,
      y: 220,
    },
    {
      id: 'control-panel',
      title: 'Panel de Control',
      icon: <Settings24Regular primaryFill="#757575" />,
      type: 'system',
      content: <ControlPanel onWallpaperChange={() => {}} />,
      x: 120,
      y: 320,
    },
    {
      id: 'calendar',
      title: 'Calendario',
      icon: <Calendar24Regular primaryFill="#E91E63" />,
      type: 'system',
      content: <Calendar />,
      x: 220,
      y: 20,
    },
    {
      id: 'search',
      title: 'Buscar',
      icon: <Search24Regular primaryFill="#FF9800" />,
      type: 'system',
      content: <SearchApp />,
      x: 220,
      y: 120,
    },
  ]);

  const toggleStart = () => setIsStartOpen((prev) => !prev);
  const closeStart = () => setIsStartOpen(false);
  const toggleWidgets = () => setIsWidgetsOpen((prev) => !prev);
  const closeWidgets = () => setIsWidgetsOpen(false);

  const openWindow = (id: string, title: string, icon: ReactNode, content: ReactNode) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id && w.desktopId === currentDesktopId);
      if (existing) {
        return prev.map((w) => 
          w.id === id && w.desktopId === currentDesktopId ? { ...w, isOpen: true, isMinimized: false, snap: 'none', zIndex: nextZIndex } : w
        );
      }
      const filteredPrev = prev.filter((w) => !(w.id === id && w.desktopId === currentDesktopId));
      return [...filteredPrev, { id, title, icon, content, desktopId: currentDesktopId, isOpen: true, isMinimized: false, isMaximized: false, snap: 'none', zIndex: nextZIndex }];
    });
    setNextZIndex((z) => z + 1);
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, isMinimized: true } : w));
  };

  const minimizeAllWindows = () => {
    setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
  };

  const closeFocusedWindow = () => {
    setWindows((prev) => {
      if (prev.length === 0) return prev;
      const top = [...prev].sort((a, b) => b.zIndex - a.zIndex)[0];
      return prev.filter((w) => w.id !== top.id);
    });
  };

  const maximizeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const focusWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, zIndex: nextZIndex } : w));
    setNextZIndex((z) => z + 1);
  };

  const snapWindow = (id: string, direction: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none') => {
    setWindows((prev) => prev.map((w) => 
      w.id === id ? { ...w, isMaximized: false, isMinimized: false, snap: direction } : w
    ));
  };

  const switchDesktop = (id: string) => {
    if (!virtualDesktops.some((desk) => desk.id === id)) return;
    setCurrentDesktopId(id);
  };

  const addDesktop = () => {
    const nextNumber = virtualDesktops.length + 1;
    const newId = `desktop-${nextNumber}`;
    setVirtualDesktops((prev) => [...prev, { id: newId, name: `Escritorio ${nextNumber}` }]);
    setCurrentDesktopId(newId);
  };

  const toggleDesktopSwitcher = () => {
    setIsDesktopSwitcherOpen((prev) => !prev);
  };

  const addDesktopIcon = (icon: Omit<DesktopIcon, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setDesktopIcons((prev) => [...prev, { ...icon, id }]);
  };

  const removeDesktopIcon = (id: string) => {
    setDesktopIcons((prev) => prev.filter((icon) => icon.id !== id));
  };

  const updateDesktopIcon = (id: string, updates: Partial<DesktopIcon>) => {
    setDesktopIcons((prev) => prev.map((icon) => icon.id === id ? { ...icon, ...updates } : icon));
  };

  const sortDesktopIcons = (by: 'name' | 'type' | 'position') => {
    setDesktopIcons((prev) => {
      const sorted = [...prev];
      if (by === 'name') {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
      } else if (by === 'type') {
        sorted.sort((a, b) => a.type.localeCompare(b.type));
      } else {
        sorted.sort((a, b) => (a.y - b.y) || (a.x - b.x));
      }
      return sorted;
    });
  };

  return (
    <WindowManagerContext.Provider value={{ 
      windows, 
      isStartOpen, 
      desktopIcons,
      isWidgetsOpen,
      toggleStart, 
      closeStart, 
      toggleWidgets,
      closeWidgets,
      openWindow, 
      closeWindow, 
      minimizeWindow, 
      minimizeAllWindows,
      maximizeWindow, 
      snapWindow,
      focusWindow,
      currentDesktopId,
      virtualDesktops,
      switchDesktop,
      addDesktop,
      isDesktopSwitcherOpen,
      toggleDesktopSwitcher,
      addDesktopIcon,
      removeDesktopIcon,
      updateDesktopIcon,
      sortDesktopIcons,
      closeFocusedWindow
    }}>
      {children}
    </WindowManagerContext.Provider>
  );
};

export const WindowManagerProvider = WindowManagerProviderComponent;
export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager debe usarse dentro de WindowManagerProvider');
  }
  return context;
};
export { WindowManagerContext };

