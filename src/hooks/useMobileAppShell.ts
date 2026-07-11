import { useCallback, useEffect, useState } from 'react';

const MOBILE_BP = 768;

export function useIsMobile(breakpoint = MOBILE_BP) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);

  return isMobile;
}

export function useIsStandalonePwa() {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
  }, []);

  return standalone;
}

/** Bloquea scroll del body cuando el menú lateral está abierto en móvil. */
export function useMobileScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

/** Botón atrás del celular cierra el menú lateral. */
export function useSidebarBackClose(sidebarOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!sidebarOpen) return;

    window.history.pushState({ nexMusicMenu: true }, '');
    const onPopState = () => onClose();

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [sidebarOpen, onClose]);
}

export function closeSidebarWithHistory(onClose: () => void) {
  onClose();
  if (window.history.state?.nexMusicMenu) {
    window.history.back();
  }
}

export function exitMobileApp(onFallback?: () => void) {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.close();

  // window.close() no hace nada en pestañas normales
  onFallback?.();
}
