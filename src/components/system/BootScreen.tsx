import React, { useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';

const BootScreen: React.FC = () => {
  const { setSystemState } = useSettings();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        setSystemState('UEFI');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSystemState]);

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center relative font-mono text-white">
      {/* MOTHERBOARD LOGO (MOCKUP) */}
      <div className="flex flex-col items-center gap-2 mb-12">
        <div className="w-24 h-24 border-4 border-white flex items-center justify-center text-4xl font-black italic">
          NEX
        </div>
        <div className="text-xs tracking-[0.3em] font-bold">MOTHERBOARD SERIES</div>
      </div>
      
      <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-40">
        <p className="text-[10px] uppercase tracking-widest animate-pulse">
          Presione [F] para entrar a la configuración de la UEFI
        </p>
        <div className="flex gap-8 text-[8px] uppercase">
           <span>F12: Boot Menu</span>
           <span>F2: Setup</span>
           <span>DEL: Flash Utility</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default BootScreen;

