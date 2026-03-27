import React, { useState, useEffect } from 'react';
import Desktop from './components/Desktop';
import { WindowManagerProvider } from './context/WindowManager';
import OffScreen from './components/system/OffScreen';
import BootScreen from './components/system/BootScreen';
import LoginScreen from './components/system/LoginScreen';
import ShutdownScreen from './components/system/ShutdownScreen';

type SystemState = 'OFF' | 'BOOTING' | 'LOGIN' | 'DESKTOP' | 'SHUTTING_DOWN';

function App() {
  const [wallpaper, setWallpaper] = useState('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop');
  const [systemState, setSystemState] = useState<SystemState>('OFF');

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (systemState === 'BOOTING') {
      timeout = setTimeout(() => setSystemState('LOGIN'), 3000);
    } else if (systemState === 'SHUTTING_DOWN') {
      timeout = setTimeout(() => setSystemState('OFF'), 3000);
    }
    return () => clearTimeout(timeout);
  }, [systemState]);

  return (
    <WindowManagerProvider>
      <div className="w-screen h-screen bg-black overflow-hidden relative">
        {systemState === 'OFF' && <OffScreen onPowerOn={() => setSystemState('BOOTING')} />}
        {systemState === 'BOOTING' && <BootScreen />}
        {systemState === 'LOGIN' && <LoginScreen onLogin={() => setSystemState('DESKTOP')} wallpaper={wallpaper} />}
        {systemState === 'DESKTOP' && (
          <Desktop 
            wallpaper={wallpaper} 
            onWallpaperChange={setWallpaper} 
            onShutdown={() => setSystemState('SHUTTING_DOWN')}
          />
        )}
        {systemState === 'SHUTTING_DOWN' && <ShutdownScreen />}
      </div>
    </WindowManagerProvider>
  );
}

export default App;
