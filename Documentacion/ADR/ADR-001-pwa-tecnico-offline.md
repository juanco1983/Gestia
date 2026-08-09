# ADR-001: PWA con escritura offline solo para el módulo Técnico

## Status

Accepted

## Date

2026-08-09

## Context

El módulo de Técnico opera en campo sin internet estable (sótanos, cuartos eléctricos,
plantas, zonas rurales). Gestia hoy es una web app pura con estas carencias:

- Borradores del wizard en `localStorage` (~5MB de límite): las fotos en Base64 saturan la
  cuota y el guardado falla silenciosamente.
- Si el técnico cierra el navegador sin señal, los borradores quedan atrapados en ese
  dispositivo sin mecanismo de exportación ni persistencia entre sesiones.
- No hay precarga de OTs/equipos/clientes del día → no puede abrir la ficha de una OT
  habiendo entrado offline.
- No hay instalabilidad (Add to Home Screen) ni service worker.
- La cola de reportes offline actual depende de `navigator.onLine` reactivo + un solo
  intento de envío; sin reintentos exponenciales ni persistencia.

Requisitos clave:

1. Persistencia local robusta (superior a localStorage) para borradores y cola de reportes.
2. El técnico debe poder abrir la app sin internet y trabajar (fotos incluidas).
3. Al reconectar, los reportes encolados se envían solos con reintentos.
4. No debe alterar el comportamiento online de los demás roles (Ventas, Supervisor,
   Administrador, Cliente, Dashboard, Monitoreo).
5. UI homogénea con el patrón Dashboard (`Documentacion/guia_ui_ux.md` §5), sin
   `window.alert`, sin emojis, tokens `teal-brand`.

## Decision

Convertir Gestia en una **PWA instalable**, con capacidades offline **scoped al portal de
Técnico** mediante feature flag `VITE_PWA_TECNICO === '1'`:

- **Service Worker** generado con `vite-plugin-pwa` (CacheFirst para assets estáticos;
  NetworkFirst con allowlist para las rutas `/api/*` que usa el técnico:
  `GET /api/ots`, `GET /api/equipos/:id`, `GET /api/clients/:id`, `POST /api/sync`).
- **IndexedDB** con la librería `idb` (DB `gestia_offline`) para borradores, cola de
  reportes, OTs/equipos/clientes precargados y metadatos de sync.
- **Migración** de `localStorage['mafort_draft_*']` → IndexedDB al primer arranque.
- **Precarga** al login como Técnico (con internet) de sus OTs, equipos y clientes.
- **Sync al reconectar** con reintentos exponenciales (5s, 15s, 60s, 5min, 15min, cap 30min)
  vía `window.online` + `visibilitychange`, usando el `POST /api/sync` existente extendido.
- **UI**: badge de conexión + chip de cola de sincronización en `TecnicoView`, siguiendo
  el mockup aprobado `Documentacion/mockups/pwa-tecnico-offline.html`.

## Alternatives Considered

### Native app (React Native / Flutter)
- Pros: control total de offline, cámara, notificaciones.
- Cons: dos codebases, costo/beneficio alto, el componente actual ya hace el flujo.
- Rejected: solo necesita persistencia robusta, no una app nativa.

### Dexie como wrapper de IndexedDB
- Pros: API cómoda, sugar syntax.
- Cons: más superficie que `idb`; `idb` es suficiente para nuestro schema.
- Rejected: preferimos `idb` por mínima superficie y types nativos.

### Background Sync nativo del browser
- Pros: sync del SW incluso con la pestaña cerrada.
- Cons: permisos complejos y soporte inconsistente.
- Rejected: usamos sync en foreground (online/visibilitychange), que cubre el flujo del técnico.

### localStorage extendido (o cookies)
- Pros: cero cambios de infra.
- Cons: límite ~5MB y solo strings; insuficiente para fotos Base64.
- Rejected: IndexedDB es la única opción viable para el volumen de fotos del informe.

## Consequences

- Positivas:
  - Borradores y cola de reportes persisten entre sesiones y superan el límite de
    localStorage (50 fotos comprimidas ~80KB caben sin saturar).
  - El técnico puede trabajar offline y sincronizar al reconectar sin perder datos.
  - App instalable (manifest) con actualización de versión automática (auto-update del SW).
  - Sin cambios para los demás roles (flag apagado por defecto en otros entornos).
- Negativas / riesgos:
  - Complejidad nueva: SW, IndexedDB, cola con reintentos y migración de datos.
  - SW stale en caches de técnicos viejos → mitigado con auto-update + aviso de nueva
    versión vía ToastModal.
  - Conflicto de estado OT (servidor avanzó a Aprobada mientras el técnico enviaba offline):
    `POST /api/sync` ya protege estados avanzados; la UI notifica y actualiza el estado local.
  - Login sin internet en la primera visita: imposible precargar; se informa al usuario que
    opera con lo cacheado de la última sesión.

## References

- Plan + spec detallado: `Documentacion/planes/infra/2026-08-07-pwa-tecnico-offline.md`
- Mockup aprobado: `Documentacion/mockups/pwa-tecnico-offline.html`
- Guía UI/UX: `Documentacion/Guias y Estandares/guia_ui_ux.md` §4 (badges), §5 (ToastModal)
- `server.ts:1293` `POST /api/sync`
