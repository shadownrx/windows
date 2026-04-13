# Arquitectura Técnica de NEX OS

NEX OS está diseñado bajo los principios de modularidad y alto rendimiento. Esta página detalla los componentes principales que hacen que el sistema funcione.

## 🏛️ El Orquestador Central: `WindowManager`

El sistema operativo se basa en un contexto de React (`WindowManagerContext`) que actúa como el kernel del sistema. Sus responsabilidades incluyen:

1.  **Registro de Aplicaciones:** Mantiene una lista de aplicaciones disponibles y sus iconos en el escritorio.
2.  **Ciclo de Vida de Procesos:** Abre, minimiza, maximiza y cierra ventanas.
3.  **Gestión de Z-Index:** Controla qué ventana está en primer plano mediante una pila de niveles.
4.  **Escritorios Virtuales:** Separa los procesos activos en diferentes contenedores lógicos para permitir la multitarea organizada.

## 🖼️ El Componente `Window` (HOC)

Cada aplicación en NEX está envuelta en un componente `Window`. Este componente es el encargado de:

*   **Interacción Física:** Implementar el arrastre (*drag*) y el cambio de tamaño (*resize*).
*   **Controles de Ventana:** Botones de cerrar, minimizar y maximizar.
*   **Anclaje (Snapping):** Detectar cuando una ventana se acerca a los bordes para redimensionarla automáticamente (como en Windows 11).
*   **Estética:** Aplicar el efecto de desenfoque (*backdrop-filter*) y las sombras dinámicas.

## 📂 Sistema de Archivos Simulado

NEX no tiene acceso directo al disco duro del usuario por razones de seguridad del navegador. En su lugar, implementa un **Virtual File System (VFS)**:

*   Utiliza el `FileSystemContext` para mantener una estructura de árbol de archivos en memoria.
*   Soporta operaciones básicas como navegar por carpetas, "abrir con" y previsualización de archivos.
*   En futuras versiones, se planea integrar `localStorage` o `IndexedDB` para la persistencia.

## ⚡ Capa de Rendimiento (WASM)

Para tareas que requieren un uso intensivo de CPU (como el cálculo de métricas en tiempo real del Administrador de Tareas), NEX utiliza **WebAssembly**:

*   **AssemblyScript:** Escribimos la lógica en un subconjunto de TypeScript que se compila a archivos `.wasm`.
*   **Bridge Hilo-WASM:** Un puente ligero permite enviar datos al binario WASM y recibir resultados casi instantáneamente, evitando los retardos del motor de JavaScript para cálculos matemáticos complejos.

## 🎨 Motor de Estilizado

NEX utiliza una combinación avanzada de **Tailwind CSS** y **CSS Vanilla**:

*   **Tailwind:** Para el layout rápido y responsive.
*   **Custom CSS:** Para efectos avanzados como el desenfoque gaussiano, gradientes animados y bordes de cristal que Tailwind no cubre de forma nativa con suficiente precisión *Pixel Perfect*.

---

Para más detalles sobre los hooks disponibles, consulta la [Referencia de API](./API_REFERENCE.md).
