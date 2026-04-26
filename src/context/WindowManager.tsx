import React, { type ReactNode, createContext, useContext, useState } from 'react';
import { useDesktop } from './DesktopContext';

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

interface WindowManagerContextType {
  windows: AppWindow[];
  openWindow: (id: string, title: string, icon: ReactNode, content: ReactNode) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  minimizeAllWindows: () => void;
  closeFocusedWindow: () => void;
  maximizeWindow: (id: string) => void;
  snapWindow: (id: string, direction: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none') => void;
  focusWindow: (id: string) => void;
  focusedWindowId: string | null;
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  
  // Usamos el currentDesktopId desde DesktopContext para asociar ventanas
  const { currentDesktopId } = useDesktop();

  const openWindow = (id: string, title: string, icon: ReactNode, content: ReactNode) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id && w.desktopId === currentDesktopId);
      if (existing) {
        return prev.map((w) => 
          w.id === id && w.desktopId === currentDesktopId ? { ...w, content, isOpen: true, isMinimized: false, snap: 'none', zIndex: nextZIndex } : w
        );
      }
      const filteredPrev = prev.filter((w) => !(w.id === id && w.desktopId === currentDesktopId));
      return [...filteredPrev, { id, title, icon, content, desktopId: currentDesktopId, isOpen: true, isMinimized: false, isMaximized: false, snap: 'none', zIndex: nextZIndex }];
    });
    setFocusedWindowId(id);
    setNextZIndex((z) => z + 1);
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (focusedWindowId === id) {
      setFocusedWindowId(null);
      // Opcional: enfocar la siguiente ventana con mayor z-index
    }
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, isMinimized: true } : w));
    if (focusedWindowId === id) {
      setFocusedWindowId(null);
    }
  };

  const minimizeAllWindows = () => {
    setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
    setFocusedWindowId(null);
  };

  const closeFocusedWindow = () => {
    if (!focusedWindowId) return;
    closeWindow(focusedWindowId);
  };

  const maximizeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
    focusWindow(id);
  };

  const focusWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, zIndex: nextZIndex } : w));
    setFocusedWindowId(id);
    setNextZIndex((z) => z + 1);
  };

  const snapWindow = (id: string, direction: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none') => {
    setWindows((prev) => prev.map((w) => 
      w.id === id ? { ...w, isMaximized: false, isMinimized: false, snap: direction } : w
    ));
    focusWindow(id);
  };

  return (
    <WindowManagerContext.Provider value={{ 
      windows, 
      openWindow, 
      closeWindow, 
      minimizeWindow, 
      minimizeAllWindows,
      maximizeWindow, 
      snapWindow,
      focusWindow,
      closeFocusedWindow,
      focusedWindowId
    }}>
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager debe usarse dentro de WindowManagerProvider');
  }
  return context;
};
