import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registrar el service worker para que la app sea instalable (PWA) y avisar
// cuando haya una nueva versión disponible (sin recargar de golpe al usuario).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      (window as any).__ioggaSWReg = reg;
      // Ya hay una versión nueva esperando (abrió la app y había update pendiente)
      if (reg.waiting && navigator.serviceWorker.controller) {
        window.dispatchEvent(new CustomEvent('iogga-update-available'));
      }
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('iogga-update-available'));
          }
        });
      });
      // Buscar actualizaciones cada rato mientras la app está abierta
      setInterval(() => { reg.update().catch(() => {}); }, 60 * 1000);
    }).catch(() => {});

    // Cuando el nuevo service worker toma control, recargar una sola vez
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  });
}
