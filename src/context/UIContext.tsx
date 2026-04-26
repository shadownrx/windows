import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface UIContextType {
  isStartOpen: boolean;
  toggleStart: () => void;
  closeStart: () => void;

  isWidgetsOpen: boolean;
  toggleWidgets: () => void;
  closeWidgets: () => void;

  isDesktopSwitcherOpen: boolean;
  toggleDesktopSwitcher: () => void;
  closeDesktopSwitcher: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isWidgetsOpen, setIsWidgetsOpen] = useState(false);
  const [isDesktopSwitcherOpen, setIsDesktopSwitcherOpen] = useState(false);

  const toggleStart = () => {
    setIsStartOpen(prev => !prev);
    if (!isStartOpen) {
      setIsWidgetsOpen(false);
      setIsDesktopSwitcherOpen(false);
    }
  };
  const closeStart = () => setIsStartOpen(false);

  const toggleWidgets = () => {
    setIsWidgetsOpen(prev => !prev);
    if (!isWidgetsOpen) {
      setIsStartOpen(false);
      setIsDesktopSwitcherOpen(false);
    }
  };
  const closeWidgets = () => setIsWidgetsOpen(false);

  const toggleDesktopSwitcher = () => {
    setIsDesktopSwitcherOpen(prev => !prev);
    if (!isDesktopSwitcherOpen) {
      setIsStartOpen(false);
      setIsWidgetsOpen(false);
    }
  };
  const closeDesktopSwitcher = () => setIsDesktopSwitcherOpen(false);

  return (
    <UIContext.Provider value={{
      isStartOpen, toggleStart, closeStart,
      isWidgetsOpen, toggleWidgets, closeWidgets,
      isDesktopSwitcherOpen, toggleDesktopSwitcher, closeDesktopSwitcher
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within a UIProvider');
  return context;
};
