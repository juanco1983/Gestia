# Rediseño del Wizard de Informe Técnico + Vista del Módulo Técnico

**Fecha:** 2026-08-07
**Categoría:** `Documentacion/planes/UX-UI/`
**Mockup:** [`Documentacion/mockups/wizard-informe-tecnico-redisenado.html`](../../mockups/wizard-informe-tecnico-redisenado.html)
**Estado:** APPROVED por usuario (mockup validado; incluye vista completa del módulo + fotos cámara/fototeca).

---

## 1. Contexto

El wizard de informe técnico (`src/components/WizardInforme.tsx`) presenta problemas
de homologación frente a `Documentacion/guia_ui_ux.md`:

- Sidebar oscuro `bg-slate-900` que rompe con el patrón Dashboard.
- Tipografías arbitrarias `text-[7px]/[8px]/[9px]` (prohibidas en §2).
- SVG inline en vez de `lucide-react`.
- 10 pasos en la barra lateral → scroll denso en tablet/móvil.
- Footer con 5 botones y jerarquía confusa para uso en campo.

Se decidió (con el usuario): **reestructurar los 10 pasos en 4 secciones**
lógicas, homologar el shell al Dashboard, optimizar para **campo (tablet/móvil
táctil)** y cubrir la **vista completa de la ventana del módulo Técnico**
(no solo el wizard), incluida la bandeja "Mis OTs".

El usuario además pidió que la carga de **fotos** ofrezca siempre dos
orígenes: **tomar con cámara** o **elegir de la fototeca**.

## 2. Alcance

- `src/components/WizardInforme.tsx`: shell (sidebar + header + footer), navegación
  por secciones/subpasos, fuente de fotos (cámara/fototeca), tokens.
- `src/components/TecnicoView.tsx`: homologación de la bandeja "Mis OTs" a tema
  claro (hoy `bg-slate-900`) y refinamiento visual de la ficha/action card;
  prop `wizardEquipo` ya existente (fix anterior) se conserva.
- NUEVA navegación por **4 SECCIONES** agrupando los 10 subpasos actuales.

### Mapeo de 10 pasos → 4 secciones

| Sección | Subpasos (paso actual) |
|---|---|
| **1 · Datos del Servicio** | Tipo de Servicio (1), Cabecera (2), Antecedentes (3) |
| **2 · Trabajo Realizado** | Acciones (4), Pasos del Procedimiento (5) |
| **3 · Inspección Técnica** | Características (6), Fotografías (7), Mediciones (8) |
| **4 · Diagnóstico y Envío** | Diagnóstico+Reco. (9), Revisión/PDF (10) |

## 3. Criterios de aceptación

- [ ] El wizard se ve como el patrón Dashboard: shell `bg-white rounded-2xl
      border border-hairline`, sidebar claro, tokens `teal-brand/canvas/ink`.
- [ ] Sin clases tipográficas arbitrarias (`text-[7px]`, `text-[8px]`,
      `text-[9px]`, `text-[10.5px]`…). Escala Tailwind `text-[10px]` máx arb.
- [ ] Íconos `lucide-react` (no SVG inline).
- [ ] La función de cada paso existente se preserva (se mueve el contenido,
      no se reescribe lógica de datos).
- [ ] Sidebar con 4 secciones + progreso global; footer táctil con 3 acciones
      (Previo / Guardar borrador / Siguiente).
- [ ] Fotografías: botones "Tomar con cámara" (`capture`) y "Elegir de fototeca"
      (`input file` sin capture) en 3.1 (panorámica) y 3.2 (slots).
- [ ] Bandeja "Mis OTs" homologada a tema claro en `TecnicoView`.
- [ ] Sin `window.alert()` / `window.confirm()` en código nuevo (patrón
      `<ConfirmModal>`/toast).
- [ ] Support táctil: footer y botones con `min-h ` adecuado y `active:scale`.
- [ ] E2E Playwright + integración pasan; `lint` y `build` limpios con la
      branch creada bajo `feature/`.

## 4. Desglose de tareas

### Incremento 1 — Shell y secciones (WizardInforme)
- [x] Definir constantes `SECTIONS` (4) y mapeo subpasos.
- [ ] `progress` global calculado desde `completedSteps`.
- [ ] Sidebar claro (reemplazar `bg-slate-900`), navegación por secciones,
      acordeón de subpasos, badge de estado.
- [ ] `stepStatus` por subpaso reutilizando `completedSteps/skippedSteps`.
- [ ] Header de paso con breadcrumb Sección N · Subpaso M.

### Increment | 2 — Footer táctil y flujo
- [ ] Footer 3 botones: Previo / Guardar borrador / Siguiente.
- [ ] `goToStep`/`handleNext`/`handlePrev`/`handleSkip` mapeados a subscript
      seq de 4 secciones.
- [ ] Ultimo subpaso → "Enviar Informe" (mantener `onComplete`/draft).

### Increment | 3 — Fotos cámara/fototeca
- [ ] `renderPaso6` panorámica: dos botones (cámara | fototeca).
- [ ] `renderPaso7` captura: dos inputs (cámara múltiple | fototeca múltiple).
- [ ] Compresión con `compressBase64Image` (ya existente) en ambos orígenes.

### Increment | 4 — Homologación bandeja (TecnicoView)
- [ ] Bandeja "Mis OTs": header claro, badges, progreso; eliminar `bg-slate-900`
      solo en esa zona (los 2 headers dark actuales).
- [ ] Ficha/action card ya visible; ajustes menores de tokens.

## 4. Riesgos y dependencias

- **Dependencias:** `guia_ui_ux.md` (tokens §2), `serviceTemplates.ts` y
  `reportDefaults.ts` (lógica de plantillas; solo lectura), `imageCompressor.ts`.
- **Riesgo:** tocar render de un componente con lógica amplia (1018 líneas).
  Mitigación: solo se reemplaza presentación, no menejo de estado/datos.
- **Riesgo:** correr PWA en paralelo (translúc campos de equipo). Este plan NO
  toca sync/offline; el mockup que lo muestra es referencia.

## 5. Evidencias / QA
Al completar se ejecutará skill `qa-engineer` y se generará QA Report en
`Documentacion/evidencias/` (+ pruebas en `Documentacion/pruebas_e2e/`).

---
*Plan incremental (skill `incremental-implementation` + `test-driven-development`) tras mockup aprobado.*