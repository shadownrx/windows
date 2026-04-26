import { useState, useEffect, useRef, useCallback } from "react";
import { useWindowManager } from "../../context/WindowManager";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Process {
  id: number;
  group: string;
  name: string;
  pid: number;
  cpu: number;
  mem: number;
  disk: number;
  icon: string;
}

type Tab = "processes" | "perf" | "services" | "startup" | "details";

// ─── Initial data ─────────────────────────────────────────────────────────────

const INITIAL_PROCESSES: Omit<Process, "id">[] = [
  { group: "Aplicaciones", name: "Microsoft Edge", pid: 4872, cpu: 3.2, mem: 312, disk: 0.1, icon: "#0078d4" },
  { group: "Aplicaciones", name: "Explorador de archivos", pid: 6204, cpu: 0.4, mem: 48, disk: 0.0, icon: "#ffb900" },
  { group: "Aplicaciones", name: "Configuración", pid: 5392, cpu: 0.1, mem: 36, disk: 0.0, icon: "#767676" },
  { group: "Aplicaciones", name: "Fotos", pid: 7844, cpu: 0.0, mem: 72, disk: 0.0, icon: "#e74856" },
  { group: "Procesos en segundo plano", name: "Antimalware Service Executable", pid: 3120, cpu: 18.4, mem: 284, disk: 2.1, icon: "#0078d4" },
  { group: "Procesos en segundo plano", name: "Servicio de actualización de Windows", pid: 1832, cpu: 0.8, mem: 56, disk: 0.5, icon: "#0078d4" },
  { group: "Procesos en segundo plano", name: "Búsqueda de Windows", pid: 2208, cpu: 2.1, mem: 128, disk: 8.4, icon: "#767676" },
  { group: "Procesos en segundo plano", name: "CTF Loader", pid: 892, cpu: 0.0, mem: 14, disk: 0.0, icon: "#767676" },
  { group: "Procesos en segundo plano", name: "Sistema de host de servicio", pid: 1104, cpu: 0.5, mem: 92, disk: 0.0, icon: "#767676" },
  { group: "Procesos de Windows", name: "Sistema", pid: 4, cpu: 0.2, mem: 2, disk: 0.3, icon: "#767676" },
  { group: "Procesos de Windows", name: "Tiempo de ejecución del cliente-servidor", pid: 652, cpu: 0.0, mem: 6, disk: 0.0, icon: "#767676" },
  { group: "Procesos de Windows", name: "Administrador de ventanas de escritorio", pid: 1248, cpu: 1.1, mem: 148, disk: 0.0, icon: "#0078d4" },
  { group: "Procesos de Windows", name: "Subsistema de Windows para aplicaciones", pid: 788, cpu: 0.0, mem: 4, disk: 0.0, icon: "#767676" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isMenu?: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, active = false, isMenu = false, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: isMenu ? "12px 14px" : "10px 14px",
        cursor: "pointer",
        color: active ? "#60cdff" : "rgba(255,255,255,0.65)",
        fontSize: isMenu ? 13 : 12,
        fontWeight: isMenu ? 500 : 400,
        whiteSpace: "nowrap",
        borderRadius: 4,
        margin: isMenu ? "0 4px 4px" : "1px 4px",
        background: active ? "rgba(255,255,255,0.1)" : "transparent",
        position: "relative",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {active && (
        <div style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 3,
          height: 16,
          background: "#60cdff",
          borderRadius: "0 2px 2px 0",
        }} />
      )}
      <div style={{ width: 16, height: 16, flexShrink: 0 }}>{icon}</div>
      <span className="nav-label" style={{ fontSize: 12 }}>{label}</span>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
  sub: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
}

