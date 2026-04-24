import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings24Regular,
  Desktop24Regular,
  Info24Regular,
  ShieldLock24Regular,
  ArrowRight24Regular,
  ChevronRight24Regular
} from '@fluentui/react-icons';

interface UEFIScreenProps {
  onBootWindows: () => void;
  onBootNexOS: () => void;
  setOsType: (os: 'windows' | 'nexos') => void;
}

const UEFI: React.FC<UEFIScreenProps> = ({ onBootWindows, onBootNexOS, setOsType }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('main'); // main, boot, security, exit

  const bootOptions = [
    { id: 'windows', name: 'Windows Boot Manager', description: 'Carga el entorno de Windows 11 Pro', icon: <Desktop24Regular /> },
    { id: 'nexos', name: 'NEX OS 2.0 (Stable)', description: 'Entorno de sistema operativo basado en Nexa', icon: <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(45deg, #ff00ff, #00ffff)' }} /> },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') setSelectedIdx(prev => (prev + 1) % bootOptions.length);
      if (e.key === 'ArrowUp') setSelectedIdx(prev => (prev - 1 + bootOptions.length) % bootOptions.length);
      if (e.key === 'Enter') {
        if (selectedIdx === 0) {
          setOsType('windows');
          onBootWindows();
        } else {
          setOsType('nexos');
          onBootNexOS();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, onBootWindows, onBootNexOS]);

  return (
    <div className="uefi-root bg-[#0a0a0a] text-[#e0e0e0] font-mono h-screen w-screen flex flex-col p-8 overflow-hidden select-none">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-[#333] pb-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center font-bold text-2xl">A</div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter"> UEFI BIOS UTILITY v4.0.2</h1>
            <p className="text-[10px] opacity-60">Build Date: 04/24/2026 | Version: 2.21.1278</p>
          </div>
        </div>
        <div className="text-right text-xs opacity-80">
          <p>CPU Temp: 38°C</p>
          <p>Core Voltage: 1.224 V</p>
          <p>Motherboard: NEX-GEN Z790</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-8 mb-8 border-b border-[#222]">
        {['Main', 'Advanced', 'Security', 'Boot', 'Exit'].map((tab) => (
          <div
            key={tab}
            className={`pb-2 px-4 cursor-pointer transition-colors ${activeTab === tab.toLowerCase() ? 'border-b-2 border-blue-500 text-blue-400' : 'opacity-40 hover:opacity-100'}`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="flex flex-1 gap-8 overflow-hidden">
        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-[#151515] p-6 rounded border border-[#333]">
            <h2 className="text-sm font-bold text-blue-500 mb-4 flex items-center gap-2">
              <Info24Regular /> INFORMACIÓN DEL SISTEMA
            </h2>
            <div className="grid grid-cols-2 gap-y-2 text-xs opacity-80">
              <span>Procesador:</span> <span className="text-white">Intel(R) Core(TM) i9-14900K @ 5.8GHz</span>
              <span>Memoria Total:</span> <span className="text-white">65536 MB (DDR5 7200MHz)</span>
              <span>Versión UEFI:</span> <span className="text-white">A.G. 2.0 - Stable Build</span>
              <span>ID del Sistema:</span> <span className="text-white">X87-992-KLR</span>
            </div>
          </div>

          <div className="bg-[#151515] p-6 rounded border border-[#333] flex-1">
            <h2 className="text-sm font-bold text-blue-500 mb-4 flex items-center gap-2">
              <Desktop24Regular /> PRIORIDAD DE ARRANQUE (BOOT MENU)
            </h2>
            <div className="flex flex-col gap-3">
              {bootOptions.map((opt, i) => (
                <div
                  key={opt.id}
                  className={`p-4 rounded border transition-all flex items-center justify-between cursor-pointer ${selectedIdx === i ? 'bg-blue-600/20 border-blue-500' : 'bg-[#222] border-transparent opacity-60 hover:opacity-100'}`}
                  onClick={() => setSelectedIdx(i)}
                  onDoubleClick={() => {
                    if (i === 0) {
                      setOsType('windows');
                      onBootWindows();
                    } else {
                      setOsType('nexos');
                      onBootNexOS();
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-blue-400">{opt.icon}</div>
                    <div>
                      <div className="font-bold text-sm">{opt.name}</div>
                      <div className="text-[10px] opacity-70">{opt.description}</div>
                    </div>
                  </div>
                  {selectedIdx === i && <ArrowRight24Regular className="text-blue-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR HELP */}
        <div className="w-80 bg-[#151515] p-6 rounded border border-[#333] flex flex-col gap-6 text-[11px]">
          <section>
            <h3 className="font-bold text-blue-500 mb-2 underline uppercase">Ayuda</h3>
            <p className="opacity-70 leading-relaxed">
              Seleccione el dispositivo de arranque o el gestor de arranque del sistema operativo.
              Utilice las teclas [↑] [↓] para navegar y [Enter] para confirmar la selección.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-blue-500 mb-2 underline uppercase">Teclas de Navegación</h3>
            <div className="flex flex-col gap-1 opacity-80">
              <div className="flex justify-between"><span>[↑][↓]</span> <span>Seleccionar Item</span></div>
              <div className="flex justify-between"><span>[Enter]</span> <span>Ejecutar Selección</span></div>
              <div className="flex justify-between"><span>[F10]</span> <span>Guardar y Salir</span></div>
              <div className="flex justify-between"><span>[Esc]</span> <span>Salir sin Guardar</span></div>
            </div>
          </section>

          <div className="mt-auto pt-4 border-t border-[#333] flex flex-col gap-2">
            <div className="flex items-center gap-2 text-yellow-500">
              <ShieldLock24Regular />
              <span>Secure Boot: Enabled</span>
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <Settings24Regular />
              <span>TPM 2.0: Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 flex justify-between items-center text-[10px] opacity-40">
        <p>© 2026 webOS Systems Inc. All rights reserved.</p>
        <div className="flex gap-4">
          <span>Language: Español (ES)</span>
          <span>Time: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <style>{`
        .uefi-root {
          font-family: 'Cascadia Code', 'Consolas', monospace;
        }
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
        .uefi-root::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          z-index: 100;
        }
      `}</style>
    </div>
  );
};

export default UEFI;
