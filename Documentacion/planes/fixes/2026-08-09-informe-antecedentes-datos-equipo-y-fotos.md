# Plan de Corrección: Antecedentes con datos del equipo y fotos no precargadas en Informe Técnico

> **Fecha**: 2026-08-09
> **Rama**: `fix/informe-antecedentes-datos-equipo-y-fotos`
> **Tipo**: fix (bug de datos en informe técnico)

## 1. Contexto y Problema

El usuario reporta dos bugs al **generar el informe técnico**:

1. **Sección Antecedentes** no muestra el modelo/marca/serie real del equipo: aparece
   un modelo "que no tiene nada que ver". Root cause: `generateDefaultReport(ot, client)`
   en `src/utils/reportDefaults.ts` construía el texto de `antecedentes` interpolando
   valores **ficticios** del mapa `caracteristicas` (`MARCA: "APC Smart-UPS"`,
   `MODELO: "RT-X Dual Conversion"`, `SERIE: "MF-..."`). El paso 6 (Características)
   ya había sido corregido (plan `2026-08-07`) fusionando el equipo real, pero el texto
   de antecedentes **no se regeneraba** con esos datos reales.

2. **Imágenes precargadas al crear el informe**: aparecen SVGs técnicos falsos
   ("REGISTRO TÉCNICO OFICIAL MAFORT") llenando los slots de fotos sin que el técnico
   las haya tomado. Root cause: `generateDefaultReport` sembraba `fotosLabeled` con
   `getTechnicalSvg(...)` para cada slot.

## 2. Criterios de Aceptación

- [x] El texto de Antecedentes (paso 3 del wizard y PDF) usa la marca/modelo/serie
      **reales** del equipo vinculado a la OT cuando están disponibles.
- [x] Cuando no hay equipo vinculado, el texto dice `"NO REGISTRADO"` en vez de un
      fabricante/modelo inventado.
- [x] Al crear un informe nuevo, los slots de fotos del paso 7 nacen **vacíos** (sin
      SVG mock). El técnico debe capturar/subir fotos reales.
- [x] La página de Fotografías del PDF muestra placeholders `FOTO #N` cuando no hay
      foto (ya lo soportaba `PaginaFotografias`).
- [x] No se introducen `window.alert`; no se rompen flujos existentes.

## 3. Desglose de Cambios

### `src/utils/reportDefaults.ts`
- Nuevo `import { Equipo }`.
- Export `buildCaracteristicasFromEquipo(equipo, base)` (movida desde `WizardInforme`
  para reutilizarla desde `generateDefaultReport`).
- Export `buildAntecedentesTexto(ot, client, caracteristicas, fecha, hora)`: única
  fuente del texto de antecedentes, usa marca/modelo/serie del mapa dado.
- `generateDefaultReport(ot, client, equipo?)`:
  - firma ahora acepta `equipo?` opcional.
  - `fotosLabeled` con `base64: ''` (slots vacíos, **sin** `getTechnicalSvg`).
  - `fotos: []`.
  - `caracteristicas` ya no usa valores ficticios de MARCA/MODELO/SERIE: declara
    `"NO REGISTRADO"` y luego fusiona el equipo real via `buildCaracteristicasFromEquipo`.
  - `antecedentes` = `buildAntecedentesTexto(ot, client, caracteristicas, ...)`.

### `src/components/WizardInforme.tsx`
- Importa `buildCaracteristicasFromEquipo` desde `reportDefaults` (elimina la copia
  local).
- `defaults = generateDefaultReport(ot, client, equipo)` (pasa el equipo real).
- Removido el import no usado de `getTechnicalSvg`.

### `src/components/TecnicoView.tsx`
- Las 3 llamadas a `generateDefaultReport` (`handleSelectOt` reset,
  `handlePrefillAllWithMafortDefaults`, "Restablecer Formulario") ahora pasan
  `wizardEquipo` para que el antecedentes del form clásico también use datos reales.

## 4. Verificación (QA Gate)

- [x] `npx tsc --noEmit -p tsconfig.json` → EXIT 0.
- [x] `npx vite build` → exitoso.
- [x] E2E nuevo `tests/antecedentes-modelo-real-y-fotos-vacias.spec.ts` → **PASS**.
      Crea OT+equipo via API, abre wizard, valida en textarea de antecedentes la
      presencia del modelo/marca/serie reales y ausencia de ficticios; valida cero
      `<img src^="data:image/svg+xml">` en paso 7.
- [x] Regresión `tests/wizard-precarga-caracteristicas.spec.ts` → **PASS** (paso 6
      sigue precargando datos reales del equipo).
- [ ] `tests/wizard-rediseno-secciones.spec.ts` → **FAIL preexistente** (espera el
      panel "Estado del Informe · 4 secciones" removido en commit `7618afd`, previo a
      esta rama). No introducido por este fix.

## 5. Notas

- `getTechnicalSvg` sigue exportado y usado solo en `TecnicoView.handleCapturePhotoForSlot`
  (botón explícito "[Simular instantánea]" del form clásico). No es precarga
  automática — es una acción manual del usuario, fuera del alcance de este fix.
- `PaginaFotografias.tsx` ya soportaba photos vacías (placeholder `FOTO #N`), por lo que
  el PDF de un informe nuevo sin fotos se renderiza correctamente.

## 6. Riesgos

- Carrera: si `wizardEquipo` aún no está resuelto al montar el wizard, el antecedentes
  dirá "NO REGISTRADO". En el flujo real, el equipo se resuelve al seleccionar la OT
  (useEffect) y el wizard se abre luego con el equipo ya disponible. Aceptado.
- Informes ya guardados con texto ficticio no se corrigen retroactivamente (solo
  aplica a informes nuevos, que es el requerimiento reportado).

## 7. Evidencia

- Guion: `Documentacion/pruebas_e2e/2026-08-09-antecedentes-modelo-real-y-fotos-vacias.md`.
- QA Report: `Documentacion/evidencias/2026-08-09-qa-report-antecedentes-modelo-real-y-fotos-vacias.md`.
- Videos `.webm` en `test-results/`.
