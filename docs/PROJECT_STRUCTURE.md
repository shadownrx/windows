# 🏗️ Estructura del Proyecto - WebOS

Esta documentación explica la organización de archivos y carpetas del proyecto.

---

## 📁 Vista General

```
windows/
├── src/                       # Código fuente principal
├── assembly/                  # Código WebAssembly
├── public/                    # Archivos estáticos
├── docs/                      # Documentación
├── dist/                      # Build compilado (generado)
├── build/                     # WASM compilado (generado)
├── node_modules/              # Dependencias (generado)
│
├── package.json               # Dependencias del proyecto
├── tsconfig.json              # Configuración de TypeScript
├── vite.config.ts             # Configuración de Vite
├── tailwind.config.js         # Configuración de Tailwind
├── eslint.config.js           # Configuración de ESLint
├── asconfig.json              # Configuración de AssemblyScript
│
├── README.md                  # Descripción del proyecto
├── CONTRIBUTING.md            # Guía de contribución
└── CODE_OF_CONDUCT.md         # Código de conducta
```

---

## 📂 Carpeta `src/` - Código Principal

```
src/
├── components/
│   ├── apps/                  # Aplicaciones del escritorio
│   ├── system/                # Componentes del sistema
│   ├── nexos/                 # Escritorios (NEX OS)
│   │
│   ├── Desktop.tsx            # Componente principal del escritorio
│   ├── Window.tsx             # HOC para todas las ventanas
│   ├── Taskbar.tsx            # Barra de tareas
│   ├── StartMenu.tsx          # Menú de Inicio
│   ├── ContextMenu.tsx        # Menú contextual
│   └── ... (otros componentes)
│
├── context/
│   ├── WindowManager.tsx      # Gestor central de ventanas
│   ├── FileSystemContext.tsx  # Sistema de archivos virtual
│   ├── SettingsContext.tsx    # Configuración global
│   └── UIContext.tsx          # Estado de UI global
│
├── utils/
│   ├── cppEngine.ts           # Motor de compilación C++
│   ├── gpuCharts.ts           # Gráficos acelerados por GPU
│   └── ... (utilidades)
│
├── constants/
│   └── apps.tsx               # Definiciones de aplicaciones
│
├── assets/
│   ├── images/                # Imágenes
│   ├── icons/                 # Iconos
│   └── ...
│
├── App.tsx                    # Componente raíz
├── App.css                    # Estilos globales
├── main.tsx                   # Punto de entrada
├── vite-env.d.ts              # Tipos de Vite
└── index.css                  # Estilos de Tailwind
```

---

## 🔹 Componentes Principales (`src/components/`)

### 📱 `apps/` - Aplicaciones del Escritorio

Cada aplicación es un componente independiente:

```
apps/
├── FileExplorer.tsx           # Explorador de archivos
├── BrowserApp.tsx             # Navegador web
├── Terminal.tsx               # Terminal de comandos
├── Paint.tsx                  # Editor de imágenes
├── Notepad.tsx                # Editor de texto
├── Calculator.tsx             # Calculadora
├── TaskManager.tsx            # Administrador de tareas
├── Settings.tsx               # Panel de configuración
├── IEApp.tsx                  # Internet Explorer
├── VsCode.tsx                 # Visual Studio Code
├── DevCpp2026.tsx             # Dev-C++ 2026
├── MediaPlayer.tsx            # Reproductor multimedia
├── ImageViewer.tsx            # Visor de imágenes
├── Calendar.tsx               # Calendario
├── counter.tsx                # Aplicación de contador
├── Cmd.tsx                    # Símbolo del sistema
├── ManualApp.tsx              # Manual del sistema
├── ControlPanel.tsx           # Panel de control
├── RecycleBin.tsx             # Papelera de reciclaje
├── SearchApp.tsx              # Buscador
├── WordPad.tsx                # WordPad
└── WindowsDefender.tsx        # Windows Defender
```

**Estructura de una Aplicación:**
```typescript
interface MyAppProps {
  id: string;
}

export const MyApp: React.FC<MyAppProps> = ({ id }) => {
  return (
    <div className="bg-white p-4">
      {/* Contenido de la aplicación */}
    </div>
  );
};
```

### 🖥️ `system/` - Componentes del Sistema

Componentes que no son aplicaciones pero forman parte del OS:

