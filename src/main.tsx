import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from './App';

// Inicializar HBG Core
import { hbgCore } from './core/hbgCore';

// Registrar automáticamente el Service Worker de la PWA
registerSW({
  immediate: true,
});

// Inicializar app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Log de inicialización
console.log('🎵 VIBRA PRO inicializado correctamente');
console.log(`Modo: ${hbgCore.getMode()}`);
console.log('Estado global:', hbgCore.getState());
