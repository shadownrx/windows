/**
 * useWasmEngine — React hook that loads the Rust/WASM engine and exposes
 * its high-performance functions to the rest of the app.
 *
 * The WASM module is loaded lazily (once, on first use) and cached.
 * Falls back gracefully to pure-JS implementations if WASM is unavailable.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types matching the Rust structs ────────────────────────────────────────

export interface WasmProcessSnapshot {
  id: number;
  name: string;
  pid: number;
  cpu: number;
  mem: number;
  disk: number;
  group: string;
  rank: number;  // 0=low, 1=normal, 2=high, 3=critical
  trend: number; // -1 | 0 | 1
}

export interface WasmSystemMetrics {
  cpu_total: number;
  mem_total_mb: number;
  mem_used_mb: number;
  mem_percent: number;
  disk_active: number;
  net_mbps: number;
  process_count: number;
  thread_count: number;
  uptime_seconds: number;
}

interface WasmExports {
  calculate_load: (cpu: number, mem: number, disk: number) => number;
  get_rank: (load: number) => number;
  smooth_history: (data: Float64Array, window: number) => Float64Array;
  simulate_processes: (processesJson: string, tick: bigint, openWindowsJson: string) => string;
  aggregate_metrics: (processesJson: string, totalRamKb: number, tick: bigint) => string;
  transpile_cpp: (cppCode: string) => string;
  hash_string: (s: string) => number;
  process_color: (name: string) => string;
  ema: (data: Float64Array, alpha: number) => Float64Array;
  generate_cpu_history: (base: number, length: number, seed: bigint) => Float64Array;
}

// ─── Singleton WASM instance ─────────────────────────────────────────────────

let wasmInstance: WasmExports | null = null;
let wasmLoading = false;
let wasmListeners: Array<(wasm: WasmExports) => void> = [];

async function loadWasm(): Promise<WasmExports | null> {
  if (wasmInstance) return wasmInstance;
  if (wasmLoading) {
    return new Promise(resolve => {
      wasmListeners.push(resolve);
    });
  }

  wasmLoading = true;

  try {
    // Try to load the compiled WASM module
    // @ts-ignore
    const wasmModule = await import('../wasm-engine/wasm_engine.js').catch(() => null);
    if (wasmModule) {
      await wasmModule.default();
      wasmInstance = wasmModule as WasmExports;
      wasmListeners.forEach(l => l(wasmInstance!));
      wasmListeners = [];
      console.log('%c[WASM Engine] ✓ Rust/WASM engine loaded successfully', 'color: #60cdff; font-weight: bold');
      return wasmInstance;
    }
  } catch (e) {
    console.warn('[WASM Engine] WASM not available, using JS fallback:', e);
  }

  // Return null if WASM fails — hooks use JS fallbacks
  wasmLoading = false;
  wasmListeners.forEach(l => l(null as any));
  wasmListeners = [];
  return null;
}

// ─── JS Fallback implementations ──────────────────────────────────────────────

const jsFallback = {
  calculate_load: (cpu: number, mem: number, disk: number): number => {
    const raw = cpu * 0.55 + mem * 0.30 + disk * 0.15;
    return 100 / (1 + Math.exp(-0.05 * (raw - 50)));
  },
  get_rank: (load: number): number => {
    if (load > 85) return 3;
    if (load > 55) return 2;
    if (load > 20) return 1;
    return 0;
  },
  process_color: (name: string): string => {
    let hash = 5381;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash * 33) ^ name.charCodeAt(i)) >>> 0;
    }
    const h = hash % 360;
    return `hsl(${h}, 65%, 55%)`;
  },
  transpile_cpp: (code: string): string => {
    return JSON.stringify({ js_code: code, errors: ['WASM unavailable — using JS fallback'], warnings: [] });
  },
  generate_cpu_history: (base: number, length: number): number[] => {
    const history: number[] = [];
    let current = base;
    for (let i = 0; i < length; i++) {
      current = Math.max(2, Math.min(90, current + (Math.random() - 0.45) * 8));
      history.push(Math.round(current * 10) / 10);
    }
    return history;
  },
  ema: (data: number[], alpha: number): number[] => {
    if (data.length === 0) return [];
    const result = [data[0]];
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = alpha * data[i] + (1 - alpha) * ema;
      result.push(Math.round(ema * 100) / 100);
    }
    return result;
  },
  simulate_processes: (processesJson: string, tick: number): string => {
    try {
      const processes: WasmProcessSnapshot[] = JSON.parse(processesJson);
      return JSON.stringify(processes.map(p => ({
        ...p,
        cpu: Math.max(0, Math.min(100, p.cpu + (Math.random() - 0.4) * p.cpu * 0.3)),
        mem: p.mem + (Math.random() - 0.5) * 2,
        disk: Math.random() < 0.08 ? Math.random() * 5 : p.disk * 0.7,
      })));
    } catch { return '[]'; }
  },
  aggregate_metrics: (processesJson: string, totalRamKb: number): WasmSystemMetrics => {
    const processes: WasmProcessSnapshot[] = JSON.parse(processesJson).catch ? [] : JSON.parse(processesJson);
    const cpu = processes.reduce((s, p) => s + p.cpu, 0) / Math.max(processes.length, 1);
    const mem = processes.reduce((s, p) => s + p.mem, 0);
    const totalMb = totalRamKb / 1024;
    return {
      cpu_total: cpu,
      mem_total_mb: totalMb,
      mem_used_mb: mem,
      mem_percent: Math.min(99, mem / (totalMb * 10) * 100),
      disk_active: processes.reduce((s, p) => s + p.disk, 0),
      net_mbps: Math.random() * 5 + 0.5,
      process_count: processes.length,
      thread_count: processes.length * 4,
      uptime_seconds: Date.now() / 1000,
    };
  },
};

// ─── Main Hook ───────────────────────────────────────────────────────────────

interface UseWasmEngineReturn {
  isReady: boolean;
  isWasm: boolean;  // true = running real WASM, false = JS fallback

  // Exposed functions
  calculateLoad: (cpu: number, mem: number, disk: number) => number;
  getRank: (load: number) => number;
  processColor: (name: string) => string;
  simulateProcesses: (processes: WasmProcessSnapshot[], tick: number, openWindows: string[]) => WasmProcessSnapshot[];
  aggregateMetrics: (processes: WasmProcessSnapshot[], totalRamKb: number, tick: number) => WasmSystemMetrics;
  transpileCpp: (code: string) => { js_code: string; errors: string[]; warnings: string[] };
  generateCpuHistory: (base: number, length: number, seed?: number) => number[];
  ema: (data: number[], alpha?: number) => number[];
}

export function useWasmEngine(): UseWasmEngineReturn {
  const [isReady, setIsReady] = useState(false);
  const [isWasm, setIsWasm] = useState(false);
  const wasmRef = useRef<WasmExports | null>(null);
  const tickRef = useRef<number>(0);

  useEffect(() => {
    loadWasm().then(wasm => {
      wasmRef.current = wasm;
      setIsWasm(!!wasm);
      setIsReady(true);
    });
  }, []);

  const calculateLoad = useCallback((cpu: number, mem: number, disk: number): number => {
    if (wasmRef.current) return wasmRef.current.calculate_load(cpu, mem, disk);
    return jsFallback.calculate_load(cpu, mem, disk);
  }, []);

  const getRank = useCallback((load: number): number => {
    if (wasmRef.current) return wasmRef.current.get_rank(load);
    return jsFallback.get_rank(load);
  }, []);

  const processColor = useCallback((name: string): string => {
    if (wasmRef.current) return wasmRef.current.process_color(name);
    return jsFallback.process_color(name);
  }, []);

  const simulateProcesses = useCallback((
    processes: WasmProcessSnapshot[],
    tick: number,
    openWindows: string[] = []
  ): WasmProcessSnapshot[] => {
    const pJson = JSON.stringify(processes);
    const wJson = JSON.stringify(openWindows);
    if (wasmRef.current) {
      const result = wasmRef.current.simulate_processes(pJson, BigInt(tick), wJson);
      try { return JSON.parse(result); } catch { return processes; }
    }
    const result = jsFallback.simulate_processes(pJson, tick);
    try { return JSON.parse(result); } catch { return processes; }
  }, []);

  const aggregateMetrics = useCallback((
    processes: WasmProcessSnapshot[],
    totalRamKb: number,
    tick: number
  ): WasmSystemMetrics => {
    const pJson = JSON.stringify(processes);
    if (wasmRef.current) {
      const result = wasmRef.current.aggregate_metrics(pJson, totalRamKb, BigInt(tick));
      try { return JSON.parse(result); } catch {}
    }
    return jsFallback.aggregate_metrics(pJson, totalRamKb) as WasmSystemMetrics;
  }, []);

  const transpileCpp = useCallback((code: string) => {
    if (wasmRef.current) {
      const result = wasmRef.current.transpile_cpp(code);
      try { return JSON.parse(result); } catch {}
    }
    const result = jsFallback.transpile_cpp(code);
    try { return JSON.parse(result); } catch { return { js_code: '', errors: ['Parse error'], warnings: [] }; }
  }, []);

  const generateCpuHistory = useCallback((base: number, length: number, seed?: number): number[] => {
    if (wasmRef.current) {
      const arr = wasmRef.current.generate_cpu_history(base, length, BigInt(seed ?? Date.now()));
      return Array.from(arr);
    }
    return jsFallback.generate_cpu_history(base, length);
  }, []);

  const emaFn = useCallback((data: number[], alpha = 0.3): number[] => {
    if (wasmRef.current) {
      const arr = wasmRef.current.ema(new Float64Array(data), alpha);
      return Array.from(arr);
    }
    return jsFallback.ema(data, alpha);
  }, []);

  return {
    isReady,
    isWasm,
    calculateLoad,
    getRank,
    processColor,
    simulateProcesses,
    aggregateMetrics,
    transpileCpp,
    generateCpuHistory,
    ema: emaFn,
  };
}
