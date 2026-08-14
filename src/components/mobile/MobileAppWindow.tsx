import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft20Regular, Dismiss20Regular } from '@fluentui/react-icons';
import { useWindowManager, type AppWindow } from '../../context/WindowManager';
import { useSettings } from '../../context/SettingsContext';
import AppRegistry from '../AppRegistry';
import ErrorBoundary from '../system/ErrorBoundary';

interface MobileAppWindowProps {
  window: AppWindow;
}

const MobileAppWindow: React.FC<MobileAppWindowProps> = ({ window: appWindow }) => {
  const { closeWindow, minimizeWindow, focusWindow } = useWindowManager();
  const { neonTheme } = useSettings();
  const startX = useRef<number | null>(null);

  const goBack = () => {
    closeWindow(appWindow.id);
  };

  return (
    <motion.div
      className={`nex-m-app ${neonTheme !== 'none' ? 'neon-border' : ''} ${neonTheme === 'cyberpunk' ? 'scanlines' : ''}`}
      initial={{ x: '28%', opacity: 0.6 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '18%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.7 }}
      style={{ zIndex: appWindow.zIndex }}
      onPointerDown={() => focusWindow(appWindow.id)}
    >
      <div
        className="nex-m-edge-back"
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (startX.current == null) return;
          const dx = e.changedTouches[0].clientX - startX.current;
          startX.current = null;
          if (dx > 56) goBack();
        }}
      />
      <header className="nex-m-app-bar">
        <button type="button" onClick={goBack} aria-label="Cerrar">
          <ArrowLeft20Regular />
        </button>
        <div className="nex-m-app-title">
          <span className="nex-m-app-title-icon">{appWindow.icon}</span>
          <span>{appWindow.title}</span>
        </div>
        <button type="button" onClick={() => minimizeWindow(appWindow.id)} aria-label="Inicio">
          <Dismiss20Regular />
        </button>
      </header>
      <div className="nex-m-app-body">
        <ErrorBoundary appName={appWindow.title}>
          <AppRegistry appId={appWindow.appId} appProps={appWindow.appProps} />
        </ErrorBoundary>
      </div>
    </motion.div>
  );
};

export default React.memo(MobileAppWindow);
