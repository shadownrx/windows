# NEX OS SDK

**`@nex-os/sdk`** — la API oficial para crear apps que viven dentro de NEX OS.

Abrí una ventana, anclala a la taskbar, aparecé en Buscar y en el Menú Inicio. Sin tocar el núcleo del shell: registrás un manifest y listo.

| | |
| :--- | :--- |
| **Package** | [`packages/nex-os-sdk`](../packages/nex-os-sdk) |
| **Versión** | `0.1.0` |
| **Demo in-OS** | App **SDK Docs** / **Hello NEX** |
| **Ejemplo** | [`src/community-apps/HelloNex.tsx`](../src/community-apps/HelloNex.tsx) |

---

## Por qué existe

Las apps built-in viven hardcodeadas en `AppRegistry` + `constants/apps`. Eso escala mal si la comunidad quiere sumar cosas.

El SDK abre un **registro en runtime**:

```
defineApp(manifest)
        │
        ▼
  community registry  ──►  AppRegistry / Taskbar / Start / Search
```

Vos escribís React. El host se encarga de ventanas, focus, minimize y chrome.

---

## Quick start (≈ 2 minutos)

### 1. Creá el módulo

```tsx
// src/community-apps/MiApp.tsx
import React from 'react';
import { defineApp, type NexAppProps } from '@nex-os/sdk';

function MiApp(_props: NexAppProps) {
  return (
    <div style={{ height: '100%', padding: 24, color: '#e8f0ff', background: '#0b1220' }}>
      <h1 style={{ margin: 0 }}>Mi App</h1>
      <p style={{ opacity: 0.7 }}>Corriendo dentro de NEX OS.</p>
    </div>
  );
}

export default defineApp({
  id: 'mi-app',
  appId: 'mi-app',
  title: 'Mi App',
  icon: <span style={{ fontSize: 18 }}>⚡</span>,
  component: MiApp,
  description: 'Mi primera community app',
  author: '@vos',
  version: '0.1.0',
  pinToTaskbar: true,
  category: 'tools',
});
```

### 2. Importalo al boot

```ts
// src/community-apps/index.ts
import './HelloNex';
import './SdkDocs';
import './MiApp'; // ← tu app
```

`main.tsx` ya importa `./community-apps`, así que el side-effect de `defineApp` registra la app al arrancar.

### 3. Corré el OS

```bash
npm run dev
```

Abrí **Buscar** → escribí el título → Enter. Si `pinToTaskbar: true`, también aparece en el dock.

---

## Manifest (`NexAppManifest`)

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :---: | :--- |
| `id` | `string` | ✓ | Id de ventana (único por escritorio) |
| `appId` | `string` | ✓ | Clave que resuelve `AppRegistry` |
| `title` | `string` | ✓ | Título en chrome / taskbar / Start |
| `icon` | `ReactNode` | ✓ | Fluent icon, SVG o emoji |
| `component` | `ComponentType` | ✓ | UI raíz (`height: 100%`) |
| `aliases` | `string[]` | | Alias extras de `appId` |
| `description` | `string` | | Texto de catálogo |
| `author` | `string` | | Handle del creador |
| `version` | `string` | | Semver informativa |
| `defaultProps` | `object` | | Props al abrir |
| `pinToTaskbar` | `boolean` | | Visible en dock aunque esté cerrada |
| `category` | union | | `tools` \| `media` \| `games` \| `dev` \| `social` \| `other` |

`id` y `appId` suelen coincidir. Separalos si necesitás varias ventanas del mismo componente.

---

## API del package

```ts
import {
  defineApp,
  registerApp,
  unregisterApp,
  getRegisteredApp,
  listRegisteredApps,
  getCommunityLauncherItems,
  subscribeRegistry,
} from '@nex-os/sdk';
```

| Función | Qué hace |
| :--- | :--- |
| `defineApp(m)` | Registra + devuelve el manifest (lo habitual) |
| `registerApp(m)` | Solo registra |
| `unregisterApp(appId)` | Saca del registry dinámico |
| `getRegisteredApp(appId)` | Lookup (respeta aliases) |
| `listRegisteredApps()` | Manifests únicos |
| `getCommunityLauncherItems()` | Items listos para Taskbar/Search |
| `subscribeRegistry(fn)` | Callback en altas/bajas → `() => void` unsubscribe |

