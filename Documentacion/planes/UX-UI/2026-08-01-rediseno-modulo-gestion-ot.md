# Plan UX/UI — Rediseño del Módulo de Gestión de OT (Homologación + Mejoras UX)

**Fecha:** 2026-08-01
**Tipo:** UX-UI (homologación al patrón Dashboard)
**Módulo:** Gestión de OT (`OrdenesTrabajoView`, `TablaOrdenesTrabajo`, `src/components/ot/*`)
**Mockup aprobado:** [Documentacion/mockups/ot-modulo-rediseno.html](../mockups/ot-modulo-rediseno.html)

## Contexto

El módulo de Gestión de OT no sigue el patrón visual canónico del Dashboard.
La exploración del código encontró inconsistencias: gradiente oscuro en el
header (`from-slate-900 to-slate-800`, `rounded-[28px]`), ~48 hex crudos
`#00B594`/`#009b7e`/`#E6F7F4`, utilidades Tailwind v4 inválidas
(`border-slate-150`, `text-slate-450`, `text-slate-650`, `text-slate-850`),
tamaños tipográficos arbitrarios (`text-[7px]` a `text-[11px]`), emojis en
UI (🎯 ⚠️ ⏳ 🚀 🔴 ℹ️ 💡), animaciones no estándar (`animate-spin-slow`,
`animate-fade-in`, `animate-in`), y z-index arbitrarios.

El usuario aprobó el mockup con alcance **Homologación + mejoras UX** para
**todo el módulo completo** (vista principal + todos los modales).

## Alcance

**Incluido (homologación visual, sin cambiar modelo de datos ni flujos):**
1. **OrdenesTrabajoView**: header de módulo (card canónico, acciones Crear OT
   Marco / Agregar Cuota / Exportar), panel tipo de cambio, tabs, vistas
   analytics/targets/comercial → patrón canónico del Dashboard.
2. **TablaOrdenesTrabajo**: 4 KPIs canónicos, barra de filtros, tabla de 10
   columnas (badges de estado), paginación.
3. **Modales** `ot/`: Crear OT Marco, Agregar Línea, Editar Línea, Asignar
   Técnico, Programar Visita, Bitácora, Detalle Equipos, PanelAlertas,
   ReporteTarget, ReporteComercial → patrón canónico de modal/card/badge.
4. **Limpieza**: eliminar hex crudos (→ `teal-brand`), `border-slate-150` (→
   `slate-200`/`slate-100`), `text-slate-450/650/850` (→ escala válida),
   tamaños arbitrarios fuera de escala (→ escala o `text-[10px]` máx),
   emojis (→ iconos lucide), animaciones no estándar (→ nativas o eliminadas).
5. **Mejoras UX**: estados vacíos canónicos, jerarquía visual, truncado de
   títulos, badges de estado técnico inline en la tabla.

**Excluido:**
- Cambios en el modelo de datos / Prisma.
- Cambios en flujos de negocio (transiciones de estado, sincronización
  financiera).
- Los KPIs hardcodeados de `VentasView` (deuda funcional aparte, no UI).
- El generador de Word/PDF (estilos inline de documentos, no UI).

## Criterios de aceptación

1. La vista principal del módulo se ve con el patrón canónico del Dashboard
   (cards `bg-white rounded-[24px] border border-slate-100`).
2. Cero hex crudos nuevos; el verde de marca usa `bg-teal-brand`/`bg-teal-deep`.
3. Cero utilidades Tailwind v4 inválidas (`border-slate-150`, etc.).
4. Cero tamaños tipográficos arbitrarios > `text-[10px]`.
5. Cero emojis en UI.
6. Sin `window.alert()/confirm()` — se mantienen `useConfirm`/`ToastModal`.
7. Funcionalidad intacta: todas las acciones de fila, filtros, tabs, modales
   y exportaciones siguen operando.
8. `tsc --noEmit` limpio y `npm run build` exitoso.

## Desglose de tareas

| Tarea | Estado |
|---|---|
| Mapeo del módulo actual y detección de inconsistencias | completed |
| Mockup `ot-modulo-rediseno.html` aprobado por el usuario | completed |
| Plan en `Documentacion/planes/UX-UI/` | completed |
| Slice 1: homologar `OrdenesTrabajoView` (header, tipo de cambio, tabs, analytics) | completed |
| Slice 2: homologar `TablaOrdenesTrabajo` (KPIs, filtros, tabla, paginación) | completed |
| Slice 3: homologar modales `ot/` | completed |
| Verificación final (typecheck + build) | completed |
| Commit + push + PR | inProgress |

## Riesgos

- El módulo es grande (~2.400 líneas entre vista y modales); se trabaja por
  slices incrementales verificando con build tras cada uno.
- Los `text-[10px]`/`text-[11px]` existen también en el Dashboard de
  referencia; se respeta la escala del patrón vigente y se evita ampliar el
  uso arbitrario.
- Cambiar clases de cards/headers puede afectar el espaciado en pantallas
  pequeñas; se mantiene la estructura responsive actual.

## Dependencias

- `guia_ui_ux.md` (tokens, card, botones, badges, tablas, ToastModal).
- `src/index.css` (`@theme` con `teal-brand`/`teal-deep`/`teal-mist`).
- Dashboard (`src/components/dashboard/*`) como patrón canónico.
