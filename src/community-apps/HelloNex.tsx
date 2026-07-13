import React from 'react';
import { defineApp, type NexAppProps } from '@nex-os/sdk';

/**
 * App de ejemplo del SDK — demostración para creators.
 * Abrila desde Buscar / Taskbar: "Hello NEX".
 */
function HelloNexApp(_props: NexAppProps) {
  return (
    <div
      style={{
        height: '100%',
        boxSizing: 'border-box',
        padding: 28,
        color: '#e8f7ff',
        background:
          'radial-gradient(circle at 20% 20%, rgba(29,155,240,0.25), transparent 45%), linear-gradient(160deg, #0a1220 0%, #0c1a14 100%)',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 42, marginBottom: 8 }}>🚀</div>
      <h1 style={{ margin: '0 0 8px', fontSize: 26 }}>Hello NEX</h1>
      <p style={{ margin: '0 0 16px', opacity: 0.75, maxWidth: 420, lineHeight: 1.5 }}>
        Esta app se registró con <code style={codeStyle}>@nex-os/sdk</code>. Copiá{' '}
        <code style={codeStyle}>src/community-apps/HelloNex.tsx</code> y creá la tuya.
      </p>
      <ol style={{ margin: 0, paddingLeft: 18, opacity: 0.85, lineHeight: 1.7 }}>
        <li>
          <code style={codeStyle}>import {'{ defineApp }'} from '@nex-os/sdk'</code>
        </li>
        <li>Escribí tu componente (100% alto de ventana)</li>
        <li>
          Exportá <code style={codeStyle}>defineApp({'{ ... }'})</code>
        </li>
        <li>
          Importá el módulo en <code style={codeStyle}>community-apps/index.ts</code>
        </li>
      </ol>
      <p style={{ marginTop: 20, fontSize: 13, opacity: 0.5 }}>
        Docs: <code style={codeStyle}>packages/nex-os-sdk/README.md</code>
      </p>
    </div>
  );
}

const codeStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 12,
};

export default defineApp({
  id: 'hello-nex',
  appId: 'hello-nex',
  title: 'Hello NEX',
  icon: <span style={{ fontSize: 18 }}>🚀</span>,
  component: HelloNexApp,
  description: 'Plantilla de ejemplo del SDK @nex-os/sdk',
  author: 'NEX',
  version: '0.1.0',
  pinToTaskbar: true,
  category: 'dev',
  aliases: ['hello', 'sdk-demo'],
});
