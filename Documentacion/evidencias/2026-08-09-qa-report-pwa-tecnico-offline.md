# QA Report — PWA Módulo Técnico Offline

> **Fecha**: 2026-08-09
> **Rama**: `feature/pwa-tecnico-offline`
> **Status**: ✅ **APPROVED**

## 1. Archivos afectados

- `package.json` / `package-lock.json`: `vite-plugin-pwa@^1.3.0`, `idb@^8.0.3`.
- `vite.config.ts`: `VitePWA({ strategies:'injectManifest', srcDir:'src', filename:'sw.ts', registerType:'autoUpdate', manifest:false, injectRegister:'auto', globIgnores:['logo.png'] })` activo si `VITE_PWA_TECNICO==='1'`.
- `src/sw.ts` (nuevo): precache shell + NetworkFirst navegación/API allowlist + CacheFirst assets.
- `src/offline/db.ts` (nuevo): DB `gestia_offline` v1 (stores `drafts`, `reports_queue`, `ots`, `equipos`, `clientes`, `meta`).
- `src/offline/sync.ts` (nuevo): `flushQueue` (backoff 5s→30min), `enqueueReportOffline`, `markItemSynced`.
- `src/offline/preload.ts` (nuevo): precarga OTs/equipos/clientes del técnico + `migrateLegacyDrafts`.
- `src/App.tsx`: effect dedicado de precarga PWA para rol `Tecnico` (evita correr con `ots` vacío y previene re-precarga por usuario).
- `src/components/WizardInforme.tsx`: drafts migrados a IndexedDB (lectura/put/clear, fallback localStorage).
- `src/components/TecnicoView.tsx`: drafts IDB, envío offline (`enqueueReportOffline`), chip cola + "Sin cola", banner error/Reintentar, efecto `online` → `flushQueue`.
- `server.ts`: `GET /api/ots` filtros por técnico/fechas; `POST /api/sync` extendido con `appliedIds`/`conflicts`; **fix**: excluye `queueId` del upsert de `technicalReport` (Prisma rechazaba el campo desconocido → 500).
- `tests/pwa-tecnico-offline.spec.ts` (E2E nuevo).

## 2. Causa raíz (hallazgos del E2E)

1. **Precarga no persistía**: el hook estaba al final del `try` de `loadFromBackend` y podía correr con `ots=[]` (estados aún vacíos) o saltarse; se reemplazó por un effect dedicado que dispara solo cuando `ots.length > 0` y una vez por usuario.
2. **Envío offline abría el wizard de nuevo**: el modal "Borrador Guardado" interceptaba el clic de "Enviar Informe"; se cierra el modal post-guardado.
3. **El toggle "Offline"/"Conectado" real**: son botones con name exacto en el header; "Simulación de desconexión" era solo el texto del log, no un control clicable. Ajustado el selector.
4. **`POST /api/sync` → 500**: el reporte encolado traía `queueId` que no existe en el schema Prisma `TechnicalReport`; se extrae `queueId` antes del upsert y se usa `appliedIds` una vez confirmada la persistencia.

## 3. Pruebas ejecutadas

| Tipo | Prueba | Resultado |
|---|---|---|
| Compilación | `npm run lint` (tsc --noEmit) | EXIT 0 |
| Build | `vite build` con `VITE_PWA_TECNICO=1` → `dist/` + `dist/sw.js` + `registerSW.js` | EXIT 0 |
| E2E nuevo | `pwa-tecnico-offline.spec.ts` (precarga→borrador→offline→envío→reconexión→sync) | **PASS** |
| Integración | `integration-suite.spec.ts` (3 casos, incluye `/api/sync` masivo + PG) | **PASS** |
| Regresión | `wizard-precarga-caracteristicas.spec.ts` | **PASS** |
| Regresión | `antecedentes-modelo-real-y-fotos-vacias.spec.ts` | **PASS** |

## 4. Cobertura

- **Cubierto**:
  - Precarga de OTs del técnico en IndexedDB tras login (`ots>0`) + `lastSyncAt`.
  - Persistencia de borrador en IDB.
  - Envío offline → toast "Reporte Cacheado Localmente" + fila `pending` en `reports_queue` + chip "N en cola".
  - Reconexión → `flushQueue` drena la cola vía `POST /api/sync` (`appliedIds`), chip "Sin cola" y 0 pendientes.
  - Simulación real de desconexión de red navegador (`context.setOffline`) + toggle UI.
  - Cero errores de consola inesperados.
- **No cubierto**: flujo "login por primera vez sin internet" (precarga imposible: solo usa caché de la última sesión); casos con múltiples informes encolados (validar árbol de reintentos backoff); interacción con fotos S3 reales durante sync offline (solo SVG de prueba local).

## 5. Evidencia

- Video `.webm` + trace: `test-results/pwa-tecnico-offline-PWA-Mó-63862-e-sincronizan-al-reconectar-chromium/` (video.webm ~1.3MB, trace.zip 7MB).
- Guion: `Documentacion/pruebas_e2e/2026-08-09-pwa-tecnico-offline.md`.
- Plan: `Documentacion/planes/infra/2026-08-07-pwa-tecnico-offline.md` (tareas 1-10 completed, 11 in-progress→se completa en este reporte).
- ADR: `Documentacion/ADR/ADR-001-pwa-tecnico-offline.md`.

## 6. Riesgos / Dependencias

- **Postgres**: `/api/sync` y `GET /api/ots` usan Prisma → cualquier cambio futuro de schema debe actualizar `data_dictionary.md` y re-pasar integración.
- **SW stale**: `registerType:'autoUpdate'` mitiga; aviso de versión nueva queda como mejora pendiente.
- **Cuota IDB**: fotos grandes pueden agotar storage; hay `compressBase64Image` previo y limpieza tras sync.
- **PWA en campos "no técnicos"**: el módulo sigue inactivo en otras ramas (flag `VITE_PWA_TECNICO`), limpio.

## 7. Decisión

✅ **APPROVED** — flujo completo online→offline→online validado desde navegador real con
`setOffline`, integración con Postgres OK, regresiones del wizard de informe OK.
Listo para commit → push → PR hacia `dev`.