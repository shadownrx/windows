/**
 * Atajos de NEX OS — evitamos combos del host:
 * - Win+* / Alt+Tab → Windows
 * - Ctrl+Alt+Tab → sticky Alt+Tab de Windows
 * - Ctrl+Alt+←→ → rotación de pantalla (Intel)
 *
 * Convención: Ctrl+Alt+letra / ` / [ ]
 */
export const NEX_SHORTCUTS = {
  palette: 'Ctrl+K',
  clipboardHistory: 'Ctrl+Alt+V',
  snip: 'Ctrl+Alt+S',
  showDesktop: 'Ctrl+Alt+D',
  explorer: 'Ctrl+Alt+E',
  run: 'Ctrl+Alt+R',
  taskView: 'Ctrl+Alt+T',
  assistant: 'Ctrl+Alt+A',
  appSwitcher: 'Ctrl+Alt+`',
  snapLeft: 'Ctrl+Alt+←',
  snapRight: 'Ctrl+Alt+→',
  maximize: 'Ctrl+Alt+M',
  desktopPrev: 'Ctrl+Alt+[',
  desktopNext: 'Ctrl+Alt+]',
  shortcutsHelp: 'Ctrl+Alt+/',
  center: 'Ctrl+Alt+N',
} as const;

/** Ctrl+Alt pressed (and not Meta/Win). */
export function isNexMod(e: KeyboardEvent): boolean {
  return e.ctrlKey && e.altKey && !e.metaKey;
}
