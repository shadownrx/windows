# Referencia de API de WebOs

NEX ofrece una serie de hooks de React que permiten a las aplicaciones interactuar con el "núcleo" del sistema operativo.

## 🪟 `useWindowManager()`

Este es el hook más importante. Permite controlar las ventanas y el entorno del sistema.

### Métodos Principales

| Método | Descripción | Parámetros |
| :--- | :--- | :--- |
| `openWindow` | Abre una nueva aplicación. | `id, title, icon, content` |
| `closeWindow` | Cierra una ventana activa. | `id` |
| `minimizeWindow` | Minimiza una ventana a la barra de tareas. | `id` |
| `maximizeWindow` | Alterna el estado de maximizado. | `id` |
| `focusWindow` | Trae una ventana al primer plano. | `id` |
| `switchDesktop` | Cambia el escritorio virtual activo. | `desktopId` |
| `toggleStart` | Abre o cierra el Menú de Inicio. | - |

### Tipos de Datos

```typescript
interface AppWindow {
  id: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
  desktopId: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}
```

## 📂 `useFileSystem()`

Permite interactuar con el sistema de archivos virtual.

### Métodos Principales

| Método | Descripción |
| :--- | :--- |
| `files` | Lista de archivos en el directorio actual. |
| `currentPath` | String con la ruta actual. |
| `navigate` | Cambia a una carpeta diferente. |
| `openFile` | Selecciona un archivo para abrirlo con su aplicación asociada. |

## ⚙️ `useSettings()`

Gestiona las preferencias del usuario.

### Propiedades

*   **`wallpaper`**: URL o gradiente de fondo actual.
*   **`theme`**: 'light' | 'dark'.
*   **`accentColor`**: El color de énfasis del sistema.

---

Para aprender cómo optimizar tus aplicaciones con WebAssembly, visita la [Guía de Integración WASM](./WASM_BRIDGE.md).
