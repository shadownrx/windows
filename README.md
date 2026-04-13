

# 🌌 NEX - Web Operating System
**Desarrollado con pasión por [Salvador]**

**NEX** es una experiencia de computación de próxima generación construida enteramente para la web. No es simplemente un clon de una interfaz; es un ecosistema de aplicaciones de alto rendimiento desarrollado con **React 18**, **TypeScript**, **AssemblyScript (WASM)** y **WebGPU**. NEX redefine lo que es posible en un navegador, fusionando estética *Premium* con ingeniería de sistemas avanzada.

> [!TIP]
> **🌐 Demo en Vivo:** [https://windows-seven-rose.vercel.app/](https://windows-seven-rose.vercel.app/)

---

## ✨ Características Destacadas

### 🚀 Ingeniería de Alto Rendimiento
- **Ensamblado con WASM:** Lógica de cálculo crítico (como el Administrador de Tareas) optimizada con **AssemblyScript** para una ejecución a velocidad nativa.
- **Gráficos WebGPU:** Visualizaciones de hardware aceleradas por GPU, proporcionando telemetría en tiempo real sin sobrecargar el hilo principal.
- **Arquitectura de Micro-Frontends:** Cada aplicación (`File Explorer`, `VsCode`, `Dev-C++`) opera en su propio contexto aislado bajo un orquestador central.

### 🍱 Experiencia de Usuario (UX)
- **Escritorios Virtuales:** Soporte para múltiples espacios de trabajo con persistencia de estado y transiciones fluidas.
- **Sistema de Ventanas Inteligente:** Gestión de Z-Index dinámico, snapping (anclaje de ventanas), minimización y maximización animada.
- **Glassmorphism 2026:** Una interfaz basada en el diseño *Fluent* con desenfoque gaussiano en tiempo real y micro-animaciones SVG.

### 🛠️ Herramientas Integradas
- **File Explorer Engine:** Navegación real de archivos simulados con soporte para previsualización de medios.
- **Dev-C++ 2026:** Un entorno de desarrollo moderno con resaltado de sintaxis y simulación de compilación.
- **Navegador Web Integrado:** Una ventana al mundo real dentro del sistema.

---

## 🏗️ Arquitectura del Sistema

El proyecto implementa un patrón de **Gestión de Estado Centralizada** para el ciclo de vida de los procesos:

*   **`src/context/WindowManager`**: El corazón del sistema. Gestiona el registro de aplicaciones, el foco de ventanas y los escritorios virtuales.
*   **`src/components/Window`**: Componente de orden superior que abstrae la lógica de arrastre, cambio de tamaño y controles de ventana.
*   **`assembly/`**: Contiene los módulos de WebAssembly para procesamiento matemático intensivo.

---

## 🛠️ Stack Tecnológico

| Tecnología | Propósito |
| :--- | :--- |
| **React 18** | Biblioteca base para la UI reactiva. |
| **TypeScript** | Tipado estricto para una base de código robusta. |
| **Tailwind CSS** | Estilizado moderno y utilitario. |
| **AssemblyScript** | Compilación a WASM para rendimiento extremo. |
| **Vite** | Bundler de última generación para carga instantánea. |

---

## 🔧 Guía de Instalación

Sigue estos pasos para arrancar el motor de NEX en tu entorno local:

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/nex-os.git
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Compila los módulos WASM (Opcional):**
   ```bash
   npm run asbuild
   ```

---

## 📜 Documentación Adicional

Para profundizar en la ingeniería de NEX, consulta nuestras guías detalladas:

- 🏗️ [**Arquitectura Técnica**](./docs/ARCHITECTURE.md)
- 🔌 [**Referencia de APIs Internas**](./docs/API_REFERENCE.md)
- ⚡ [**Guía de Integración WASM**](./docs/WASM_BRIDGE.md)
- 🤝 [**Guía de Contribución**](./CONTRIBUTING.md)

---

> [!NOTE]
> Este proyecto es una demostración técnica de capacidades frontend modernas y no está afiliado a Microsoft.

© 2026 NEX OS Team.