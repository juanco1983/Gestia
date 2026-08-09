/// <reference lib="webworker" />

import {precacheAndRoute, cleanupOutdatedCaches} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {NetworkFirst, CacheFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope & typeof globalThis;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Navegaciones: NetworkFirst con fallback a la shell de la SPA.
// Permite abrir la app offline (las rutas /tecnico, /dashboard, etc.) usando
// el index.html cacheado y los assets precacheados.
registerRoute(
  ({request}) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'gestia-pages',
    plugins: [
      new ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 60 * 60 * 24}),
    ],
  })
);

// Assets estáticos (JS/CSS/imágenes/fuentes): CacheFirst con expiración.
registerRoute(
  ({request}) =>
    ['style', 'script', 'image', 'font', 'worker'].includes(request.destination) ||
    request.url.includes('fonts.googleapis.com') ||
    request.url.includes('fonts.gstatic.com'),
  new CacheFirst({
    cacheName: 'gestia-assets',
    plugins: [
      new ExpirationPlugin({maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30}),
    ],
  })
);

// API del módulo Técnico (allowlist): NetworkFirst en runtime.
// Si la red falla, devuelve la última respuesta cacheada; la capa de datos
// (IndexedDB) es la fuente de verdad offline, este cache es solo de apoyo.
registerRoute(
  ({url, request}) =>
    request.method === 'GET' &&
    (url.pathname.startsWith('/api/ots') ||
      url.pathname.startsWith('/api/equipos/') ||
      url.pathname.startsWith('/api/clients/')),
  new NetworkFirst({
    cacheName: 'gestia-api',
    plugins: [
      new ExpirationPlugin({maxEntries: 100, maxAgeSeconds: 60 * 60 * 24}),
    ],
  })
);

// Sincronización y demás /api/* en línea (sin cache en runtime).
// Solo se cachean las GET de la allowlist definida arriba.

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});