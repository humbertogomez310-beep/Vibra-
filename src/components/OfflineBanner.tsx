import React, { useEffect, useState } from 'react';

/**
 * OFFLINE BANNER
 *
 * VIBRA PRO es una app local-first: la biblioteca (IndexedDB), favoritos,
 * preferencias y reproducción funcionan igual sin conexión. Por eso, en
 * lugar de una pantalla de error que bloquee la app, este banner solo
 * informa el estado de red sin interrumpir la experiencia. El
 * `navigateFallback` del service worker ya garantiza que la app cargue
 * completa (nunca una pantalla en blanco) aunque no haya internet.
 */
export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline || dismissed) {
    return null;
  }

  return (
    <div className="offline-banner" role="status">
      <span className="offline-banner-dot" />
      <span>
        Sin conexión — tu biblioteca, favoritos y reproducción siguen funcionando con normalidad.
      </span>
      <button type="button" className="offline-banner-dismiss" onClick={() => setDismissed(true)}>
        Ocultar
      </button>
    </div>
  );
};
