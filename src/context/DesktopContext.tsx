import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Delete24Regular,
  Edit24Regular,
  Document24Regular,
  CheckmarkCircle24Regular,
  Settings24Regular,
  Calendar24Regular,
  Search24Regular,
  Play24Filled,
  Book24Regular,
} from '@fluentui/react-icons';
import { ChromeIcon, BrowserApp } from "../components/apps/BrowserApp";
import { IEIcon } from '../components/apps/IEApp';
import { CounterIcon } from '../components/apps/counter';
import Paint from '../components/apps/Paint';
import WordPad from '../components/apps/WordPad';
import TaskManager from '../components/apps/TaskManager';
import ControlPanel from '../components/apps/ControlPanel';
import Calendar from '../components/apps/Calendar';
import SearchApp from '../components/apps/SearchApp';
import DevCpp2026 from '../components/apps/DevCpp2026';
import ManualApp from '../components/apps/ManualApp';

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

interface DesktopContextType {
  desktopIcons: DesktopIcon[];
  addDesktopIcon: (icon: Omit<DesktopIcon, 'id'> & { id?: string }) => void;
  removeDesktopIcon: (id: string) => void;
  updateDesktopIcon: (id: string, updates: Partial<DesktopIcon>) => void;
  sortDesktopIcons: (by: 'name' | 'type' | 'position') => void;
  currentDesktopId: string;
  virtualDesktops: VirtualDesktop[];
  switchDesktop: (id: string) => void;
  addDesktop: () => void;
}

const DesktopContext = createContext<DesktopContextType | undefined>(undefined);

export const DesktopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentDesktopId, setCurrentDesktopId] = useState('desktop-1');
  const [virtualDesktops, setVirtualDesktops] = useState<VirtualDesktop[]>([
    { id: 'desktop-1', name: 'Escritorio 1' },
    { id: 'desktop-2', name: 'Escritorio 2' },
    { id: 'desktop-3', name: 'Escritorio 3' },
  ]);

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
      content: <ControlPanel />,
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
    {
      id: 'devcpp-2026',
      title: 'Dev-C++ 2026',
      icon: (
        <div style={{ 
          width: 32, 
          height: 32, 
          background: 'white', 
          borderRadius: 6, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
        }}>
          <Play24Filled primaryFill="#3b82f6" style={{ transform: 'rotate(-45deg)', fontSize: 18 }} />
        </div>
      ),
      type: 'system',
      content: <DevCpp2026 />,
      x: 320,
      y: 20,
    },
    {
      id: 'manual',
      title: 'Manual de NEX',
      icon: <Book24Regular primaryFill="#3b82f6" />,
      type: 'system',
      content: <ManualApp />,
      x: 320,
      y: 120,
    },
  ]);

  const addDesktopIcon = (icon: Omit<DesktopIcon, 'id'> & { id?: string }) => {
    const id = icon.id || Math.random().toString(36).substr(2, 9);
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

  return (
    <DesktopContext.Provider value={{
      desktopIcons, addDesktopIcon, removeDesktopIcon, updateDesktopIcon, sortDesktopIcons,
      currentDesktopId, virtualDesktops, switchDesktop, addDesktop
    }}>
      {children}
    </DesktopContext.Provider>
  );
};

export const useDesktop = () => {
  const context = useContext(DesktopContext);
  if (!context) throw new Error('useDesktop must be used within a DesktopProvider');
  return context;
};