---

## Hooks del host

Las community apps corren **dentro** del árbol de providers de NEX. Desde `src/community-apps/`:

```ts
import {
  useWindowManager,
  useSettings,
  useDesktop,
  useFileSystem,
  useUI,
} from '../sdk/host';
```

### `useWindowManager`

| Método / valor | Uso |
| :--- | :--- |
| `openWindow(id, appId, title, icon, props?)` | Abrir / restaurar ventana |
| `closeWindow(id)` | Cerrar |
| `minimizeWindow(id)` | Minimizar |
| `maximizeWindow(id, size?)` | Maximizar |
| `focusWindow(id)` | Traer al frente |
| `windows` / `focusedWindowId` | Estado actual |

### `useSettings`

| Valor / método | Uso |
| :--- | :--- |
| `accentColor` / `setAccentColor` | Acento del SO |
| `addNotification(title, message, icon?)` | Toast del sistema |
| `userName` / `volume` / `isWifiEnabled` | Preferencias |

También: `useDesktop`, `useFileSystem`, `useUI` para escritorios virtuales, FS virtual y widgets.

---

## Contrato de la UI

1. **Ocupá todo el alto** — `height: '100%'` / `flex: 1`. El chrome de ventana ya está.
2. **No dibujés titlebar propia** — NEX lo provee.
3. **Props libres** — `NexAppProps` es un bag (`fileId`, URLs, etc.).
4. **Lazy mental** — el component se monta al abrir la ventana; evitá trabajo pesado en el top-level del módulo salvo el `defineApp`.

---

## Recetas

### Abrir otra app desde la tuya

```tsx
const { openWindow } = useWindowManager();

openWindow('notepad', 'notepad', 'Bloc de notas', <span>📝</span>);
```

### Notificación del sistema

```tsx
const { addNotification, accentColor } = useSettings();

addNotification('Mi App', `Listo. Acento: ${accentColor}`);
```

### Props al abrir

```tsx
defineApp({
  // ...
  defaultProps: { mode: 'demo' },
  component: ({ mode }) => <div>Modo: {String(mode)}</div>,
});
```

Desde el host / otra app:

```ts
openWindow('mi-app', 'mi-app', 'Mi App', icon, { mode: 'pro' });
```

### Alias para Buscar / Run

```tsx
defineApp({
  id: 'stats',
  appId: 'stats',
  aliases: ['analytics', 'metrics'],
  // ...
});
```

---

## Layout del monorepo

```
packages/nex-os-sdk/          ← package @nex-os/sdk
  src/types.ts
  src/registry.ts
  src/index.ts
  README.md

src/sdk/host.ts               ← re-exports de contextos del shell
src/community-apps/           ← tus apps (side-effect register)
src/hooks/useLauncherApps.ts  ← merge built-in + community
src/components/AppRegistry.tsx
```

Alias Vite/TS:

```ts
'@nex-os/sdk' → packages/nex-os-sdk/src
```

Workspace npm: `"@nex-os/sdk": "*"` en el root.

---

## Built-in vs community

| | Built-in | Community (`@nex-os/sdk`) |
| :--- | :--- | :--- |
| Registro | `AppRegistry` + `constants/apps` | `defineApp` |
| Lazy load | `React.lazy` | Componente en el bundle de community |
| Catálogo | Hardcode Start/Taskbar | Registry dinámico |
| Ideal para | Apps del sistema | Experimentos, forks, demos |

Cuando una community app madure, podés “promocionarla” a built-in lazy.

---

## Roadmap

- [ ] Publicar `@nex-os/sdk` en npm
- [ ] Catálogo remoto / install de apps
- [ ] Sandbox / permisos por app
- [ ] Plantilla `create-nex-app`

Versión actual: **0.1.0** — API de registro estable; hooks de host viven en el shell (`src/sdk/host.ts`).

---

## Links

- Package README: [`packages/nex-os-sdk/README.md`](../packages/nex-os-sdk/README.md)
- Demo: app **SDK Docs** dentro de NEX OS
- Contribución: [`CONTRIBUTING.md`](../CONTRIBUTING.md)
