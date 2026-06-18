

# 🌌 NEX-OS Operating System

**WebOS** es una experiencia de computación de próxima generación construida enteramente para la web. No es simplemente un clon de una interfaz; es un ecosistema de aplicaciones de alto rendimiento desarrollado con **React 19**, **TypeScript**, **AssemblyScript (WASM)** y **Three.js**. WebOS redefine lo que es posible en un navegador, fusionando estética *Premium* con ingeniería de sistemas avanzada.

> [!TIP]
> **🌐 Demo en Vivo:** [https://windows-seven-rose.vercel.app/](https://windows-seven-rose.vercel.app/)
>
> **📖 Documentación Completa:** Consulta la carpeta [docs/](./docs/) para guías detalladas.

---

## ✨ Características Destacadas

### 🚀 Ingeniería de Alto Rendimiento
- **Ensamblado con WASM:** Lógica de cálculo crítico (Administrador de Tareas) optimizada con **AssemblyScript** para ejecución a velocidad nativa.
- **Motor 3D Dinámico:** Fondos tridimensionales en tiempo real impulsados por **Three.js / @react-three/fiber** que reaccionan al tema seleccionado.
- **Arquitectura de Micro-Frontends:** Cada aplicación opera en su propio contexto aislado bajo un orquestador central (`WindowManager`).
- **PWA Ready:** Instalable como app nativa gracias a `vite-plugin-pwa`, con soporte offline y caché de recursos.

### 🍱 Experiencia de Usuario (UX)
- **NEX OS 2.0 — Neon Experience:** Sistema de temas dinámicos: **Cyberpunk**, **Matrix** y **Synthwave** con bordes luminosos y efectos visuales adaptativos.
- **Snap Layouts:** Acopiamiento de ventanas en mitades y cuadrantes (estilo Windows 11), con memoria de tamaño al restaurar.
- **Escritorios Virtuales:** Múltiples espacios de trabajo con persistencia de estado y atajos de teclado (`Win+Ctrl+←/→`).
- **Ciclo de Vida Completo:** Pantallas de UEFI → POST → Boot → Login → Escritorio → Suspender → Apagar → Reiniciar.

### 🛠️ Aplicaciones Integradas (18+)

| Aplicación | Descripción |
| :--- | :--- |
| 🗂️ **File Explorer** | Navegación de archivos virtuales con vista árbol/lista y arrastrar-y-soltar. |
| 🌐 **NexBrowser Pro** | Navegador integrado con soporte para YouTube, historial por pestaña y modo privado. |
| 💻 **Dev-C++ 2026** | IDE con resaltado de sintaxis, compilación real con `g++` y ejecución de binarios. |
| 🖼️ **Nex Code** | Editor de código completo con soporte para la creación de software interno|
| 📝 **Notepad 2.0** | Editor de texto avanzado con barra de menús, zoom, fuentes, contador de palabras y status bar. |
| 🕐 **Reloj** | Reloj analógico + digital, cronómetro con vueltas, temporizador circular y zonas horarias mundiales. |
| 📷 **Fotos** | Galería de imágenes con lightbox, zoom, rotación, tira de miniaturas y soporte de URLs personalizadas. |
| 📊 **Task Manager** | Monitoreo en tiempo real (WASM) de CPU, memoria, procesos y servicios reales del sistema. |
| 🎨 **Paint** | Editor de dibujo con herramientas, paleta de colores y lienzo exportable. |
| 🖩 **Calculadora** | Calculadora funcional con historial de operaciones. |
| 📅 **Calendario** | Vista mensual con eventos y selector de fecha. |
| 💬 **Símbolo del Sistema** | Terminal con comandos simulados (`dir`, `echo`, `cls`, etc.). |
| ⚙️ **Panel de Control** | Configuración completa: wallpaper, tema neon, brillo, volumen, acento de color. |

---

## 🏗️ Arquitectura del Sistema

```
App.tsx
├── SettingsProvider        ← Preferencias del usuario (tema, volumen, wallpaper…)
├── FileSystemProvider      ← Sistema de archivos virtual
├── DesktopProvider         ← Íconos y escritorios virtuales
├── UIProvider              ← Estado de UI (Start, Widgets, Switcher…)
└── WindowManagerProvider   ← Ciclo de vida de ventanas y foco
    └── AppContent          ← Máquina de estados del OS
        ├── OffScreen / BootScreen / WindowsBoot / UEFI
        ├── LoginScreen
        └── Desktop (Windows) | NexDesktop (NEX OS)
            ├── Background3D
            ├── Window × N  ← Cada ventana abierta
            ├── Taskbar
            ├── StartMenu
            └── Overlays (ContextMenu, TaskView, Widgets…)
```

**Flujo de datos:**
```
User Interaction → Component → Hook (useWindowManager / useSettings…) → Context → Re-render
```

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| **React** | 19.x | Biblioteca base para UI reactiva. |
| **TypeScript** | ~5.9 | Tipado estricto para una base de código robusta. |
| **Vite** | 8.x | Bundler de última generación con HMR instantáneo. |
| **Tailwind CSS** | 3.x | Estilizado utilitario y tokens de diseño. |
| **Framer Motion** | 12.x | Animaciones fluidas y transiciones de ventanas. |
| **Three.js / R3F** | 0.183 | Fondos 3D dinámicos con aceleración GPU. |
| **AssemblyScript** | 0.28 | Compilación a WASM para procesamiento intensivo. |
| **RUST** | 22.1.2 | Compilación para leer los componentes |
| **@fluentui/react-icons** | 2.x | Iconografía del sistema estilo Fluent Design. |
| **vite-plugin-pwa** | 1.x | Instalación como PWA con soporte offline. |

---

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **npm** 9+

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/shadownrx/windows.git
cd windows

# Instalar dependencias
npm install

# Compilar módulos de AssemblyScript (opcional)
npm run build:as

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación se ejecutará en `http://localhost:5173`

### Compilación para Producción

```bash
npm run build      # Compila TypeScript + genera dist/
npm run preview    # Vista previa local del build
```

> [!NOTE]
> El build de producción genera ~1.8 MB sin comprimir (~499 KB gzip). Se recomienda activar Brotli en el servidor de hosting para máxima performance.

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
| :--- | :--- |
| `Win + D` | Minimizar todas las ventanas |
| `Win + R` | Abrir cuadro Ejecutar |
| `Win + E` | Abrir Explorador de archivos |
| `Win + Tab` | Vista de tareas |
| `Win + Ctrl + →/←` | Cambiar escritorio virtual |
| `Alt + F4` | Cerrar ventana enfocada |
| `Ctrl + S` | Guardar (en Notepad, VS Code, etc.) |

---

## 📖 Documentación

- **[INSTALLATION.md](./docs/INSTALLATION.md)** — Guía detallada de instalación y configuración
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** — Flujo de trabajo y convenciones de desarrollo
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Arquitectura del sistema en profundidad
- **[API_REFERENCE.md](./docs/API_REFERENCE.md)** — Referencia completa de hooks y APIs
- **[WASM_BRIDGE.md](./docs/WASM_BRIDGE.md)** — Guía de integración WebAssembly
- **[PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)** — Estructura de archivos y carpetas
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Guía de contribución

---

## ⚙️ Configuración

| Archivo | Propósito |
| :--- | :--- |
| `vite.config.ts` | Vite + plugin PWA + puente de procesos PowerShell |
| `tailwind.config.js` | Temas y tokens de color |
| `tsconfig.json` | Configuración TypeScript estricta |
| `asconfig.json` | Configuración AssemblyScript → WASM |

---

> [!NOTE]
> Este proyecto es una demostración técnica de capacidades frontend modernas y no está afiliado a Microsoft ni a Spotify.

© 2026 Salvador Juarez.