function StatBox({ label, value, sub, color, active, onClick }: StatBoxProps) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 2,
        padding: "8px 12px",
        borderRadius: 4,
        border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid transparent",
        background: active ? "rgba(255,255,255,0.04)" : "transparent",
        cursor: "pointer",
        position: "relative",
        minWidth: 100,
        transition: "all 0.1s"
      }}
    >
      {active && (
        <div style={{ position: "absolute", top: 4, left: 8, opacity: 0.7 }}>
          <svg viewBox="0 0 12 12" width={10} height={10} fill="currentColor">
            <path d="M2 4l4 4 4-4" />
          </svg>
        </div>
      )}
      <span style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2, color, marginTop: active ? 6 : 0 }}>{value}</span>
      <span style={{ fontSize: 10, color: active ? "#fff" : "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{sub}</span>
    </div>
  );
}

interface MiniChartProps {
  history: number[];
  color: string;
}

function MiniChart({ history, color }: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.offsetWidth || 200;
    const h = 60;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    const step = w / (history.length - 1);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = color + "22";
    ctx.beginPath();
    history.forEach((v, i) => {
      const x = i * step;
      const y = h - (v / 100) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }, [history, color]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: 60, display: "block", marginTop: 10 }} />;
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function TaskManager() {
  const [processes, setProcesses] = useState<Process[]>(
    INITIAL_PROCESSES.map((p, i) => ({ ...p, id: i }))
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("processes");
  const [services, setServices] = useState<any[]>([]);
  const [startupApps, setStartupApps] = useState<any[]>([]);

  // History for perf charts
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(30).fill(0));
  const [memHistory, setMemHistory] = useState<number[]>(Array(30).fill(48));
  const [diskHistory, setDiskHistory] = useState<number[]>(Array(30).fill(0));
  const [netHistory, setNetHistory] = useState<number[]>(Array(30).fill(30));

  // Fetch Services & Startup Info
  useEffect(() => {
    const fetchExtra = async () => {
      try {
        const sRes = await fetch('/api/pc-services');
        const sData = await sRes.json();
        setServices(sData);

        const stRes = await fetch('/api/pc-startup');
        const stData = await stRes.json();
        setStartupApps(stData);
      } catch (e) {
        console.error("Extra data fetch error", e);
      }
    };
    fetchExtra();
  }, [activeTab]); // Refetch when changing tabs to these

  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [selectedStat, setSelectedStat] = useState<string>("CPU");

  // Fetch Hardware Info
  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const res = await fetch('/api/pc-system');
        const data = await res.json();
        setSystemInfo(data);
      } catch (e) {
        console.error("Hardware fetch error", e);
      }
    };
    fetchSystem();
  }, []);

  const [wasm, setWasm] = useState<any>(null);

  const { windows } = useWindowManager();

  // Load Wasm module (optional, keeping it if it exists)
  useEffect(() => {
    const loadWasm = async () => {
      try {
        const response = await fetch('/process_utils.wasm');
        const buffer = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(buffer);
        setWasm(instance.exports);
      } catch (e) {
        // Wasm no vital para simulación
      }
    };
    loadWasm();
  }, []);

  // Generate processes based on open windows
  useEffect(() => {
    const appStats: Record<string, { mem: number, cpuBase: number, name: string, icon: string }> = {
      'chrome': { mem: 350, cpuBase: 2.5, name: 'Google Chrome', icon: '#0078d4' },
      'ie': { mem: 120, cpuBase: 1.0, name: 'Internet Explorer', icon: '#0078d4' },
      'file-explorer': { mem: 60, cpuBase: 0.5, name: 'Explorador de archivos', icon: '#ffb900' },
      'notepad': { mem: 15, cpuBase: 0.1, name: 'Bloc de notas', icon: '#767676' },
      'cmd': { mem: 25, cpuBase: 0.2, name: 'Símbolo del sistema', icon: '#000000' },
      'taskmanager': { mem: 45, cpuBase: 1.5, name: 'Administrador de tareas', icon: '#2196F3' },
      'counter-strike': { mem: 550, cpuBase: 15.0, name: 'Counter-Strike 1.6', icon: '#ffb900' },
      'control-panel': { mem: 35, cpuBase: 0.2, name: 'Configuración', icon: '#767676' },
      'devcpp-2026': { mem: 150, cpuBase: 2.0, name: 'Dev-C++', icon: '#3b82f6' },
    };

    const generateProcesses = () => {
      // Base background processes
      const baseProcesses: Process[] = INITIAL_PROCESSES.filter(p => p.group !== 'Aplicaciones').map((p, i) => ({
        ...p,
        id: 1000 + i,
        cpu: Math.max(0, p.cpu + (Math.random() * 0.5 - 0.25)),
      }));

      // App processes based on open windows
      const appProcesses: Process[] = windows.filter(w => w.isOpen).map((win, index) => {
        const stats = appStats[win.id.split('-')[0]] || { mem: 50, cpuBase: 1.0, name: win.title, icon: '#767676' };
        
        // Add some jitter to CPU and Memory
        const activeCpu = win.isFocused ? (stats.cpuBase * 2) : stats.cpuBase;
        const currentCpu = Math.max(0, activeCpu + (Math.random() * activeCpu * 0.5));
        const currentMem = stats.mem + (Math.random() * 10 - 5);

        return {
          id: index,
          pid: 5000 + index * 12,
          name: stats.name || win.title,
          cpu: Number(currentCpu.toFixed(1)),
          mem: Number(currentMem.toFixed(0)),
          disk: Number((Math.random() * 0.5).toFixed(1)),
          group: "Aplicaciones",
          icon: stats.icon
        };
      });

      setProcesses([...appProcesses, ...baseProcesses]);
    };

    const interval = setInterval(generateProcesses, 2000);
    generateProcesses(); // Initial call

    return () => clearInterval(interval);
  }, [windows]);

  // Update histories
  useEffect(() => {
    const avgCpu = processes.reduce((a, b) => a + b.cpu, 0) / Math.max(processes.length, 1);
    const memPct = Math.min(99, Math.round(processes.reduce((a, b) => a + b.mem, 0) / 160));
    const diskPct = Math.min(50, processes.reduce((a, b) => a + b.disk, 0));
    setCpuHistory((h) => [...h.slice(1), avgCpu]);
    setMemHistory((h) => [...h.slice(1), memPct]);
    setDiskHistory((h) => [...h.slice(1), diskPct]);
    setNetHistory((h) => [...h.slice(1), 20 + Math.random() * 30]);
  }, [processes]);

  const avgCpu = processes.reduce((a, b) => a + b.cpu, 0) / Math.max(processes.length / 10, 1);
  const totalMem = processes.reduce((a, b) => a + b.mem, 0);
  
  // Real calculation based on hardware RAM
  const totalSystemRAM = systemInfo?.ram?.TotalVisibleMemorySize || 7708936; // Default to 8GB if not loaded
  const memPct = Math.min(99, Math.round((totalMem * 1024 / totalSystemRAM) * 100));
  const totalDisk = Math.round(processes.reduce((a, b) => a + b.disk, 0));

  const handleEndTask = useCallback(() => {
    if (selectedId === null) return;
    setProcesses((prev) => prev.filter((p) => p.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  // Group processes
  const groups = processes.reduce<Record<string, Process[]>>((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {});

  const NAV_ITEMS = [
    { id: "processes" as Tab, label: "Procesos", icon: <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}><path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z"/></svg> },
    { id: "perf" as Tab, label: "Rendimiento", icon: <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}><path d="M1 12L5 7l3 3 3-4 4 5H1z"/></svg> },
  ];

  const TABS = ["Procesos", "Rendimiento", "Historial de app", "Inicio", "Usuarios", "Detalles", "Servicios"];

  return (
    <>
      <style>{`
        .tm-sidebar { transition: width 0.25s ease; overflow: hidden; }
        .tm-sidebar:hover { width: 180px !important; }
        .tm-sidebar:hover .nav-label { opacity: 1 !important; }
        .nav-label { opacity: 0; transition: opacity 0.15s 0.1s; }
        .tm-row:hover { background: rgba(255,255,255,0.04) !important; }
        .tm-row.selected { background: rgba(96,205,255,0.08) !important; outline: 1px solid rgba(96,205,255,0.25); outline-offset: -1px; }
        .tm-thead th:hover { color: rgba(255,255,255,0.75); }
        .tm-scroll::-webkit-scrollbar { width: 6px; }
        .tm-scroll::-webkit-scrollbar-track { background: transparent; }
        .tm-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        .tm-btn:hover { background: #3a3a3a !important; }
        .tm-btn-danger:hover:not(:disabled) { background: #7a1f1f !important; }
      `}</style>

      <div style={{
        display: "flex",
        height: 600,
        width: "100%",
        maxWidth: 960,
        background: "#202020",
        color: "rgba(255,255,255,0.87)",
        fontFamily: "'Segoe UI', sans-serif",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}>

        {/* ── SIDEBAR ── */}
        <div className="tm-sidebar" style={{
          width: 48,
          background: "#2b2b2b",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          padding: "8px 0",
          flexShrink: 0,
          zIndex: 10,
        }}>
          <NavItem isMenu icon={
            <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
              <rect y="2" width="16" height="2" rx="1" fill="currentColor"/>
              <rect y="7" width="16" height="2" rx="1" fill="currentColor"/>
              <rect y="12" width="16" height="2" rx="1" fill="currentColor"/>
            </svg>
          } label="Administrador de tareas" />

          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 8px 6px" }} />

          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}

          {/* Extra nav items (non-functional placeholders) */}
          {[
            { label: "Historial de app", icon: <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm.5 3v4.5l3 1.5-.5 1L7.5 10V5h1z"/></svg> },
            { label: "Inicio", icon: <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}><path d="M3 2h10l1 4H2L3 2zm0 5h10v7H3V7z"/></svg> },
            { label: "Usuarios", icon: <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}><path d="M8 1a2 2 0 100 4 2 2 0 000-4zM3 8a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z"/></svg> },
            { label: "Detalles", icon: <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}><path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/></svg> },
            { label: "Servicios", icon: <svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}><path d="M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-3 1.5.5-3.5L3 4.5 6.5 4z"/></svg> },
          ].map((item) => (
            <NavItem key={item.label} icon={item.icon} label={item.label} />
          ))}

          <div style={{ flex: 1 }} />
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 8px 6px" }} />
          <NavItem label="Configuración" icon={<svg viewBox="0 0 16 16" fill="currentColor" width={16} height={16}><path d="M8 1a3 3 0 100 6 3 3 0 000-6zm-1 8h2v1.5l2 .5v1l-2 .5V14H7v-1.5l-2-.5v-1l2-.5V9z"/></svg>} />
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* HEADER */}
          <div style={{
            padding: "16px 20px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background: "#202020",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 12 }}>
              <StatBox 
                label="CPU" 
                value={`${avgCpu.toFixed(0)}%`} 
                sub={systemInfo?.cpu?.Name || "Procesador"} 
                color="#60cdff" 
                active={selectedStat === "CPU"}
                onClick={() => { setSelectedStat("CPU"); setActiveTab("perf"); }}
              />
              <StatBox 
                label="Memoria" 
                value={`${memPct}%`} 
                sub={`${(totalMem / 1024).toFixed(1)} / ${(totalSystemRAM / 1024 / 1024).toFixed(1)} GB`} 
                color="#c48dfb" 
                active={selectedStat === "Memoria"}
                onClick={() => { setSelectedStat("Memoria"); setActiveTab("perf"); }}
              />
              <StatBox 
                label="Disco" 
                value={`${totalDisk}%`} 
                sub="SSD" 
                color="#60cdff" 
                active={selectedStat === "Disco"}
                onClick={() => { setSelectedStat("Disco"); setActiveTab("perf"); }}
              />
              <StatBox 
                label="GPU" 
                value={`${(Math.random() * 5).toFixed(0)}%`} 
                sub={systemInfo?.gpu?.Name || "AMD Radeon Graphics"} 
                color="#9bcf8f" 
                active={selectedStat === "GPU"}
                onClick={() => { setSelectedStat("GPU"); setActiveTab("perf"); }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="tm-btn" style={{
                padding: "6px 14px", borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.12)", background: "#323232",
                color: "rgba(255,255,255,0.85)", fontSize: 12, cursor: "pointer",
              }}>
                Ejecutar nueva tarea
              </button>
              <button
                className="tm-btn tm-btn-danger"
                disabled={selectedId === null}
                onClick={handleEndTask}
                style={{
                  padding: "6px 14px", borderRadius: 4,
                  border: "1px solid rgba(255,80,80,0.3)",
                  background: selectedId !== null ? "#5c1717" : "#323232",
                  color: "rgba(255,255,255,0.85)", fontSize: 12, cursor: selectedId !== null ? "pointer" : "default",
                  opacity: selectedId !== null ? 1 : 0.35, transition: "all 0.15s",
                }}
              >
                Finalizar tarea
              </button>
            </div>
          </div>

          {/* TABS */}
          <div style={{
            display: "flex", padding: "0 12px",
            background: "#2b2b2b", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
          }}>
            {TABS.map((tab, i) => {
              const isActive = (i === 0 && activeTab === "processes") || (i === 1 && activeTab === "perf");
              return (
                <div
                  key={tab}
                  onClick={() => { 
                    if (i === 0) setActiveTab("processes"); 
                    if (i === 1) setActiveTab("perf");
                    if (i === 3) setActiveTab("startup");
                    if (i === 6) setActiveTab("services");
                  }}
                  style={{
                    padding: "8px 16px", fontSize: 12,
                    color: isActive ? "#60cdff" : "rgba(255,255,255,0.55)",
                    cursor: "pointer", whiteSpace: "nowrap",
                    borderBottom: isActive ? "2px solid #60cdff" : "2px solid transparent",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  {tab}
                </div>
              );
            })}
          </div>

          {/* ── PROCESS TABLE ── */}
          {activeTab === "processes" && (
            <div className="tm-scroll" style={{ flex: 1, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead className="tm-thead" style={{ position: "sticky", top: 0, background: "#202020", zIndex: 5 }}>
                  <tr>
                    {[
                      { label: "Nombre", align: "left", width: "40%" },
                      { label: "PID", align: "right", width: "8%" },
                      { label: "Estado", align: "left", width: "10%" },
                      { label: "CPU", align: "right", width: "14%" },
                      { label: "Memoria", align: "right", width: "14%" },
                      { label: "Disco", align: "right", width: "14%" },
                    ].map(({ label, align, width }) => (
                      <th key={label} style={{
                        padding: "8px 12px", fontWeight: 400,
                        color: "rgba(255,255,255,0.45)", textAlign: align as "left" | "right",
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                        fontSize: 11, cursor: "pointer", userSelect: "none", width,
                      }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groups).map(([groupName, procs]) => (
                    <>
                      <tr key={`group-${groupName}`} style={{ cursor: "default" }}>
                        <td colSpan={6} style={{
                          padding: "12px 12px 4px",
                          fontSize: 11, fontWeight: 600,
                          color: "rgba(255,255,255,0.4)",
                          letterSpacing: "0.3px",
                          background: "#202020",
                        }}>
                          {groupName}
                        </td>
                      </tr>
                      {procs.map((p) => {
                        const isHot = p.cpu > 10;
                        const isSelected = selectedId === p.id;
                        return (
                          <tr
                            key={p.id}
                            className={`tm-row${isSelected ? " selected" : ""}`}
                            onClick={() => setSelectedId(isSelected ? null : p.id)}
                            style={{
                              cursor: "pointer",
                              borderBottom: "1px solid rgba(255,255,255,0.03)",
                              transition: "background 0.1s",
                            }}
                          >
                            <td style={{ padding: "6px 12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                  width: 14, height: 14, borderRadius: 2, flexShrink: 0,
                                  background: p.icon + "22",
                                  border: `1px solid ${p.icon}44`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  <svg viewBox="0 0 10 10" width={10} height={10}>
                                    <rect x={1} y={1} width={8} height={8} rx={1} fill={p.icon} opacity={0.7} />
                                  </svg>
                                </div>
                                {p.name}
                              </div>
                            </td>
                            <td style={{ padding: "6px 12px", textAlign: "right", color: "rgba(255,255,255,0.35)" }}>
                              {p.pid}
                            </td>
                            <td style={{ padding: "6px 12px" }}>
                              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#9bcf8f", marginRight: 6, verticalAlign: "middle" }} />
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>En ejecución</span>
                            </td>
                            <td style={{ padding: "6px 12px", textAlign: "right", color: isHot ? "#ffb900" : "inherit" }}>
                              {p.cpu.toFixed(1)}%
                              <div style={{ width: 52, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, display: "inline-block", verticalAlign: "middle", marginLeft: 6 }}>
                                <div style={{ width: `${Math.min(100, p.cpu)}%`, height: 4, borderRadius: 2, background: isHot ? "#ffb900" : "#60cdff", transition: "width 0.8s" }} />
                              </div>
                            </td>
                            <td style={{ padding: "6px 12px", textAlign: "right" }}>
                              {p.mem.toFixed(0)} MB
                            </td>
                            <td style={{ padding: "6px 12px", textAlign: "right", color: "rgba(255,255,255,0.45)" }}>
                              {p.disk.toFixed(1)} MB/s
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PERF PANEL ── */}
          {activeTab === "perf" && (
            <div className="tm-scroll" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", gap: 12, flexWrap: "wrap", alignContent: "flex-start" }}>
              {[
                { title: "CPU", value: `${avgCpu.toFixed(0)}%`, sub: "Procesador · Datos reales", color: "#60cdff", history: cpuHistory },
                { title: "Memoria", value: `${memPct}%`, sub: `${(totalMem / 1024).toFixed(1)} / 32.0 GB en uso`, color: "#c48dfb", history: memHistory },
                { title: "GPU", value: `${(Math.random() * 5).toFixed(0)}%`, sub: "Gráficos · WebGPU activo", color: "#9bcf8f", history: netHistory },
                { title: "Disco 0 (C:) SSD", value: `${totalDisk}%`, sub: "Monitoreo activo", color: "#60cdff", history: diskHistory },
              ].map((card) => (
                <div key={card.title} style={{
                  background: "#2b2b2b",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 6, padding: 14,
                  width: "calc(50% - 6px)", minWidth: 200,
                }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{card.sub}</div>
                  <MiniChart history={card.history} color={card.color} />
                </div>
              ))}
            </div>
          )}

          {/* ── SERVICES PANEL ── */}
          {activeTab === "services" && (
            <div className="tm-scroll" style={{ flex: 1, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead className="tm-thead" style={{ position: "sticky", top: 0, background: "#202020", zIndex: 5 }}>
                  <tr>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.45)" }}>Nombre</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.45)" }}>Descripción</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", color: "rgba(255,255,255,0.45)" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(services) && services.map((s, idx) => (
                    <tr key={s.Name || idx} className="tm-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "6px 12px" }}>{s.Name}</td>
                      <td style={{ padding: "6px 12px", color: "rgba(255,255,255,0.5)" }}>{s.DisplayName}</td>
                      <td style={{ padding: "6px 12px" }}>
                        <span style={{ color: s.Status === 4 ? "#9bcf8f" : "rgba(255,255,255,0.3)" }}>
                          {s.Status === 4 ? "En ejecución" : "Detenido"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── STARTUP PANEL ── */}
          {activeTab === "startup" && (
            <div className="tm-scroll" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Aplicaciones de inicio (Host)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.isArray(startupApps) && startupApps.map((app, idx) => (
                  <div key={app.Name || idx} style={{ padding: 12, background: "#2b2b2b", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{app.Name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{app.Command}</div>
                    </div>
                    <div style={{ fontSize: 11, color: "#9bcf8f" }}>Habilitado</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{
            display: "flex", gap: 24, padding: "6px 16px",
            fontSize: 11, color: "rgba(255,255,255,0.35)",
            background: "#252525", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
          }}>
            <span>Procesos: {processes.length}</span>
            <span>CPU: {avgCpu.toFixed(0)}%</span>
            <span>Memoria: {memPct}%</span>
            <span>Disco: {totalDisk}%</span>
          </div>
        </div>
      </div>
    </>
  );
}
