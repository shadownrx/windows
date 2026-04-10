import React, { useState, useEffect } from 'react';
import Desktop from './components/Desktop';
import { WindowManagerProvider } from './context/WindowManager';
import OffScreen from './components/system/OffScreen';
import BootScreen from './components/system/BootScreen';
import LoginScreen from './components/system/LoginScreen';
import ShutdownScreen from './components/system/ShutdownScreen';
import RestartScreen from './components/system/restart';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import NotificationContainer from './components/system/NotificationToast';
import { Info24Regular } from '@fluentui/react-icons';

function AppContent() {
  const { isNightLightEnabled, systemState, setSystemState, addNotification, playSound } = useSettings();
  const hasLoggedInRef = React.useRef(false);
  
  // --- PERSISTENCIA DEL WALLPAPER ---
  const [wallpaper, setWallpaper] = useState<string>(() => {
    return localStorage.getItem('win11_wallpaper') || 
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974';
  });

  useEffect(() => {
    localStorage.setItem('win11_wallpaper', wallpaper);
  }, [wallpaper]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (systemState === 'BOOTING') {
      timeout = setTimeout(() => {
        setSystemState('LOGIN');
      }, 3000);
    }
    else if (systemState === 'SHUTTING_DOWN') timeout = setTimeout(() => setSystemState('OFF'), 3000);
    else if (systemState === 'RESTARTING') timeout = setTimeout(() => setSystemState('BOOTING'), 2500);
    
    if (systemState === 'DESKTOP' && !hasLoggedInRef.current) {
      playSound('startup');
      addNotification('Bienvenido', 'Windows 11 está listo para usarse.', <Info24Regular />);
      hasLoggedInRef.current = true;
    }

    if (systemState === 'LOGIN' || systemState === 'OFF') {
      hasLoggedInRef.current = false;
    }

    return () => clearTimeout(timeout);
  }, [systemState, setSystemState, addNotification, playSound]);


  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative select-none">
      {/* 0. Capas globales (Brillo y Luz Nocturna) */}
      <div className="brightness-overlay" />
      {isNightLightEnabled && (
        <div 
          className="fixed inset-0 bg-[#ff990022] pointer-events-none z-[9998]" 
          style={{ mixBlendMode: 'multiply' }}
        />
      )}

      {/* 1. Ciclo de Vida: Pantallas */}
      {systemState === 'OFF' && <OffScreen onPowerOn={() => setSystemState('BOOTING')} />}
      {systemState === 'BOOTING' && <BootScreen />}
      {systemState === 'LOGIN' && <LoginScreen onLogin={() => setSystemState('DESKTOP')} wallpaper={wallpaper} />}
      {systemState === 'DESKTOP' && (
        <Desktop 
          wallpaper={wallpaper} 
          onWallpaperChange={setWallpaper} 
          onShutdown={() => setSystemState('SHUTTING_DOWN')}
          onRestart={() => setSystemState('RESTARTING')}
        />
      )}
      {systemState === 'SHUTTING_DOWN' && <ShutdownScreen />}
      {systemState === 'RESTARTING' && <RestartScreen />}
      
      <NotificationContainer />
    </div>
  );
}

import { FileSystemProvider } from './context/FileSystemContext';

function App() {
  return (
    <SettingsProvider>
      <FileSystemProvider>
        <WindowManagerProvider>
          <AppContent />
        </WindowManagerProvider>
      </FileSystemProvider>
    </SettingsProvider>
  );
}

export default App;