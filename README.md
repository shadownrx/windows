# 🌌 Nex - Web Operating System
**Powered by Salvador**

**Nex** es un entorno de escritorio de alto rendimiento desarrollado íntegramente en **React 18**, **TypeScript** y **Vite**. Este proyecto no es solo una interfaz visual; es un sistema de gestión de aplicaciones (Web OS) que recrea la experiencia de un sistema operativo nativo dentro del navegador, con un enfoque obsesivo en el *Pixel Perfect* y la fluidez del usuario.

> **🌐 Live Demo:** [https://windows-seven-rose.vercel.app/](https://windows-seven-rose.vercel.app/)

---

### 🚀 Características de Ingeniería

* **🖥️ Virtual Desktops (Multitarea):** Gestión dinámica de hasta 5 escritorios independientes con persistencia de estado y swtiching fluido.
* **📂 File Explorer Engine:** Sistema de archivos simulado con reconocimiento de extensiones, navegación por directorios y visor de imágenes interactivo (`.png`, `.jpg`).
* **🌐 Integrated Web Browser:** Navegador funcional dentro del ecosistema que permite navegar la red real sin salir de la aplicación.
* **📅 System UI & Widgets:** Calendario dinámico en tiempo real, barra de tareas (Taskbar) con lógica de Z-Index para ventanas y bandeja de sistema (System Tray).
* **🎨 Glassmorphism Design:** Interfaz moderna con efectos de desenfoque (blur), esquinas redondeadas y animaciones suaves para una experiencia inmersiva.

---

### 🛠️ Stack Tecnológico

* **Core:** [React 18](https://reactjs.org/) & [TypeScript](https://www.typescriptlang.org/) (Strict Mode).
* **Bundler:** [Vite](https://vitejs.dev/) para un desarrollo y compilación ultra rápidos.
* **Styling:** Tailwind CSS + Custom CSS para efectos de transparencia y sombreado.
* **Deployment:** [Vercel CI/CD](https://vercel.com/) con optimización de build.

---

### 🏛️ Arquitectura del Sistema

El proyecto sigue una estructura de **Componentes Atómicos** para garantizar la escalabilidad:
* `src/components/apps`: Lógica aislada para aplicaciones (Cmd, VsCode, File Explorer).
* `src/components/Window`: HOC (Higher Order Component) que gestiona el ciclo de vida de las ventanas (foco, maximizado, cierre).
* `src/components/Taskbar`: Orquestador de procesos activos y cambio de entornos.

---

### 🔧 Instalación y Ejecución

Si querés explorar el "corazón" de este proyecto localmente:

```bash
# 1. Clonar el repositorio
git clone [https://github.com/tu-usuario/souls.git](https://github.com/tu-usuario/souls.git)

# 2. Instalar las dependencias (el combustible)
npm install

# 3. Lanzar el entorno de desarrollo
npm run dev

# 4. Compilar para producción
npm run build