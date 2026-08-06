---
tipo: UX-UI
modulo: Gestión de OT
estado: PLANIFICADO
fecha: 2026-08-05
---

# Rediseño de pestañas Analíticas · Metas · Comercial — Gestión de OT

## Contexto

Las pestañas `analytics`, `targets` y `comercial` del módulo Gestión Integral de
OT (`src/components/OrdenesTrabajoView.tsx`) dependen de los **montos facturados
en USD** (`total_usd` de líneas con `estado = 'FACTURADO'`). En la BD dev esos
montos están en `$0` (las 3 líneas registradas están `POR FACTURAR` con
`sub_importe_sin_igv = 0`), por lo que las tres pestañas se perciben **vacías o
sin valor**.

El mockup aprobado
(`Documentacion/mockups/ot-analytics-targets-comercial-rediseno.html`) reemplaza
el enfoque basado solo en facturación por **métricas de valor real** que no
dependen de dinero facturado: volumen/SLA/pipeline, avance comprometido y
cartera por gestor.

## Alcance

- **Pestaña Analíticas** (`Desviación y Alertas`): añadir KPIs de pipeline
  (backlog de facturación, líneas atrasadas por SLA, cartera comprometida,
  cuotas del mes activo), una distribución por `estado` y un panel de alertas
  operativas que reemplaza los listados planos actuales.
- **Pestaña Metas (`ReporteTarget`)**: mostrar el avance **comprometido** usando
  `sub_importe_sin_igv` de líneas no anuladas por mes (y no solo `FACTURADO`),
  con meta anual consolidada y estado POR CAPTAR / SIN SERVICIO.
- **Pestaña Comercial (`ReporteComercial`)**: mostrar cartera comprometida,
  nº de OTs, nº de cuotas y % ejecutado por gestor, no solo facturado.

## Criterios de aceptación

- [ ] Las 3 pestañas muestran KPIs con datos no vacíos dada la BD demo actual.
- [ ] Cumple tokens y patrones de `guia_ui_ux.md` (sin hex crudos, sin
      `window.alert`, sin tamaños tipográficos arbitrarios, font-mono en KPIs).
- [ ] Uso del componente shared `<ToastModal>` para cualquier notificación
      (sin `alert`).
- [ ] `npm run lint` no introduce errores nuevos (el `server.ts` ya trae
      errores prexistentes de la feature Visita, ajenos).
- [ ] Pruebas E2E de las pestañas (ver `Documentacion/pruebas_e2e/`).

## Tareas

- [completed] Añadir métricas de pipeline en `OrdenesTrabajoView` (memóizadas).
- [completed] Rediseñar la vista de la pestaña `analytics`.
- [completed] Actualizar `ReporteTarget` a avance comprometido.
- [completed] Actualizar `ReporteComercial` a cartera por gestor.
- [completed] QA Engineer + E2E (3/3 tests passed, tsc EXIT=0).