import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSettings } from '../../context/SettingsContext';
import CyberpunkBG from './3d/CyberpunkBG';
import MatrixBG from './3d/MatrixBG';
import SynthwaveBG from './3d/SynthwaveBG';

const Background3D: React.FC = () => {
  const { neonTheme } = useSettings();

  // No renderizar nada si no hay tema neon activo para ahorrar recursos
  if (neonTheme === 'none') return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      background: '#0a0a0c'
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 2]} // Optimización para pantallas retina
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          {neonTheme === 'cyberpunk' && <CyberpunkBG />}
          {neonTheme === 'matrix' && <MatrixBG />}
          {neonTheme === 'synthwave' && <SynthwaveBG />}
        </Suspense>
      </Canvas>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, transparent 0%, rgba(10, 10, 12, 0.4) 100%)',
        pointerEvents: 'none'
      }} />
    </div>
  );
};

export default Background3D;
