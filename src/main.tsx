import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Inicializar HBG Core
import { hbgCore } from './core/hbgCore';

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
