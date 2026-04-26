# 🛠️ Guía de Desarrollo - WebOS

Esta guía describe cómo configurar tu entorno de desarrollo y trabajar con WebOS.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener completada la [Guía de Instalación](./INSTALLATION.md).

---

## 🔄 Flujo de Desarrollo

### 1. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El servidor se reiniciará automáticamente cuando hagas cambios en los archivos. Accede a `http://localhost:5173/`

### 2. Modo de Recarga en Caliente (HMR)

Vite utiliza **Hot Module Replacement** por defecto:
- Los cambios en archivos `.tsx` se reflejan instantáneamente
- El estado de la aplicación se preserva
- No necesita recargar la página manualmente

### 3. Linting y Formato

```bash
# Ejecutar ESLint para verificar código
npm run lint

# (Opcional) Corregir automáticamente errores de linting
npm run lint -- --fix
```

---

## 📂 Estructura del Proyecto

```
windows/
├── src/
│   ├── components/
│   │   ├── apps/              # Aplicaciones individuales
│   │   ├── system/            # Componentes del sistema
│   │   ├── nexos/             # Componentes del escritorio
│   │   ├── Desktop.tsx        # Componente principal del escritorio
│   │   └── Window.tsx         # HOC para ventanas
│   ├── context/
│   │   ├── WindowManager.tsx   # Gestor de ventanas
│   │   ├── FileSystemContext.tsx
│   │   ├── SettingsContext.tsx
│   │   └── UIContext.tsx
│   ├── utils/
│   │   ├── cppEngine.ts       # Motor de C++
│   │   ├── gpuCharts.ts       # Gráficos con GPU
│   │   └── ...
│   ├── constants/
│   │   └── apps.tsx           # Definiciones de aplicaciones
│   ├── App.tsx                # Componente raíz
│   └── main.tsx               # Punto de entrada
├── assembly/
│   └── index.ts               # Código WebAssembly
├── public/
│   └── process_utils.js       # WASM compilado
├── docs/                      # Documentación
└── vite.config.ts            # Configuración de Vite
```

Para más detalles, consulta [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

## 💻 Estándares de Código

### TypeScript

**Regla 1: No uses `any`**
```typescript
// ❌ MAL
const myData: any = await fetchData();

// ✅ BIEN
interface ApiResponse {
  id: number;
  name: string;
}
const myData: ApiResponse = await fetchData();
```

**Regla 2: Tipiza siempre las props**
```typescript
// ❌ MAL
export const MyComponent = (props) => {
  return <div>{props.title}</div>;
};

// ✅ BIEN
interface MyComponentProps {
  title: string;
  optional?: boolean;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  optional = false 
}) => {
  return <div>{title}</div>;
};
```

### Componentes React

**Componentes Funcionales con Hooks:**
```typescript
import React, { useState, useEffect } from 'react';

export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Componente montado o count cambió:', count);
  }, [count]);

  return (
    <div>
      <p>Contador: {count}</p>
      <button onClick={() => setCount(count + 1)}>Incrementar</button>
    </div>
  );
};
```

**Composición sobre Herencia:**
```typescript
// ✅ BIEN: Composición
const EnhancedWindow = ({ title, children }: Props) => (
  <WindowContainer>
    <WindowTitle>{title}</WindowTitle>
    <WindowContent>{children}</WindowContent>
  </WindowContainer>
);
```

### Estilos con Tailwind CSS

**Utilidades de Tailwind:**
```typescript
<div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
  Contenido
</div>
```

**CSS Personalizado para Efectos Avanzados:**
```typescript
import styles from './MyComponent.module.css';

<div className={styles.glassEffect}>
  Efecto de cristal
</div>
```

---

## 🔌 Trabajar con WebAssembly

### Editar Código WASM

Los módulos de WebAssembly están en `assembly/index.ts`:

```typescript
// assembly/index.ts
export function calculateCPULoad(processes: u32): f64 {
  return f64(processes) * 0.85;
}
```

### Compilar WASM

```bash
npm run asbuild
```

### Usar WASM en Componentes

```typescript
import { wasmModule } from '../path/to/wasm';

export const TaskManager = () => {
  const load = wasmModule.calculateCPULoad(15);
  return <div>CPU Load: {load.toFixed(2)}%</div>;
};
```

---

## 🎨 Crear una Nueva Aplicación

### Paso 1: Crear el Componente

```bash
# Crear archivo en src/components/apps/
# Por ejemplo: src/components/apps/MyNewApp.tsx
```

```typescript
// src/components/apps/MyNewApp.tsx
import React from 'react';

interface MyNewAppProps {
  id: string;
}

export const MyNewApp: React.FC<MyNewAppProps> = ({ id }) => {
  return (
    <div className="bg-white p-4">
      <h1>Mi Nueva Aplicación</h1>
      <p>¡Hola, WebOS!</p>
    </div>
  );
};
```

### Paso 2: Registrar en WindowManager

```typescript
// src/context/WindowManager.tsx
import { MyNewApp } from '../components/apps/MyNewApp';

// En el estado inicial:
const initialState = {
  desktopIcons: [
    // ... otros iconos
    {
      id: 'mynewapp',
      label: 'Mi App',
      icon: <MyIcon />,
      component: MyNewApp,
    },
  ],
};
```

### Paso 3: Agregar Ícono

Usa iconos de Fluent UI o Lucide React:

```typescript
import { AppGeneric24Filled } from '@fluentui/react-icons';
// o
import { Zap } from 'lucide-react';
```

---

## 🧪 Desarrollo y Testing

### Verificar Código

```bash
# Lint
npm run lint

# Compilar TypeScript
npm run build
```

### Debug en Navegador

1. Abre las DevTools (`F12`)
2. Ve a la pestaña `Sources` o `Console`
3. Usa `console.log()` para debug

**Exemplo:**
```typescript
const { openWindow } = useWindowManager();
console.log('Ventanas abiertas:', getAllWindows()); // Debug
```

---

## 🔍 Debugging de Performance

### Usar React DevTools

1. Instala [React Developer Tools](https://chrome.google.com/webstore/)
2. Abre DevTools en el navegador
3. Inspecciona componentes y props

### Medir Performance

```typescript
// Medir tiempo de ejecución
console.time('myOperation');
// ... código a medir
console.timeEnd('myOperation');
```

---

## 📦 Dependencias

### Agregar una Nueva Dependencia

```bash
# Instalar
npm install nombre-del-paquete

# Con una versión específica
npm install nombre-del-paquete@1.2.3

# Como dependencia de desarrollo
npm install --save-dev nombre-del-paquete
```

### Remover una Dependencia

```bash
npm uninstall nombre-del-paquete
```

---

## 🚀 Compilación para Producción

```bash
# Build
npm run build

# Preview local
npm run preview
```

Los archivos compilados estarán en `dist/`

### Optimizaciones Aplicadas

- Minificación de código
- Tree-shaking de imports no utilizados
- Optimización de imágenes
- Chunking automático
- Caché busting

---

## 💾 Variables de Entorno

Crea un archivo `.env.local` para variables de desarrollo:

```env
# .env.local
VITE_API_URL=http://localhost:3000
VITE_DEBUG_MODE=true
```

Accede en tu código:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 🔗 Comandos Rápidos

```bash
npm run dev       # Iniciar desarrollo
npm run build     # Compilar para producción
npm run preview   # Preview del build
npm run lint      # Ejecutar ESLint
npm run asbuild   # Compilar WebAssembly
```

---

## 📚 Recursos Adicionales

- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [AssemblyScript Docs](https://www.assemblyscript.org/)

---

¿Necesitas ayuda? Consulta [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
