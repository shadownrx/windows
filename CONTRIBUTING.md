# Guía de Contribución a WebOs

¡Gracias por tu interés en mejorar WebOs! Este proyecto busca empujar los límites de lo que es posible en la web, y tu ayuda es invaluable.

## 🚀 Cómo Empezar

1.  **Fork** el repositorio.
2.  Crea una rama para tu característica: `git checkout -b feature/nueva-app`.
3.  Instala las dependencias: `npm install`.
4.  Asegúrate de que el linter pase: `npm run lint`.

## 🛠️ Estándares de Código

Para mantener la calidad "Premium" del proyecto, seguimos estas reglas:

*   **TypeScript Estricto:** No uses `any`. Define interfaces para todos tus props y estados.
*   **Componentes Atómicos:** Separa la lógica de negocio de la UI. Usa hooks personalizados cuando el componente crezca demasiado.
*   **Diseño Fluent/Windows 11:** Usa los tokens de color definidos en `tailwind.config.js` e `index.css`. Mantén el uso de `backdrop-blur` y bordes sutiles.
*   **Iconografía:** Preferimos `@fluentui/react-icons` para mantener la consistencia con Windows 11.

## 🔌 Cómo agregar una nueva aplicación

1.  Crea tu componente en `src/components/apps/MiApp.tsx`.
2.  Define un icono (preferiblemente de Fluent UI).
3.  Registra la aplicación en el `WindowManager.tsx` dentro del estado inicial de `desktopIcons`.
4.  Si tu aplicación requiere procesamiento pesado, considera mover esa lógica a un módulo de **AssemblyScript** en `assembly/`.

## ⚡ WebAssembly (WASM)

Si modificas el código en la carpeta `assembly/`, recuerda compilar los módulos antes de probar:
```bash
npm run asbuild
```

## 🐞 Reporte de Errores

Si encuentras un bug, por favor abre un *Issue* detallando:
- Pasos para reproducir.
- Comportamiento esperado vs. real.
- Capturas de pantalla si es un error visual.

---

¡Esperamos tus Pull Requests! 🚀
