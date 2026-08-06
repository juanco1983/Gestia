# QA Report — Rediseño pestañas Analíticas, Metas y Comercial (Gestión de OT)

- **Fecha:** 2026-08-05
- **Rama:** `refactor/rediseno-ot`
- **Cambio:** Rediseño de las pestañas `analytics`/`targets`/`comercial` de `OrdenesTrabajoView` para mostrar métricas de valor real (volumen/SLA/backlog, avance comprometido y cartera por gestor) en lugar de depender solo del monto facturado en USD (que estaba en $0).

## Archivos afectados

- `src/components/OrdenesTrabajoView.tsx` — nuevos memo `pipelineMetrics`, `reportComercial` (cartera/OTs/cuotas/% ejecución), `targetReport` (avance comprometido) y rediseño de la pestaña `analytics` (KPIs + distribución por estado + alertas).
- `src/components/ot/ReporteTarget.tsx` — avance comprometido (`sub_importe_sin_igv`) vs meta; nueva fila de meta anual.
- `src/components/ot/ReporteComercial.tsx` — cartera comprometida + badges OTs/cuotas/% ejecutado + backlog a facturar.
- `tests/gestion-ot-tabs.spec.ts` — nueva spec E2E.
- `Documentacion/planes/UX-UI/2026-08-05-rediseno-tabs-analiticas-metas-comercial.md`
- `Documentacion/mockups/ot-analytics-targets-comercial-rediseno.html`

## Tests ejecutados

| Nivel | Comando | Resultado |
|---|---|---|
| Type-check | `npx tsc --noEmit` | ✅ EXIT=0, 0 errores |
| E2E (navegador, Playwright) | `npx playwright test tests/gestion-ot-tabs.spec.ts` | ✅ 3/3 passed |

### Detalle E2E (`tests/gestion-ot-tabs.spec.ts`, video `.webm` en `test-results/`)

1. Pestaña "analytics" — KPIs (Panorama Operativo, Backlog de facturación, Distribución por estado, Alertas operativas) sin errores de consola. ✅
2. Pestaña "targets" — `#ot-reporte-target` con Control de Metas y Meta Anual. ✅
3. Pestaña "comercial" — `#ot-reporte-comercial` con Cartera de Ejecutivos. ✅

## Cobertura

- **Cubierto:** renderizado de las 3 tabs con datos (no vacíos), ausencia de errores de consola, KPIs presentes.
- **No cubierto (posterior):** regresión de `PanelAlertas` con `soonToExecuteLines` (prop intacta, sin cambios de contrato) y suite completa `login-navigation` (se ejecuta en el próximo ciclo de QA general).

## Riesgos / dependencias

- El avance "comprometido" usa `sub_importe_sin_igv`, que en la BD demo está en $0; si se desea valor real, hay que cargar montos en `OrdenTrabajoLinea` (se mantiene la lógica que lo calculará cuando existan).
- `tsc` del proyecto completo tarda >3 min en esta máquina; se ejecutó de forma bloqueante hasta completar.

## Status

**APPROVED** — listo para commit → push → PR.
