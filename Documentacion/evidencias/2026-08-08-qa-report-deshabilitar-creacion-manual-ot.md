# QA Report — Deshabilitar creación manual en Gestión de OT

> **Fecha**: 2026-08-08
> **Rama**: `fix/deshabilitar-creacion-manual-ot`
> **Status**: ✅ **APPROVED**

## 1. Archivos afectados

- `src/components/OrdenesTrabajoView.tsx` — se deshabilitan los botones "Crear OT
  Marco (Padre)" y "Agregar Cuota/Línea" (attributos `disabled`,
  `aria-disabled="true"`, class `cursor-not-allowed opacity-80` y `title` tooltip).
- `tests/ot-botones-creacion-deshabilitados.spec.ts` — spec E2E nuevo.
- `Documentacion/mockups/gestion-ot-deshabilitar-creacion-manual.html` — mockup aprobado.
- `Documentacion/pruebas_e2e/2026-08-08-ot-botones-creacion-deshabilitados.md` — guion.

## 2. Justificación del cambio

`POST /api/ots` (`server.ts`) ya crea automáticamente la OT y su `OrdenTrabajoLinea`
al programarse una visita, volviendo redundante la creación manual de OT marco/cuotas.

## 3. Pruebas ejecutadas

| Tipo | Prueba | Resultado |
|:---|:---|:---|
| Compilación | `tsc --noEmit -p tsconfig.json` | **EXIT 0** |
| E2E nuevo | `ot-botones-creacion-deshabilitados.spec.ts` | **PASS** |
| Regresión | `gestion-ot-tabs.spec.ts` (3 tests) | **PASS** |

## 4. Cobertura

- **Cubierto**: estado disabled + tooltip de los 2 botones, export CSV activo,
  cero errores en consola, pestañas del módulo intactas.
- **No cubierto**: el submit manual de los modales (quedaron inaccesibles por
  diseño — intencional).

## 5. Riesgos / dependencias

- Requiere rebuild `dist/` para que el server de EB sirva el bundle nuevo.
- El declarado `title` provee el tooltip nativo del navegador (semántica
  accesible); no se introdujo ningún toast extra.

## 6. Decisión

✅ **APPROVED** — listo para commit → push → PR a `dev`.