import React from 'react';
import { defineApp, type NexAppProps } from '@nex-os/sdk';
import { useWindowManager } from '../sdk/host';

/**
 * Plantilla mínima del SDK — abrí SDK Docs para la guía completa.
 */
function HelloNexApp(_props: NexAppProps) {
  const { openWindow } = useWindowManager();

  return (
    <div
      style={{
        height: '100%',
        boxSizing: 'border-box',
        padding: 28,
        color: '#e8f7ff',
        background:
          'radial-gradient(circle at 20% 20%, rgba(61,214,198,0.22), transparent 45%), linear-gradient(160deg, #071018 0%, #0c1a14 100%)',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 42, marginBottom: 8 }}>🚀</div>
      <h1 style={{ margin: '0 0 8px', fontSize: 26 }}>Hello NEX</h1>
      <p style={{ margin: '0 0 20px', opacity: 0.75, maxWidth: 420, lineHeight: 1.5 }}>
        App de ejemplo registrada con <code style={codeStyle}>@nex-os/sdk</code>. Copiá este archivo y
        creá la tuya.
      </p>
      <button
        type="button"
        onClick={() =>
          openWindow('sdk-docs', 'sdk-docs', 'SDK Docs', <span style={{ fontSize: 16 }}>⬡</span>)
        }
        style={{
          border: '1px solid rgba(61,214,198,0.45)',
          background: 'rgba(61,214,198,0.15)',
          color: '#e8fffa',
          padding: '10px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Abrir SDK Docs
      </button>
      <p style={{ marginTop: 20, fontSize: 12, opacity: 0.45 }}>
        Docs: <code style={codeStyle}>docs/SDK.md</code>
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
