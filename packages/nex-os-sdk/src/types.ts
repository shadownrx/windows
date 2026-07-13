import type { ComponentType, ReactNode } from 'react';

/** Props bag passed into every windowed app. */
export type NexAppProps = Record<string, unknown>;

/**
 * Manifest de una app de NEX OS.
 * Registrala con `registerApp()` y el shell la puede abrir como ventana.
 */
export interface NexAppManifest {
  /** Id de ventana por defecto (único por escritorio). */
  id: string;
  /** Clave que resuelve AppRegistry (puede coincidir con id). */
  appId: string;
  /** Título en la barra de la ventana / taskbar. */
  title: string;
  /** Icono React (Fluent, SVG, emoji wrapper, etc.). */
  icon: ReactNode;
  /** Componente raíz — ocupa el 100% del área de contenido. */
  component: ComponentType<NexAppProps>;
  /** Alias adicionales de appId (Run dialog, .nex, etc.). */
  aliases?: string[];
  /** Descripción corta para el catálogo de community apps. */
  description?: string;
  /** Autor / handle del creador. */
  author?: string;
  /** Versión semver informativa. */
  version?: string;
  /** Props por defecto al abrir. */
  defaultProps?: NexAppProps;
  /** Mostrar en taskbar aunque esté cerrada. */
  pinToTaskbar?: boolean;
  /** Categoría libre para filtros futuros. */
  category?: 'tools' | 'media' | 'games' | 'dev' | 'social' | 'other';
}

export interface NexLauncherItem {
  id: string;
  appId: string;
  label: string;
  icon: ReactNode;
  isPinned?: boolean;
  description?: string;
  author?: string;
  community?: boolean;
}

export type RegistryListener = () => void;
