# Guion de Pruebas E2E: Deshabilitar creación manual en Gestión de OT

> **Fecha**: 2026-08-08
> **Alcance**: Navegador Real (Playwright) — header del módulo Gestión de OT.
> **Archivos de Prueba**: `tests/ot-botones-creacion-deshabilitados.spec.ts`, `tests/gestion-ot-tabs.spec.ts`
> **Rama**: `fix/deshabilitar-creacion-manual-ot`

---

## 1. Contexto

Los botones **"Crear OT Marco (Padre)"** y **"Agregar Cuota/Línea"** del header de
Gestión de OT eran de creación manual. El flujo real del negocio crea la OT y su
línea financiera **automáticamente** al programar una visita (ver `POST /api/ots`
en `server.ts`, que genera `OrdenTrabajoLinea` con pendiente `POR EJECUTAR`).

Por decisión del usuario, ambos botones se **deshabilitan con tooltip**
explicativo; **"Exportar Excel/CSV"** permanece activo.

---

## 2. Criterios de aceptación

- [x] "Crear OT Marco (Padre)" está `disabled` + `aria-disabled="true"` y con
      tooltip: *"La OT y su línea financiera se crean automáticamente al programar
      una visita."*
- [x] "Agregar Cuota/Línea" está `disabled` + `aria-disabled="true"` y con
      tooltip: *"Las cuotas se generan automáticamente al crear la OT."*
- [x] "Exportar Excel/CSV" permanece `enabled`.
- [x] Cero errores de consola al cargar el módulo.

---

## 3. Pasos E2E

| Paso | Módulo | Acción | Criterio |
|:---|:---|:---|:---|
| 1 | Login | `Administrador` | Sidebar visible, sin console errors. |
| 2 | **Gestión de OT** | Abrir módulo | `#ot-marco-main-panel` visible. |
| 3 | Header | Localizar "Crear OT Marco (Padre)" | `toBeDisabled()` + `aria-disabled="true"` + tooltip. |
| 4 | Header | Localizar "Agregar Cuota/Línea" | `toBeDisabled()` + `aria-disabled="true"` + tooltip. |
| 5 | Header | Localizar "Exportar Excel/CSV" | `toBeEnabled()`. |
| 6 | — | Recorrer pestañas Analíticas/Metas/Comercial | Rendering correcto, cero errores. |

---

## 4. Resultados

| Prueba | Resultado |
|:---|:---|
| `tests/gestion-ot-tabs.spec.ts` (3 tab tests) | **PASS** |
| `tests/ot-botones-creacion-deshabilitados.spec.ts` | **PASS** |
| `npm run typecheck` (`tsc --noEmit -p tsconfig.json`) | **EXIT 0** |

---

## 5. Evidencia

- Videos `.webm` + trace en `test-results/` (config Playwright `video: 'on'`, `trace: 'on'`).
- QA Report: `Documentacion/evidencias/2026-08-08-qa-report-deshabilitar-creacion-manual-ot.md`.