import React, { createContext, useContext, useState, useEffect } from 'react';

export type SystemState = 'OFF' | 'BOOTING' | 'UEFI' | 'LOGIN' | 'DESKTOP' | 'SHUTTING_DOWN' | 'RESTARTING';

export interface Notification {
  id: string;
  title: string;
  message: string;
  icon?: React.ReactNode;
  timestamp: Date;
}

interface SettingsContextType {
  brightness: number;
  setBrightness: (val: number) => void;
  volume: number;
  setVolume: (val: number) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  isWifiEnabled: boolean;
  setIsWifiEnabled: (enabled: boolean) => void;
  isBluetoothEnabled: boolean;
  setIsBluetoothEnabled: (enabled: boolean) => void;
  isNightLightEnabled: boolean;
  setIsNightLightEnabled: (enabled: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
  systemState: SystemState;
  setSystemState: (state: SystemState) => void;
  osType: 'windows' | 'nexos';
  setOsType: (os: 'windows' | 'nexos') => void;
  updateStatus: 'idle' | 'checking' | 'downloading' | 'up-to-date';
  setUpdateStatus: (status: 'idle' | 'checking' | 'downloading' | 'up-to-date') => void;
  lockSystem: () => void;
  
  // -- NEW Perfect 11 Experience --
  notifications: Notification[];
  addNotification: (title: string, message: string, icon?: React.ReactNode) => void;
  removeNotification: (id: string) => void;
  isTaskViewOpen: boolean;
  setIsTaskViewOpen: (val: boolean) => void;
  playSound: (type: 'startup' | 'notif' | 'error') => void;

  // -- NEX OS 2.0 --
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  neonTheme: 'none' | 'cyberpunk' | 'matrix' | 'synthwave';
  setNeonTheme: (theme: 'none' | 'cyberpunk' | 'matrix' | 'synthwave') => void;
  wallpaper: string;
  setWallpaper: (url: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemState, setSystemState] = useState<SystemState>('OFF');
  const [osType, setOsType] = useState<'windows' | 'nexos'>(() => 
    (localStorage.getItem('win11_osType') as 'windows' | 'nexos') || 'windows'
  );
  const [brightness, setBrightness] = useState(() => 
    Number(localStorage.getItem('win11_brightness')) || 100
  );
  const [volume, setVolume] = useState(() => 
    Number(localStorage.getItem('win11_volume')) || 50
  );
  const [accentColor, setAccentColor] = useState(() => 
    localStorage.getItem('win11_accentColor') || '#60cdff'
  );
  const [isWifiEnabled, setIsWifiEnabled] = useState(() => 
    localStorage.getItem('win11_wifi') !== 'false'
  );
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(() => 
    localStorage.getItem('win11_bluetooth') !== 'false'
  );
  const [isNightLightEnabled, setIsNightLightEnabled] = useState(() => 
    localStorage.getItem('win11_nightlight') === 'true'
  );
  const [userName, setUserName] = useState(() => 
    localStorage.getItem('win11_userName') || 'Martín'
  );
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'downloading' | 'up-to-date'>('idle');
  
  // -- NEW --
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 
    (localStorage.getItem('win11_theme') as 'light' | 'dark') || 'dark'
  );
  const [neonTheme, setNeonTheme] = useState<'none' | 'cyberpunk' | 'matrix' | 'synthwave'>(() => 
    (localStorage.getItem('win11_neonTheme') as any) || 'none'
  );
  const [wallpaper, setWallpaper] = useState<string>(() => 
    localStorage.getItem('win11_wallpaper') || 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974'
  );

  useEffect(() => {
    localStorage.setItem('win11_wallpaper', wallpaper);
  }, [wallpaper]);

  useEffect(() => {
    document.documentElement.setAttribute('data-neon', neonTheme);
    localStorage.setItem('win11_neonTheme', neonTheme);
  }, [neonTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('win11_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const addNotification = (title: string, message: string, icon?: React.ReactNode) => {
    const newNotif: Notification = { id: Math.random().toString(36), title, message, icon, timestamp: new Date() };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
    playSound('notif');
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const playSound = (type: 'startup' | 'notif' | 'error') => {
    const urls = {
      startup: 'https://archive.org/download/windows-11-original-sounds/Windows%20Logon.mp3',
      notif: 'https://archive.org/download/windows-11-original-sounds/Windows%20Notify%20System%20Generic.mp3',
      error: 'https://archive.org/download/windows-11-original-sounds/Windows%20Foreground.mp3'
    };
    const audio = new Audio(urls[type]);
    audio.volume = volume / 100;
    audio.play().catch(() => console.log('Audio blocked by browser policy'));
  };

  const lockSystem = () => {
    if (systemState === 'DESKTOP') {
      setSystemState('LOGIN');
    }
  };

  useEffect(() => {
    localStorage.setItem('win11_brightness', brightness.toString());
    document.documentElement.style.setProperty('--win-brightness', (brightness / 100).toString());
  }, [brightness]);

  useEffect(() => {
    localStorage.setItem('win11_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('win11_accentColor', accentColor);
    document.documentElement.style.setProperty('--win-accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('win11_wifi', isWifiEnabled.toString());
  }, [isWifiEnabled]);

  useEffect(() => {
    localStorage.setItem('win11_bluetooth', isBluetoothEnabled.toString());
  }, [isBluetoothEnabled]);

  useEffect(() => {
    localStorage.setItem('win11_nightlight', isNightLightEnabled.toString());
  }, [isNightLightEnabled]);

  useEffect(() => {
    localStorage.setItem('win11_userName', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('win11_osType', osType);
  }, [osType]);

  return (
    <SettingsContext.Provider value={{
      brightness, setBrightness,
      volume, setVolume,
      accentColor, setAccentColor,
      isWifiEnabled, setIsWifiEnabled,
      isBluetoothEnabled, setIsBluetoothEnabled,
      isNightLightEnabled, setIsNightLightEnabled,
      userName, setUserName,
      systemState, setSystemState,
      osType, setOsType,
      updateStatus, setUpdateStatus,
      lockSystem,
      notifications, addNotification, removeNotification,
      isTaskViewOpen, setIsTaskViewOpen,
      playSound,
      theme, toggleTheme,
      neonTheme, setNeonTheme,
      wallpaper, setWallpaper
    }}>
      {children}
    </SettingsContext.Provider>
  );
};




export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
