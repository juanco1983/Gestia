# QA Report — Antecedentes con datos reales del equipo y fotos vacías en Informe Técnico

> **Fecha**: 2026-08-09
> **Rama**: `fix/informe-antecedentes-datos-equipo-y-fotos`
> **Status**: ✅ **APPROVED** (con nota de regresión preexistente ajena al fix)

## 1. Archivos afectados

- `src/utils/reportDefaults.ts`
  - Export `buildCaracteristicasFromEquipo` (movida desde WizardInforme).
  - Export `buildAntecedentesTexto(ot, client, caracteristicas, fecha, hora)`.
  - `generateDefaultReport(ot, client, equipo?)`: fotos siempre vacías; sin
    ficticios de MARCA/MODELO/SERIE; antecedentes con datos reales.
- `src/components/WizardInforme.tsx`
  - Importa `buildCaracteristicasFromEquipo`; pasa `equipo` a `generateDefaultReport`;
    elimina import no usado `getTechnicalSvg`.
- `src/components/TecnicoView.tsx`
  - Las 3 llamadas a `generateDefaultReport` pasan `wizardEquipo`.
- `tests/antecedentes-modelo-real-y-fotos-vacias.spec.ts` (E2E nuevo).
- Plan + guion (este documento y `pruebas_e2e/2026-08-09-...`).

## 2. Causa raíz

- `generateDefaultReport` construía `antecedentes` usando `caracteristicas["MARCA"/"MODELO"/"SERIE"]`
  **ficticios** ("APC Smart-UPS", "RT-X Dual Conversion"). El paso 6 se corregía con
  equipo real, pero el texto de antecedentes NO se regeneraba.
- `generateDefaultReport` sembraba `fotosLabeled` con `getTechnicalSvg(...)` (SVGs
  técnicos de prueba) → "imágenes precargadas".

## 3. Pruebas ejecutadas

| Tipo | Prueba | Resultado |
|---|---|---|
| Compilación | `tsc --noEmit -p tsconfig.json` | EXIT 0 |
| Build | `vite build` | EXIT 0 |
| E2E nuevo | `antecedentes-modelo-real-y-fotos-vacias.spec.ts` | **PASS** |
| Regresión | `wizard-precarga-caracteristicas.spec.ts` (paso 6) | **PASS** |
| Regresión (preexistente) | `wizard-rediseno-secciones.spec.ts` | **FAIL** (panel removido en `7618afd`, previo al fix) |

## 4. Cobertura

- **Cubierto**:
  - Texto de antecedentes con datos reales del equipo (marca/modelo/serie).
  - Ausencia de valores ficticios en antecedentes.
  - Cero imágenes SVG precargadas en paso 7 del wizard.
  - Regresión del paso 6 (características reales) intacta.
  - Cero errores de consola inesperados.
- **No cubierto**: scritp del form clásico de TecnicoView (se cubre via lógica
  compartida `generateDefaultReport`).

## 5. Notas / Riesgos

- `getTechnicalSvg` sigue exportado y usado solo por el botón "[Simular
  instantánea]" del form clásico (`TecnicoView.handleCapturePhotoForSlot`): acción
  manual, no precarga automática — fuera del alcance.
- Informes ya guardados con antecedentes ficticios no se corrigen
  retroactivamente (solo aplica a informes nuevos, alineado al requerimiento
  "al momento de generar el informe").
- Liga: si `wizardEquipo` no se resuelve al montar el wizard, antecedentes dice
  "NO REGISTRADO". En el flujo real el equipo ya está disponible al abrir el
  informe. Aceptado.

## 6. Decisión

✅ **APPROVED** — listo para commit → push → PR a `dev` (y luego `qa`).
El FAIL de `wizard-rediseno-secciones.spec.ts` es preexistente (panel removido en
`7618afd`) y **no fue introducido por este fix**; queda pendiente de decisión
del usuario (actualizarlo o dejarlo).