```
system/
├── Background3D.tsx           # Fondo de pantalla 3D
├── BootScreen.tsx             # Pantalla de inicio
├── LoginScreen.tsx            # Pantalla de login
├── OffScreen.tsx              # Pantalla apagada
├── ShutdownScreen.tsx         # Pantalla de apagado
├── RestartScreen.tsx          # Pantalla de reinicio
├── UEFI.tsx                   # Pantalla UEFI
├── TaskView.tsx               # Vista de tareas
├── WindowsBoot.tsx            # Animación de arranque
├── NotificationToast.tsx      # Notificaciones
├── WidgetsPanel.tsx           # Panel de widgets
│
├── 3d/
│   ├── CyberpunkBG.tsx        # Fondo Cyberpunk
│   ├── MatrixBG.tsx           # Fondo Matrix
│   └── SynthwaveBG.tsx        # Fondo Synthwave
│
└── widgets/
    ├── WeatherWidget.tsx      # Widget de clima
    ├── NewsWidget.tsx         # Widget de noticias
    └── StocksWidget.tsx       # Widget de acciones
```

---

## 🧠 Contextos (`src/context/`)

Los contextos manejan el estado global de la aplicación.

### `WindowManager.tsx`

**Responsabilidades:**
- Gestionar ventanas abiertas
- Controlar z-index
- Manejar escritorios virtuales
- Gestionar el menú de Inicio

**Métodos principales:**
```typescript
interface WindowManagerContextType {
  windows: AppWindow[];
  activeDesktop: string;
  isStartMenuOpen: boolean;
  
  openWindow: (id, title, icon, content) => void;
  closeWindow: (id) => void;
  minimizeWindow: (id) => void;
  // ... más métodos
}
```

### `FileSystemContext.tsx`

**Responsabilidades:**
- Gestionar archivos virtuales
- Navegar por directorios
- Abrir/crear/eliminar archivos

### `SettingsContext.tsx`

**Responsabilidades:**
- Almacenar preferencias del usuario
- Tema del sistema
- Idioma
- Volumen
- Otras configuraciones

### `UIContext.tsx`

**Responsabilidades:**
- Tamaño de la pantalla
- Modo oscuro/claro
- Otros estados de UI

---

## ⚙️ Configuración (`assembly/`)

WebAssembly optimizado para tareas intensivas:

```
assembly/
├── index.ts                   # Código principal
└── tsconfig.json              # Configuración TS para WASM
```

**Uso típico:**
```typescript
// assembly/index.ts
export function calculateMetrics(data: f64[]): f64 {
  // Cálculos intensivos en WASM
  let sum: f64 = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  return sum / f64(data.length);
}
```

---

## 📦 Carpeta `public/`

Archivos estáticos que se sirven directamente:

```
public/
├── process_utils.js           # WASM compilado
├── process_utils.d.ts         # Tipos TypeScript para WASM
└── robots.txt                 # Configuración para crawlers
```

---

## 📚 Archivos de Configuración

### `package.json`
Define dependencias y scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "asbuild": "asc assembly/index.ts -t public/"
  }
}
```

### `tsconfig.json`
Configuración de TypeScript:
- `strict: true` - Modo estricto
- `jsx: react-jsx` - Soporte para React 18
- `moduleResolution: bundler` - Resolución moderna

### `vite.config.ts`
Configuración de Vite:
- Plugin de React
- Definición de alias
- Configuración de optimización

### `tailwind.config.js`
Temas y tokens de color:
```javascript
theme: {
  colors: {
    // Colores personalizados para temas
    cyberpunk: { ... },
    matrix: { ... },
  }
}
```

### `asconfig.json`
Configuración de AssemblyScript:
```json
{
  "targets": {
    "release": {
      "outFile": "public/process_utils.js"
    }
  }
}
```

---

## 🎯 Flujo de Datos

```
User Interaction
        ↓
Component
        ↓
useWindowManager() / useFileSystem() / useSettings()
        ↓
Context (Estado Global)
        ↓
Re-render de Componentes
```

---

## 📊 Tamaños Típicos de Archivos

- `public/process_utils.wasm` - ~50KB (comprimido)
- `dist/` (producción) - ~800KB (sin comprimir)
- `dist/` (con gzip) - ~250KB

---

## 🔄 Cambios Comunes

### Agregar una Nueva Aplicación
1. Crear archivo en `src/components/apps/`
2. Registrar en `constants/apps.tsx`
3. Importar en `WindowManager.tsx`

### Agregar un Nuevo Widget
1. Crear en `src/components/system/widgets/`
2. Importar en `WidgetsPanel.tsx`

### Modificar Estilos Globales
- Editar `src/index.css` o `src/App.css`
- Usar clases de Tailwind

### Agregar Variables de Entorno
- Crear `.env.local`
- Acceder con `import.meta.env.VITE_*`

---

## 📚 Referencias

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Cómo desarrollar
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura
- [API_REFERENCE.md](./API_REFERENCE.md) - Referencia de APIs
