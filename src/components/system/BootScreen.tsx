import React, { useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';

const BootScreen: React.FC = () => {
  const { setSystemState } = useSettings();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' || e.key === 'Delete') {
        setSystemState('UEFI');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSystemState]);

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center relative font-mono">
      <div className="flex flex-wrap w-[80px] h-[80px] gap-1 animate-pulse">
        <div className="w-[38px] h-[38px] bg-[#0078D4]"></div>
        <div className="w-[38px] h-[38px] bg-[#0078D4]"></div>
        <div className="w-[38px] h-[38px] bg-[#0078D4]"></div>
        <div className="w-[38px] h-[38px] bg-[#0078D4]"></div>
      </div>
      
      <div className="absolute bottom-32 flex flex-col items-center gap-6">
        <div className="loader"></div>
        <div className="flex flex-col items-center opacity-40 text-[10px] uppercase tracking-widest gap-1">
          <p>Presione [F2] o [DEL] para entrar a la UEFI</p>
          <p>Antigravity BIOS Utility v4.0.2</p>
        </div>
      </div>

      <style>{`
        .loader {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left-color: #0078D4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BootScreen;

