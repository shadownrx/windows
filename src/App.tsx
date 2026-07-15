import React, { Suspense, lazy, useEffect } from 'react';
import { WindowManagerProvider } from './context/WindowManager';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import NotificationContainer from './components/system/NotificationToast';
import { Info24Regular } from '@fluentui/react-icons';
import { FileSystemProvider } from './context/FileSystemContext';
import { DesktopProvider } from './context/DesktopContext';
import { UIProvider } from './context/UIContext';
import { NexRuntimeProvider } from './context/NexRuntimeContext';
import { MusicPlayerProvider } from './context/MusicPlayerContext';

const OffScreen = lazy(() => import('./components/system/OffScreen'));
const BootScreen = lazy(() => import('./components/system/BootScreen'));
const LoginScreen = lazy(() => import('./components/system/LoginScreen'));
const ShutdownScreen = lazy(() => import('./components/system/ShutdownScreen'));
const RestartScreen = lazy(() => import('./components/system/restart'));
const Background3D = lazy(() => import('./components/system/Background3D'));
const UEFI = lazy(() => import('./components/system/UEFI'));
const WindowsBoot = lazy(() => import('./components/system/WindowsBoot'));
const Desktop = lazy(() => import('./components/Desktop'));
const NexDesktop = lazy(() => import('./components/nexos/NexDesktop'));

function ScreenFallback() {
  return <div className="w-screen h-screen bg-black" aria-hidden />;
}

function AppContent() {
  const { isNightLightEnabled, systemState, setSystemState, addNotification, playSound, wallpaper, osType, setOsType } = useSettings();
  const hasLoggedInRef = React.useRef(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (systemState === 'BOOTING') {
      timeout = setTimeout(() => {
        setOsType('windows'); // Windows 11 Pro por defecto
        setSystemState('WINDOWS_BOOT');
      }, 2500); // BIOS POST time
    }
    else if (systemState === 'WINDOWS_BOOT') {
      timeout = setTimeout(() => {
        setSystemState('LOGIN');
      }, 3500); // Windows Loading time
    }
    else if (systemState === 'SHUTTING_DOWN') timeout = setTimeout(() => setSystemState('OFF'), 3000);
    else if (systemState === 'RESTARTING') timeout = setTimeout(() => setSystemState('BOOTING'), 2500);

    if (systemState === 'DESKTOP' && !hasLoggedInRef.current) {
      if (osType === 'windows') {
        playSound('startup');
        addNotification('Bienvenido', 'Nex OS esta listo para usarse', <Info24Regular />);
      }
      hasLoggedInRef.current = true;
    }

    if (systemState === 'LOGIN' || systemState === 'OFF') {
      hasLoggedInRef.current = false;
    }

    return () => clearTimeout(timeout);
  }, [systemState, setSystemState, addNotification, playSound, osType, setOsType]);


  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative select-none gpu-accelerated">
      {/* 0. Capas globales (Brillo y Luz Nocturna) */}
      <div className="brightness-overlay" />
      {isNightLightEnabled && (
        <div
          className="fixed inset-0 bg-[#ff990022] pointer-events-none z-[9998]"
          style={{ mixBlendMode: 'multiply' }}
        />
      )}

      <Suspense fallback={<ScreenFallback />}>
        {/* Global 3D — solo escritorio; chunk Three.js fuera del critical path */}
        {systemState === 'DESKTOP' && <Background3D />}

        {/* 1. Ciclo de Vida: Pantallas */}
        {systemState === 'OFF' && <OffScreen onPowerOn={() => setSystemState('BOOTING')} />}
        {systemState === 'BOOTING' && <BootScreen />}
        {systemState === 'WINDOWS_BOOT' && <WindowsBoot />}
        {systemState === 'UEFI' && (
          <UEFI
            onBootWindows={() => setSystemState('WINDOWS_BOOT')}
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
      </Suspense>

      <NotificationContainer />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <MusicPlayerProvider>
        <FileSystemProvider>
          <NexRuntimeProvider>
            <DesktopProvider>
              <UIProvider>
                <WindowManagerProvider>
                  <AppContent />
                </WindowManagerProvider>
              </UIProvider>
            </DesktopProvider>
          </NexRuntimeProvider>
        </FileSystemProvider>
      </MusicPlayerProvider>
    </SettingsProvider>
  );
}

export default App;
