import React, { type ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useDesktop } from './DesktopContext';

/** Props passed from the desktop/launcher to a specific app instance. */
export type AppProps = Record<string, unknown>;

export interface AppWindow {
  id: string;
  title: string;
  icon: ReactNode;
  appId: string;
  appProps?: AppProps;
  desktopId: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  snap?: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';
  zIndex: number;
  /** Saved size/position for restore-from-maximized */
  savedSize?: { width: number; height: number; x: number; y: number };
}

interface WindowManagerContextType {
  windows: AppWindow[];
  openWindow: (id: string, appId: string, title: string, icon: ReactNode, appProps?: AppProps) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  minimizeAllWindows: () => void;
  closeFocusedWindow: () => void;
  maximizeWindow: (id: string, currentSize?: { width: number; height: number; x: number; y: number }) => void;
  snapWindow: (id: string, direction: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none') => void;
  focusWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusedWindowId: string | null;
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const nextZRef = useRef(10);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const focusedWindowIdRef = useRef<string | null>(null);
  focusedWindowIdRef.current = focusedWindowId;

  // Usamos el currentDesktopId desde DesktopContext para asociar ventanas
  const { currentDesktopId } = useDesktop();
  const currentDesktopIdRef = useRef(currentDesktopId);
  currentDesktopIdRef.current = currentDesktopId;

  const bumpZ = useCallback(() => {
    const z = nextZRef.current;
    nextZRef.current = z + 1;
    return z;
  }, []);

  const openWindow = useCallback((id: string, appId: string, title: string, icon: ReactNode, appProps?: AppProps) => {
    const desktopId = currentDesktopIdRef.current;
    const z = bumpZ();
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id && w.desktopId === desktopId);
      if (existing) {
        return prev.map((w) =>
          w.id === id && w.desktopId === desktopId
            ? { ...w, appId, appProps, isOpen: true, isMinimized: false, snap: 'none', zIndex: z }
            : w,
        );
      }
      const filteredPrev = prev.filter((w) => !(w.id === id && w.desktopId === desktopId));
      return [
        ...filteredPrev,
        {
          id,
          appId,
          appProps,
          title,
          icon,
          desktopId,
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          snap: 'none' as const,
          zIndex: z,
        },
      ];
    });
    setFocusedWindowId(id);
  }, [bumpZ]);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (focusedWindowIdRef.current === id) {
      setFocusedWindowId(null);
    }
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
    if (focusedWindowIdRef.current === id) {
      setFocusedWindowId(null);
    }
  }, []);

  const minimizeAllWindows = useCallback(() => {
    setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
    setFocusedWindowId(null);
  }, []);

  const closeFocusedWindow = useCallback(() => {
    const id = focusedWindowIdRef.current;
    if (!id) return;
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setFocusedWindowId(null);
  }, []);

  const focusWindow = useCallback((id: string) => {
    const z = bumpZ();
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: z } : w)));
    setFocusedWindowId(id);
  }, [bumpZ]);

  const maximizeWindow = useCallback((id: string, currentSize?: { width: number; height: number; x: number; y: number }) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (!w.isMaximized) {
          return { ...w, isMaximized: true, snap: 'none', savedSize: currentSize ?? w.savedSize };
        }
        return { ...w, isMaximized: false };
      }),
    );
    focusWindow(id);
  }, [focusWindow]);

  const restoreWindow = useCallback((id: string) => {
    const z = bumpZ();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: false, zIndex: z } : w)),
    );
    setFocusedWindowId(id);
  }, [bumpZ]);

  const snapWindow = useCallback((
    id: string,
    direction: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none',
  ) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isMaximized: false, isMinimized: false, snap: direction } : w,
      ),
    );
    focusWindow(id);
  }, [focusWindow]);

  const value = useMemo(
    () => ({
      windows,
      openWindow,
      closeWindow,
      minimizeWindow,
      minimizeAllWindows,
      maximizeWindow,
      snapWindow,
      focusWindow,
      restoreWindow,
      closeFocusedWindow,
      focusedWindowId,
    }),
    [
      windows,
      openWindow,
      closeWindow,
      minimizeWindow,
      minimizeAllWindows,
      maximizeWindow,
      snapWindow,
      focusWindow,
      restoreWindow,
      closeFocusedWindow,
      focusedWindowId,
    ],
  );

  return (
    <WindowManagerContext.Provider value={value}>
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
