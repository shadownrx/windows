# `@nex-os/sdk`

```
 ┌─────────────────────────────────────────┐
 │  NEX OS                                 │
 │   ┌──────────┐  ┌──────────┐            │
 │   │ Tu app   │  │ Hello NEX│  ← defineApp()
 │   └──────────┘  └──────────┘            │
 │         ▲              ▲                │
 │         └──── registry ┘                │
 │              @nex-os/sdk                │
 └─────────────────────────────────────────┘
```

**La API oficial para crear apps dentro de NEX OS.**  
Registrás un manifest. El shell te da ventana, taskbar, Start y Buscar.

[Guía completa → `docs/SDK.md`](../../docs/SDK.md) · Versión **0.1.0**

---

## 30 segundos

```tsx
import { defineApp, type NexAppProps } from '@nex-os/sdk';

function MiApp(_props: NexAppProps) {
  return (
    <div style={{ height: '100%', padding: 24, color: '#fff', background: '#0b1220' }}>
      <h1>Hola NEX</h1>
    </div>
  );
}

export default defineApp({
  id: 'mi-app',
  appId: 'mi-app',
  title: 'Mi App',
  icon: <span>⚡</span>,
  component: MiApp,
  pinToTaskbar: true,
  category: 'tools',
});
```

1. Guardá el archivo en `src/community-apps/`
2. `import './MiApp'` en `src/community-apps/index.ts`
3. `npm run dev` → Buscar → **Mi App**

---

## API

| | |
| :--- | :--- |
| `defineApp(manifest)` | Registra y devuelve |
| `registerApp` / `unregisterApp` | Alta / baja manual |
| `getRegisteredApp` / `listRegisteredApps` | Lookup |
| `getCommunityLauncherItems` | Items para dock / search |
| `subscribeRegistry` | Escuchar cambios |

Tipos: `NexAppManifest`, `NexAppProps`, `NexLauncherItem`.

---

## Host hooks

```ts
import { useWindowManager, useSettings } from '../sdk/host';
```

Abrí ventanas, leé el acento del SO, mandá notificaciones. Detalle en la [guía](../../docs/SDK.md#hooks-del-host).

---

## En el monorepo

```bash
# ya linkeado
import { defineApp } from '@nex-os/sdk';
```

Workspace: `packages/*` · alias Vite/TS → `packages/nex-os-sdk/src`

Demos in-OS: **SDK Docs** · **Hello NEX**

---

## Licencia

MIT · Hecho para [NEX OS](https://github.com/shadownrx/windows)
