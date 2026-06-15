# Changelog — Nex OS 🚀

Historial oficial de cambios, optimizaciones y lanzamientos del sistema operativo web de alto rendimiento.

---

## [Season 4] — Desarrollo Actual (Junio 2026)

### 📊 Telemetría y Rendimiento Base
* **[Agregado] Telemetría síncrona en tiempo real:** Implementación exitosa del puente de datos de hardware. El Administrador de Tareas de Nex OS ahora refleja con total fidelidad el uso de CPU, GPU, lectura de disco y consumo de memoria RAM del sistema nativo (Ryzen 5 5500U). ✅
* **[Optimizado] Gestión de Memoria en el Navegador:** Reducción drástica del *footprint* de memoria del lado del cliente. El entorno base reporta apenas un **7% (~0.8 GB)** en comparación con la carga del sistema operativo tradicional.
* **[Optimizado] Renderizado de Gráficas de Recursos:** Rediseño del motor de dibujado de las curvas de rendimiento en tiempo real (60 FPS estables) sin penalizar el hilo principal del navegador.

### 🎨 Interfaz y UX
* **[Agregado] Barra de herramientas de desarrollo:** Accesos directos optimizados en la sección superior para agilizar el flujo de trabajo en la inspección de código y procesos. ✅
* **[Mejorado] Modo Oscuro Nativo:** Refinamiento visual en las tonalidades del panel del Administrador de Tareas para una consistencia estética superior frente a entornos de sistemas modernos.

---

## [Próximos Hitos] — Hacia la Beta Pública

### 🎮 Integración de Videojuegos (Beta Release — Diciembre 12)
* **[Planificado] Motor de Juegos Integrado:** Introducción de una infraestructura nativa para construir, compilar y ejecutar videojuegos directamente dentro del entorno de Nex OS.
* **[Planificado] Arquitectura WebGPU / WebAssembly:** Implementación de pipelines de bajo nivel para garantizar que el desarrollo de juegos consuma el mínimo de recursos del hardware, manteniendo portabilidad absoluta en la web.
* **[Planificado] Suite de Diagnóstico para Devs:** Herramientas de perfilado (*profiling*) dedicadas a medir el impacto gráfico y lúdico sobre la telemetría en tiempo real de Nex OS.

---

## [Comunidad y Código Abierto]
* **[Repositorio Público]:** Toda la arquitectura base de simulación, bindings de componentes y layouts se encuentra disponible para la comunidad en GitHub (`shadownrx/windows`).