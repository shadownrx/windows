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
import Background3D from './components/system/Background3D';
import UEFI from './components/system/UEFI';
import NexDesktop from './components/nexos/NexDesktop';

function AppContent() {
  const { isNightLightEnabled, systemState, setSystemState, addNotification, playSound, wallpaper, osType, setOsType } = useSettings();
  const hasLoggedInRef = React.useRef(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (systemState === 'BOOTING') {
      timeout = setTimeout(() => {
        setSystemState('UEFI');
      }, 2000);
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

      {/* Global 背景 3D - Solo mostrar en el Escritorio */}
      {systemState === 'DESKTOP' && <Background3D />}

      {/* 1. Ciclo de Vida: Pantallas */}
      {systemState === 'OFF' && <OffScreen onPowerOn={() => setSystemState('BOOTING')} />}
      {systemState === 'BOOTING' && <BootScreen />}
      {systemState === 'UEFI' && (
        <UEFI
          onBootWindows={() => setSystemState('LOGIN')}
          onBootNexOS={() => {
            setSystemState('LOGIN');
          }}
          setOsType={setOsType}
        />
      )}
      {systemState === 'LOGIN' && <LoginScreen onLogin={() => setSystemState('DESKTOP')} wallpaper={wallpaper} />}
      {systemState === 'DESKTOP' && (
        osType === 'windows' ? (
          <Desktop
            onShutdown={() => setSystemState('SHUTTING_DOWN')}
            onRestart={() => setSystemState('RESTARTING')}
          />
        ) : (
          <NexDesktop />
        )
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