# Referencia de API de WebOS

WebOS ofrece una serie de hooks de React que permiten a las aplicaciones interactuar con el "núcleo" del sistema operativo. Esta documentación detalla todos los hooks disponibles y cómo usarlos.

---

## 🪟 `useWindowManager()`

Este es el hook más importante. Permite controlar las ventanas y el entorno del sistema.

### Métodos Principales

| Método | Descripción | Parámetros | Retorna |
| :--- | :--- | :--- | :--- |
| `openWindow` | Abre una nueva aplicación. | `id: string, title: string, icon: ReactNode, content: ReactNode` | `void` |
| `closeWindow` | Cierra una ventana activa. | `id: string` | `void` |
| `minimizeWindow` | Minimiza una ventana a la barra de tareas. | `id: string` | `void` |
| `maximizeWindow` | Alterna el estado de maximizado. | `id: string` | `void` |
| `focusWindow` | Trae una ventana al primer plano. | `id: string` | `void` |
| `switchDesktop` | Cambia el escritorio virtual activo. | `desktopId: string` | `void` |
| `toggleStart` | Abre o cierra el Menú de Inicio. | - | `void` |
| `getWindowById` | Obtiene los datos de una ventana específica. | `id: string` | `AppWindow \| undefined` |
| `getAllWindows` | Obtiene todas las ventanas abiertas. | - | `AppWindow[]` |
| `minimizeAll` | Minimiza todas las ventanas. | - | `void` |

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
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface WindowManagerContextType {
  windows: AppWindow[];
  activeDesktop: string;
  isStartMenuOpen: boolean;
  desktopIcons: DesktopIcon[];
  // Métodos...
}
```

### Ejemplo de Uso

```typescript
import { useWindowManager } from '../context/WindowManager';

export const MyApp = () => {
  const { openWindow, closeWindow, focusWindow } = useWindowManager();

  return (
    <button onClick={() => {
      openWindow('myapp-1', 'Mi Aplicación', <IconComponent />, <AppContent />);
    }}>
      Abrir Aplicación
    </button>
  );
};
```

---

## 📂 `useFileSystem()`

Permite interactuar con el sistema de archivos virtual.

### Propiedades

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `files` | `VirtualFile[]` | Lista de archivos en el directorio actual. |
| `currentPath` | `string` | Ruta actual en el sistema de archivos. |
| `parentPath` | `string` | Ruta del directorio padre. |
| `isLoading` | `boolean` | Indica si se está cargando contenido. |

### Métodos Principales

| Método | Descripción | Parámetros | Retorna |
| :--- | :--- | :--- | :--- |
| `navigate` | Cambia a una carpeta diferente. | `path: string` | `void` |
| `openFile` | Selecciona un archivo para abrirlo. | `file: VirtualFile` | `void` |
| `createFolder` | Crea una nueva carpeta. | `name: string` | `void` |
| `deleteFile` | Elimina un archivo o carpeta. | `path: string` | `void` |
| `getFileContent` | Obtiene el contenido de un archivo. | `path: string` | `string \| Buffer` |

### Tipos de Datos

```typescript
interface VirtualFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  modified: Date;
  extension?: string;
  content?: string;
  isHidden?: boolean;
}
```

### Ejemplo de Uso

```typescript
import { useFileSystem } from '../context/FileSystemContext';

export const FileExplorer = () => {
  const { files, currentPath, navigate, openFile } = useFileSystem();

  return (
    <div>
      <p>Ubicación: {currentPath}</p>
      {files.map(file => (
        <div key={file.id} onClick={() => {
          if (file.type === 'folder') {
            navigate(file.path);
          } else {
            openFile(file);
          }
        }}>
          {file.name}
        </div>
      ))}
    </div>
  );
};
```

---

## ⚙️ `useSettings()`

Permite acceder y modificar la configuración del sistema.

### Propiedades

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `theme` | `'light' \| 'dark' \| 'cyberpunk' \| 'matrix' \| 'synthwave'` | Tema actual del sistema. |
| `language` | `'es' \| 'en'` | Idioma del sistema. |
| `volume` | `number` (0-100) | Volumen del sistema. |
| `wallpaper` | `string` | URL o ID del fondo de pantalla. |
| `autoHideTaskbar` | `boolean` | Si la barra de tareas se oculta automáticamente. |

### Métodos Principales

| Método | Descripción | Parámetros | Retorna |
| :--- | :--- | :--- | :--- |
| `setTheme` | Cambia el tema del sistema. | `theme: ThemeType` | `void` |
| `setLanguage` | Cambia el idioma. | `language: LanguageType` | `void` |
| `setVolume` | Ajusta el volumen. | `volume: number` | `void` |
| `setWallpaper` | Cambia el fondo de pantalla. | `wallpaper: string` | `void` |
| `updateSetting` | Actualiza cualquier configuración. | `key: string, value: any` | `void` |
| `resetToDefaults` | Restaura la configuración predeterminada. | - | `void` |

### Ejemplo de Uso

```typescript
import { useSettings } from '../context/SettingsContext';

export const SettingsPanel = () => {
  const { theme, setTheme, volume, setVolume } = useSettings();

  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
        <option value="light">Claro</option>
        <option value="dark">Oscuro</option>
        <option value="cyberpunk">Cyberpunk</option>
      </select>
      
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </div>
  );
};
```

---

## 🎨 `useUI()`

Proporciona acceso a valores del contexto de UI global.

### Propiedades

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `isMobile` | `boolean` | Indica si la vista es móvil. |
| `screenSize` | `{ width: number; height: number }` | Tamaño actual de la pantalla. |
| `isDarkMode` | `boolean` | Si el modo oscuro está activo. |

---

## 🎯 Mejores Prácticas

1. **Uso de Hooks en Componentes Funcionales**
   - Siempre usa los hooks en el cuerpo principal del componente
   - No uses hooks de forma condicional

2. **Gestión de Estado**
   - Usa `useWindowManager` para operaciones globales
   - Mantén el estado local para datos específicos del componente

3. **Rendimiento**
   - Envuelve aplicaciones complejas con `React.memo()` si es necesario
   - Usa `useMemo` y `useCallback` para optimizar re-renders

4. **Tipado TypeScript**
   - Siempre tipifica las props de tus componentes
   - Define interfaces para objetos complejos

---

## 📝 Ejemplo Completo: Aplicación Simple

```typescript
import React from 'react';
import { useWindowManager } from '../context/WindowManager';
import { useSettings } from '../context/SettingsContext';

interface MiAppProps {
  id: string;
}

export const MiApp: React.FC<MiAppProps> = ({ id }) => {
  const { closeWindow } = useWindowManager();
  const { theme } = useSettings();

  return (
    <div className={`bg-${theme === 'dark' ? 'gray-800' : 'white'} p-4`}>
      <h1>Mi Aplicación</h1>
      <p>Tema actual: {theme}</p>
      <button onClick={() => closeWindow(id)}>Cerrar</button>
    </div>
  );
};
```

---

Para más información sobre la arquitectura del sistema, consulta [ARCHITECTURE.md](./ARCHITECTURE.md).

Gestiona las preferencias del usuario.

### Propiedades

*   **`wallpaper`**: URL o gradiente de fondo actual.
*   **`theme`**: 'light' | 'dark'.
*   **`accentColor`**: El color de énfasis del sistema.

---

Para aprender cómo optimizar tus aplicaciones con WebAssembly, visita la [Guía de Integración WASM](./WASM_BRIDGE.md).
