# Flujo E2E — Rediseño pestañas Analíticas, Metas y Comercial (Gestión de OT)

> **Fecha:** 2026-08-05 · **Rama:** `refactor/rediseno-ot`

## Objetivo

Validar que las pestañas `Analíticas`, `Metas Anuales` y `Rendimiento Vendedores`
del módulo Gestión de OT renderizan las nuevas métricas de valor (volumen/SLA,
avance comprometido, cartera por gestor) y que el módulo no emite errores de
consola.

## Precondiciones

- Servidor en `http://localhost:3000` (`npx tsx server.ts`) o Playwright lo
  levanta con `reuseExistingServer`.
- BD Postgres (dev) con el usuario `admin@mafort.pe` / `mafort`.

## Guion (Playwright — `tests/gestion-ot-tabs.spec.ts`)

Para cada pestaña (`analytics`, `targets`, `comercial`):

1. Login como **Administrador** (`admin@mafort.pe`).
2. Navegar a **Gestión de OT** desde el sidebar.
3. Esperar `#ot-tabs`.
4. Click en la tab correspondiente:
   - **Analíticas:** botón que contiene "Desviación".
   - **Metas:** botón que contiene "Metas".
   - **Comercial:** botón que contiene "Rendimiento".
5. Verificar contenido:
   - `analytics`: texto "Panorama Operativo y Alertas", "Backlog de facturación", "Distribución por estado", "Alertas operativas".
   - `targets`: `#ot-reporte-target`, "Control de Metas de Ventas Anual", "Meta Anual".
   - `comercial`: `#ot-reporte-comercial`, "Cartera de Ejecutivos y Facturación".
6. Assert: **cero errores de consola** durante toda la interacción.

## Resultado (2026-08-05)

- `npx playwright test tests/gestion-ot-tabs.spec.ts` → **3/3 passed**.
- Videos `.webm` en `test-results/` (config `video: 'on'`).

## Evidencia

- QA Report: `Documentacion/evidencias/2026-08-05-qa-report-rediseno-tabs-ot.md`.
