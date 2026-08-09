# Guion de Pruebas E2E: PWA Módulo Técnico Offline (precarga, borrador y reporte offline con sincronización)

> **Fecha**: 2026-08-09
> **Rama**: `feature/pwa-tecnico-offline`
> **Archivo de Prueba**: `tests/pwa-tecnico-offline.spec.ts`
> **Build**: requiere `npx vite build` con `VITE_PWA_TECNICO=1` antes (webServer Playwright sirve `dist/` con SW).

## 1. Contexto

El técnico necesita trabajar en zonas sin señal: ver sus OTs precargadas, guardar
borradores y enviar informes en modo offline. La implementación añade:

1. Service Worker (`src/sw.ts`) precache/NetworkFirst para el shell y API permitida.
2. Capa IndexedDB (`src/offline/db.ts` + `sync.ts`): `ots`, `reports_queue`, `drafts`, `meta`.
3. Precarga de OTs del técnico al login (`App.tsx` effect dedicado → `preloadOfflineData`).
4. Envío offline `enqueueReportOffline` + cola absorbida por `flushQueue` al reconectar vía
   `POST /api/sync` (extendido con `appliedIds`/`conflicts`).

## 2. Criterios de Aceptación

- [x] Tras login como Técnico, `IndexedDB.ots` > 0 y `meta.lastSyncAt` seteado (precarga).
- [x] Guardar borrador en wizard persiste en `IndexedDB.drafts` (> 0).
- [x] Al enviar con `context.setOffline(true)` aparece toast "Reporte Cacheado Localmente".
- [x] `IndexedDB.reports_queue` tiene 1 item `pending`.
- [x] El header de `TecnicoView` muestra el chip "N en cola".
- [x] Al reconectar (`setOffline(false)` + toggle UI), la cola se drena: chip "Sin cola" y 0 pendientes.
- [x] Cero errores de consola no preexistentes.

## 3. Pasos E2E

| # | Módulo | Acción | Criterio |
|---|---|---|---|
| 1 | API | `POST /api/login` admin | token OK |
| 2 | API | `POST /api/equipos` con `EQ-PWA-<run>` | 200 |
| 3 | API | `POST /api/ots` con `tecnicoTitularId: 'user_5'`, `estado: 'Trabajo en Ejecución'` | 200 |
| 4 | UI | `login(page, 'Tecnico')` | `#tecnico-portal-container` visible |
| 5 | UI | Esperar card de la OT (`hasText: otId`) | visible |
| 6 | IDB | `page.evaluate` leer `gestia_offline.ots` y `meta.lastSyncAt` | `ots>0` y `lastSyncAt` truthy |
| 7 | UI | Click en la OT → "Llenar Informe" → "Siguiente" ×9 | botón "Enviar Informe" visible |
| 8 | UI | "Guardar borrador" + cerrar modal "Entendido" | modal cerrado |
| 9 | IDB | `gestia_offline.drafts` | count > 0 |
| 10 | UI | `context.setOffline(true)` + dispatch `offline` + toggle UI "Offline" | estado react Offline |
| 11 | UI | Click "Enviar Informe" | toast "Reporte Cacheado Localmente" |
| 12 | IDB | `gestia_offline.reports_queue` | 1 `pending` |
| 13 | UI | Chip de cola `\d+ en cola` | visible |
| 14 | UI | `context.setOffline(false)` + dispatch `online` + toggle UI "Conectado" | chip "Sin cola" en ≤25s |
| 15 | IDB | `reports_queue` | 0 pendientes |
| 16 | — | `consoleErrors` filtradas | 0 inesperados |

## 4. Resultados

| Prueba | Resultado |
|---|---|
| `tests/pwa-tecnico-offline.spec.ts` | **PASS** |
| `tests/integration-suite.spec.ts` (integración `/api/sync` + PG) | **PASS** |
| `tests/wizard-precarga-caracteristicas.spec.ts` (regresión) | **PASS** |
| `tests/antecedentes-modelo-real-y-fotos-vacias.spec.ts` (regresión) | **PASS** |
| `npm run lint` (tsc --noEmit) | EXIT 0 |
| `npm run build` con `VITE_PWA_TECNICO=1` | EXIT 0 |

## 5. Evidencia

- Video + trace en `test-results/pwa-tecnico-offline-PWA-*/`.
- QA Report: `Documentacion/evidencias/2026-08-09-qa-report-pwa-tecnico-offline.md`.