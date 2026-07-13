# @nex-os/sdk

SDK oficial para **crear tus propias apps** dentro de NEX OS.

## Instalar (en este monorepo)

Ya está linkeado vía alias Vite/TS:

```ts
import { defineApp, registerApp } from '@nex-os/sdk';
```

## Crear una app en 30 segundos

```tsx
// src/community-apps/MiApp.tsx
import React from 'react';
import { defineApp, type NexAppProps } from '@nex-os/sdk';

function MiApp(_props: NexAppProps) {
  return (
    <div style={{ padding: 24, color: '#fff', height: '100%', background: '#0b1220' }}>
      <h1>Hola NEX</h1>
      <p>Esta app la creaste vos ✨</p>
    </div>
  );
}

export default defineApp({
  id: 'mi-app',
  appId: 'mi-app',
  title: 'Mi App',
  icon: <span style={{ fontSize: 18 }}>🚀</span>,
  component: MiApp,
  description: 'Mi primera app en NEX OS',
  author: '@vos',
  version: '0.1.0',
  pinToTaskbar: true,
  category: 'tools',
});
```

Después importá el módulo una vez al boot (ej. en `src/community-apps/index.ts`).

## API

| Función | Qué hace |
|---------|----------|
| `defineApp(manifest)` | Registra y devuelve el manifest |
| `registerApp(manifest)` | Solo registra |
| `unregisterApp(appId)` | Saca una app dinámica |
| `getRegisteredApp(appId)` | Lookup |
| `listRegisteredApps()` | Todas las community apps |
| `getCommunityLauncherItems()` | Para taskbar / search |
| `subscribeRegistry(fn)` | Escuchar altas/bajas |

## Contrato del componente

- Ocupá `height: 100%` del contenedor (la ventana ya trae chrome).
- Recibís `NexAppProps` (bag libre: `fileId`, URLs, etc.).
- Podés usar hooks del host: `useWindowManager`, `useSettings` (desde `@/sdk/host` en el repo).

## Hooks del shell (host)

Dentro del monorepo NEX OS:

```ts
import { useWindowManager, useSettings } from '../sdk/host';
// desde src/community-apps/MiApp.tsx

const { openWindow, closeWindow } = useWindowManager();
const { accentColor, addNotification } = useSettings();
```

Ejemplo listo: `src/community-apps/HelloNex.tsx` (aparece en Start / Taskbar / Buscar).

## Publicar (futuro)

Cuando el package se publique a npm:

```bash
npm install @nex-os/sdk
```

Versión actual: **0.1.0** (API estable para registro; host hooks siguen en el shell).
