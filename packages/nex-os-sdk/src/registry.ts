import type { NexAppManifest, NexLauncherItem, RegistryListener } from './types';

const byAppId = new Map<string, NexAppManifest>();
const listeners = new Set<RegistryListener>();

function emit() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* ignore listener errors */
    }
  });
}

/** Suscribite a altas/bajas de apps (para refrescar Start/Taskbar). */
export function subscribeRegistry(listener: RegistryListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Registra una app en runtime.
 * Podés llamarlo desde tu módulo de community apps al boot.
 */
export function registerApp(manifest: NexAppManifest): void {
  if (!manifest?.appId || !manifest?.component) {
    throw new Error('@nex-os/sdk: registerApp requiere appId y component');
  }
  byAppId.set(manifest.appId, manifest);
  for (const alias of manifest.aliases ?? []) {
    byAppId.set(alias, manifest);
  }
  emit();
}

/** Quita una app del registro dinámico (no afecta apps built-in del host). */
export function unregisterApp(appId: string): void {
  const existing = byAppId.get(appId);
  if (!existing) return;
  for (const [key, value] of byAppId.entries()) {
    if (value === existing) byAppId.delete(key);
  }
  emit();
}

export function getRegisteredApp(appId: string): NexAppManifest | undefined {
  return byAppId.get(appId);
}

/** Lista única de manifests (sin duplicar aliases). */
export function listRegisteredApps(): NexAppManifest[] {
  const seen = new Set<NexAppManifest>();
  const out: NexAppManifest[] = [];
  for (const m of byAppId.values()) {
    if (seen.has(m)) continue;
    seen.add(m);
    out.push(m);
  }
  return out;
}

/** Items listos para mezclar con la taskbar / search. */
export function getCommunityLauncherItems(): NexLauncherItem[] {
  return listRegisteredApps().map((m) => ({
    id: m.id,
    appId: m.appId,
    label: m.title,
    icon: m.icon,
    isPinned: m.pinToTaskbar,
    description: m.description,
    author: m.author,
    community: true,
  }));
}

/** Helper: define + register en un solo paso. */
export function defineApp(manifest: NexAppManifest): NexAppManifest {
  registerApp(manifest);
  return manifest;
}
