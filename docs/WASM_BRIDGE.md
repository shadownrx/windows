# El Puente WASM: AssemblyScript en NEX OS

Para lograr un rendimiento premium, NEX OS delega cálculos intensivos a **WebAssembly (WASM)**. Utilizamos **AssemblyScript** para escribir estos módulos, lo que nos permite mantener una sintaxis familiar a TypeScript mientras obtenemos beneficios de rendimiento significativos.

## 🚀 ¿Por qué WASM?

En aplicaciones de monitoreo en tiempo real (como el Administrador de Tareas), el hilo principal de JavaScript puede saturarse si realiza cálculos complejos cada pocos milisegundos. WASM permite:

1.  **Ejecución determinista:** Rendimiento consistente sin picos causados por la recolección de basura de JS.
2.  **Carga Turbo:** Los módulos WASM se cargan como binarios compactos, listos para ejecutarse inmediatamente.

## 🛠️ Estructura del Puente

Los archivos fuente residen en `/assembly/index.ts`. Un ejemplo de función optimizada:

```typescript
export function calculateSystemLoad(cpu: f64, mem: f64): f64 {
  // Cálculo matemático intensivo que se ejecuta a velocidad nativa
  return (cpu * 0.7) + (mem * 0.3);
}
```

## 🔌 Cómo consumir WASM en NEX

El sistema carga automáticamente los módulos en el arranque. Para usar una función de WASM en un componente de React:

1.  Importa el cargador de WASM.
2.  Instancia el módulo.
3.  Llama a la función exportada.

```typescript
// Ejemplo conceptual
import { calculateSystemLoad } from '../wasm/loader';

const Dashboard = () => {
  const load = calculateSystemLoad(0.85, 0.40);
  return <div>Carga del Sistema: {load}%</div>;
};
```

## 🔨 Cómo compilar

Si realizas cambios en la lógica de `/assembly`, debes recompilar el binario:

```bash
npm run asbuild
```

Esto generará los archivos `.wasm` optimizados en la carpeta `build/` (o la carpeta configurada en `asconfig.json`).

---

© 2026 NEX Engineering Team.
