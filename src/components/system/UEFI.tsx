import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings24Regular,
  Desktop24Regular,
  Info24Regular,
  ShieldLock24Regular,
  ArrowRight24Regular,
  ChevronRight24Regular,
  ArrowLeft24Regular,
  Save24Regular,
  ArrowCounterclockwise24Regular,
  History24Regular,
  Storage24Regular,
  ShieldCheckmark24Regular,
  PlugConnected24Regular
} from '@fluentui/react-icons';
import { useSettings } from '../../context/SettingsContext';

interface UEFIScreenProps {
  onBootWindows: () => void;
  onBootNexOS: () => void;
  setOsType: (os: 'windows' | 'nexos') => void;
}

type UEFITab = 'main' | 'advanced' | 'security' | 'boot' | 'exit';

const UEFI: React.FC<UEFIScreenProps> = ({ onBootWindows, onBootNexOS, setOsType }) => {
  const { playSound } = useSettings();
  const [isPostComplete, setIsPostComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<UEFITab>('main');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [postLines, setPostLines] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);

  // Stats simulados con jitter
  const [temp, setTemp] = useState(38);
  const [voltage, setVoltage] = useState(1.224);

  useEffect(() => {
    const tInterval = setInterval(() => setTemp(prev => prev + (Math.random() - 0.5)), 3000);
    const vInterval = setInterval(() => setVoltage(prev => prev + (Math.random() - 0.5) * 0.01), 2000);
    return () => { clearInterval(tInterval); clearInterval(vInterval); };
  }, []);

  // Secuencia de POST
  useEffect(() => {
    const lines = [
      "NEX GEN UEFI BIOS v4.0.2 - RELEASE 2026",
      "Copyright (C) 2026 NEXA Systems Inc.",
      "",
      "Initializing System Components...",
      "CPU: Intel(R) Core(TM) i9-14900K @ 5.8GHz ................ OK",
      "Memory: 65536 MB DDR5 7200MHz Dual-Channel ............. OK",
      "Storage Controller: NEX-NVMe Gen5 x4 .................... OK",
      "NVMe Slot 1: Samsung 990 Pro 2TB ........................ OK",
      "USB Controllers: XHCI Mode Active ....................... OK",
      "Graphics: NVIDIA GeForce RTX 5090 (24GB VRAM) ........... OK",
      "Network: 10GbE LAN + Wi-Fi 7 ............................ OK",
      "TPM 2.0: Hardware Module Active ......................... OK",
      "Secure Boot: Verified ................................... OK",
      "",
      "Entering UEFI Configuration Utility...",
    ];

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        setPostLines(prev => [...prev, lines[currentLine]]);
        if (lines[currentLine].includes('OK')) playSound('beep');
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsPostComplete(true), 1000);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [playSound]);

  // Manejo de teclado
  useEffect(() => {
    if (!isPostComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tabs: UEFITab[] = ['main', 'advanced', 'security', 'boot', 'exit'];
      
      if (e.key === 'ArrowRight') {
        const nextIdx = (tabs.indexOf(activeTab) + 1) % tabs.length;
        setActiveTab(tabs[nextIdx]);
        setSelectedIdx(0);
      }
      if (e.key === 'ArrowLeft') {
        const prevIdx = (tabs.indexOf(activeTab) - 1 + tabs.length) % tabs.length;
        setActiveTab(tabs[prevIdx]);
        setSelectedIdx(0);
      }
      
      const currentOptionsCount = getOptionsForTab(activeTab).length;
      if (e.key === 'ArrowDown') setSelectedIdx(prev => (prev + 1) % currentOptionsCount);
      if (e.key === 'ArrowUp') setSelectedIdx(prev => (prev - 1 + currentOptionsCount) % currentOptionsCount);
      
      if (e.key === 'Enter') {
        handleSelection(activeTab, selectedIdx);
      }

      if (e.key === 'F10') handleSelection('exit', 0); // Save and Exit
      if (e.key === 'Escape') setActiveTab('exit');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedIdx, isPostComplete]);

  const getOptionsForTab = (tab: UEFITab) => {
    switch (tab) {
      case 'main': return [
        { label: 'System Date', value: new Date().toLocaleDateString(), icon: <Info24Regular /> },
        { label: 'System Time', value: new Date().toLocaleTimeString(), icon: <Info24Regular /> },
        { label: 'BIOS Version', value: '4.0.2 Build 0424', icon: <History24Regular /> },
        { label: 'Processor Type', value: 'i9-14900K', icon: <Settings24Regular /> },
        { label: 'Memory Frequency', value: '7200MHz', icon: <Storage24Regular /> },
      ];
      case 'advanced': return [
        { label: 'CPU Configuration', value: '>', icon: <Settings24Regular /> },
        { label: 'Storage Configuration', value: 'AHCI', icon: <Storage24Regular /> },
        { label: 'USB Configuration', value: 'XHCI Enabled', icon: <PlugConnected24Regular /> },
        { label: 'Onboard Devices', value: '>', icon: <Settings24Regular /> },
        { label: 'Hyper-Threading', value: 'Enabled', icon: <Settings24Regular /> },
      ];
      case 'security': return [
        { label: 'Secure Boot', value: 'Enabled', icon: <ShieldCheckmark24Regular /> },
        { label: 'TPM Device', value: 'Firmware TPM', icon: <ShieldLock24Regular /> },
        { label: 'Admin Password', value: 'Not Set', icon: <ShieldLock24Regular /> },
        { label: 'User Password', value: 'Not Set', icon: <ShieldLock24Regular /> },
      ];
      case 'boot': return [
        { id: 'windows', label: 'Windows Boot Manager', value: 'Boot Priority 1', icon: <Desktop24Regular /> },
        { id: 'nexos', label: 'NEX OS 2.0 (Stable)', value: 'Boot Priority 2', icon: <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500" /> },
        { label: 'Fast Boot', value: 'Disabled', icon: <Settings24Regular /> },
        { label: 'CSM Support', value: 'Disabled', icon: <Settings24Regular /> },
      ];
      case 'exit': return [
        { label: 'Save Changes & Reset', value: 'F10', icon: <Save24Regular /> },
        { label: 'Discard Changes & Exit', value: 'Esc', icon: <ArrowCounterclockwise24Regular /> },
        { label: 'Load Optimized Defaults', value: '', icon: <History24Regular /> },
      ];
      default: return [];
    }
  };

  const handleSelection = (tab: UEFITab, idx: number) => {
    const options = getOptionsForTab(tab);
    const option = options[idx];
    
    if (tab === 'boot') {
      if (option.id === 'windows') {
        setOsType('windows');
        onBootWindows();
      } else if (option.id === 'nexos') {
        setOsType('nexos');
        onBootNexOS();
      }
    }

    if (tab === 'exit') {
      if (idx === 0) { // Save and exit (defaults to Windows for now if not selected)
        setOsType('windows');
        onBootWindows();
      } else if (idx === 1) { // Discard and exit
        setOsType('windows');
        onBootWindows();
      }
    }
  };

  if (!isPostComplete) {
    return (
      <div className="bg-black text-[#00ff00] font-mono h-screen w-screen p-12 overflow-hidden flex flex-col gap-1 relative crt">
        {postLines.map((line, i) => (
          <div key={i} className="min-h-[1.5rem]">{line}</div>
        ))}
        <motion.div
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="w-2 h-5 bg-[#00ff00] inline-block ml-1"
        />
        <style>{`
          .crt::before {
            content: " ";
            display: block;
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 2;
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="uefi-root bg-[#050510] text-[#e0e0e0] font-mono h-screen w-screen flex flex-col p-8 overflow-hidden select-none relative crt">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b-2 border-blue-900/50 pb-4 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center justify-center font-bold text-3xl italic">N</div>
          <div>
            <h1 className="text-2xl font-bold tracking-tighter text-blue-400">NEX GEN UEFI BIOS <span className="text-white">v4.0.2</span></h1>
            <p className="text-[10px] opacity-60 flex gap-4">
              <span>BUILD DATE: 04/24/2026</span>
              <span>CHIPSET: Z790-NEXA</span>
              <span>SERIAL: NX-2026-X87</span>
            </p>
          </div>
        </div>
        <div className="text-right text-xs bg-blue-900/20 p-3 rounded border border-blue-800/30 grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="opacity-60 uppercase">CPU Temp:</span> <span className="text-yellow-500 font-bold">{temp.toFixed(1)}°C</span>
          <span className="opacity-60 uppercase">VCore:</span> <span className="text-blue-400 font-bold">{voltage.toFixed(3)} V</span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex gap-2 mb-6 border-b border-white/5">
        {(['Main', 'Advanced', 'Security', 'Boot', 'Exit'] as const).map((tab) => (
          <div
            key={tab}
            className={`px-8 py-2 cursor-pointer transition-all uppercase text-sm font-bold tracking-widest ${activeTab === tab.toLowerCase() ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'opacity-40 hover:opacity-100 hover:bg-white/5'}`}
            onClick={() => setActiveTab(tab.toLowerCase() as UEFITab)}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* MAIN LIST */}
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-black/40 backdrop-blur-md rounded border border-white/10 overflow-hidden">
            <div className="bg-blue-900/20 px-4 py-2 border-b border-white/5 flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-tighter">
              <Settings24Regular fontSize={16} /> Opciones de Configuración - {activeTab}
            </div>
            <div className="p-2 flex flex-col gap-1">
              {getOptionsForTab(activeTab).map((opt, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${selectedIdx === i ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}
                  onMouseEnter={() => setSelectedIdx(i)}
                  onClick={() => handleSelection(activeTab, i)}
                >
                  <div className="flex items-center gap-4">
                    <span className={selectedIdx === i ? 'text-white' : 'text-blue-500'}>{opt.icon}</span>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${selectedIdx === i ? 'text-blue-100' : 'opacity-60'}`}>{opt.value}</span>
                    {opt.value === '>' && <ChevronRight24Regular fontSize={14} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INFO SIDEBAR */}
        <div className="w-96 flex flex-col gap-4">
          <div className="bg-black/40 p-5 rounded border border-white/10 flex-1">
            <h3 className="text-blue-500 text-xs font-black uppercase mb-3 underline decoration-blue-500/50 underline-offset-4">Descripción del Item</h3>
            <p className="text-[11px] leading-relaxed opacity-70 italic">
              {activeTab === 'main' && "Proporciona información básica sobre el hardware detectado en el sistema y la configuración de hora/fecha."}
              {activeTab === 'advanced' && "Configuraciones avanzadas de la CPU, Chipset y controladores de almacenamiento integrados."}
              {activeTab === 'security' && "Opciones para configurar contraseñas de administrador y estado del módulo de plataforma segura (TPM)."}
              {activeTab === 'boot' && "Configure el orden de prioridad de los dispositivos de arranque disponibles en el sistema."}
              {activeTab === 'exit' && "Finalice la sesión de configuración guardando los cambios o descartándolos."}
            </p>
            <div className="mt-8">
              <h3 className="text-blue-500 text-xs font-black uppercase mb-3 underline decoration-blue-500/50 underline-offset-4">Teclas de Acceso</h3>
              <div className="grid grid-cols-2 gap-y-2 text-[10px] opacity-80">
                <span className="font-bold">[→ ←]</span> <span>Seleccionar Tab</span>
                <span className="font-bold">[↑ ↓]</span> <span>Seleccionar Item</span>
                <span className="font-bold">[Enter]</span> <span>Cambiar Valor</span>
                <span className="font-bold">[F10]</span> <span>Guardar y Salir</span>
                <span className="font-bold">[Esc]</span> <span>Salir / Atrás</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/10 p-4 rounded border border-blue-500/20">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold opacity-60 uppercase">Secure Boot</span>
                <div className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[9px] font-bold border border-green-500/30">ACTIVE</div>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold opacity-60 uppercase">TPM 2.0</span>
                <div className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold border border-blue-500/30">ENABLED</div>
             </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-6 flex justify-between items-end text-[10px] opacity-30 font-bold tracking-widest">
        <div>© 2026 NEXA SYSTEMS INC. - ALL RIGHTS RESERVED</div>
        <div className="flex gap-12">
          <div className="flex flex-col items-end">
            <span>LANGUAGE: EN_US</span>
            <span>ENCODING: UTF-8</span>
          </div>
          <div className="flex flex-col items-end">
            <span>SYS_CLK: 100.00 MHz</span>
            <span>RATIO: x58</span>
          </div>
        </div>
      </div>

      <style>{`
        .uefi-root {
          font-family: 'Cascadia Code', 'Consolas', monospace;
          background: radial-gradient(circle at center, #0a0a20 0%, #050510 100%);
        }
        .crt::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04));
          z-index: 10;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }
        .crt::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: rgba(18, 16, 16, 0.1);
          opacity: 0;
          z-index: 10;
          pointer-events: none;
          animation: flicker 0.15s infinite;
        }
        @keyframes flicker {
          0% { opacity: 0.1; }
          50% { opacity: 0.2; }
          100% { opacity: 0.1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(37,99,235,0.5);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default UEFI;

