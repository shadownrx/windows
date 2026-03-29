import React, { useState, useEffect } from 'react';
import Desktop from './components/Desktop';
import { WindowManagerProvider } from './context/WindowManager';
import OffScreen from './components/system/OffScreen';
import BootScreen from './components/system/BootScreen';
import LoginScreen from './components/system/LoginScreen';
import ShutdownScreen from './components/system/ShutdownScreen';
import RestartScreen from './components/system/restart';

// Definimos todos los estados posibles del ciclo de vida de NEX OS
type SystemState = 'OFF' | 'BOOTING' | 'LOGIN' | 'DESKTOP' | 'SHUTTING_DOWN' | 'RESTARTING';

function App() {
  // --- PERSISTENCIA DEL WALLPAPER ---
  // Intentamos leer el fondo guardado en el navegador, si no, usamos el de Bloom Dark por defecto.
  const [wallpaper, setWallpaper] = useState<string>(() => {
    return localStorage.getItem('nexos_current_wallpaper') || 
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974';
  });

  const [systemState, setSystemState] = useState<SystemState>('OFF');

  // Guardamos el wallpaper automáticamente cada vez que el usuario lo cambie en Settings
  useEffect(() => {
    localStorage.setItem('nexos_current_wallpaper', wallpaper);
  }, [wallpaper]);

  // --- LÓGICA DE TRANSICIONES DE SISTEMA ---
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (systemState === 'BOOTING') {
      // Simula la carga del Kernel/Drivers (3 segundos)
      timeout = setTimeout(() => setSystemState('LOGIN'), 3000);
    } 
    else if (systemState === 'SHUTTING_DOWN') {
      // Simula el cierre de procesos de Bitflow
      timeout = setTimeout(() => setSystemState('OFF'), 3000);
    } 
    else if (systemState === 'RESTARTING') {
      // Flujo de Reinicio: Pantalla de reinicio -> Vuelve a Bootear
      timeout = setTimeout(() => setSystemState('BOOTING'), 2500);
    }

    return () => clearTimeout(timeout);
  }, [systemState]);

  return (
    <WindowManagerProvider>
      <div className="w-screen h-screen bg-black overflow-hidden relative select-none">
        
        {/* 1. Estado: Apagado Total */}
        {systemState === 'OFF' && (
          <OffScreen onPowerOn={() => setSystemState('BOOTING')} />
        )}

        {/* 2. Estado: Booteo (Logo de NEX OS / Bitflow) */}
        {systemState === 'BOOTING' && (
          <BootScreen />
        )}

        {/* 3. Estado: Pantalla de Bloqueo / Login */}
        {systemState === 'LOGIN' && (
          <LoginScreen 
            onLogin={() => setSystemState('DESKTOP')} 
            wallpaper={wallpaper} 
          />
        )}

        {/* 4. Estado: Sistema Operativo Activo */}
        {systemState === 'DESKTOP' && (
          <Desktop 
            wallpaper={wallpaper} 
            onWallpaperChange={setWallpaper} 
            onShutdown={() => setSystemState('SHUTTING_DOWN')}
            onRestart={() => setSystemState('RESTARTING')}
          />
        )}

        {/* 5. Estado: Apagando sistema */}
        {systemState === 'SHUTTING_DOWN' && (
          <ShutdownScreen />
        )}

        {/* 6. Estado: Reiniciando sistema */}
        {systemState === 'RESTARTING' && (
          <RestartScreen />
        )}

      </div>
    </WindowManagerProvider>
  );
}

export default App;