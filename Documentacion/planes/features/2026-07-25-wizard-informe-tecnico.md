# Plan: Wizard Informe Técnico Adaptativo

## Overview

Reemplazar el formulario scroll infinito actual de `TecnicoView` con un wizard paso a paso de 10 pasos, con sidebar de progreso, burst mode para fotos y vista previa PDF final. El wizard se implementa como un nuevo componente `WizardInforme.tsx` que toma el control del flujo de creación/edición del informe.

## Architecture Decisions

- **Nuevo componente `WizardInforme.tsx`**: self-contained con su propio estado interno. Recibe `ot`, `client`, `equipo`, `initialReport?` como props y emite `onComplete(report)` + `onDraftChange(report)`.
- **Estados del wizard**: `currentStep` (1-10), `stepsCompleted: Set<number>`, `stepsSkipped: Set<number>`.
- **Auto-guardado**: localStorage con key `mafort_wizard_{ot.id}_{equipoId}`, igual que el draft actual.
- **Integración en TecnicoView**: Cuando el técnico hace clic en "Llenar Informe Técnico", se monta `<WizardInforme>` en lugar del formulario actual. Al completar, se llama a `onComplete` que dispara las mismas acciones que `handleSubmitReport`.
- **Burst mode**: Dos fases en paso 7: (1) captura con `<input capture multiple>` que permite tomar N fotos, (2) etiquetado donde se asignan fotos a slots. Se usa el mismo canvas crop/resize de `handlePhotoUpload`.
- **Vista previa PDF**: Paso 10 usa `<DocumentFormat>` en miniatura con scroll/tabs de páginas. No se renderiza para impresión real sino como preview visual.
- **getPhotoSlotsForTipo**: Se rediseña la fórmula para que `base = fotosMin`, y se suma `kvaBonus` en lugar de `Math.max`.

## Task List

### Phase 1: Foundation
- [ ] Task 1: Refactor `getPhotoSlotsForTipo` con nueva fórmula base + kvaBonus
- [ ] Task 2: Crear `WizardInforme.tsx` con shell layout (sidebar steps + main area + navegación)

### Checkpoint: Foundation
- [ ] Build succeeds
- [ ] Wizard renders with empty steps and navigation working

### Phase 2: Core Steps
- [ ] Task 3: Implementar Paso 1 (Tipo de Servicio) + auto-selección
- [ ] Task 4: Implementar Paso 2 (Cabecera) con auto-carga de datos
- [ ] Task 5: Implementar Pasos 3-6 (Antecedentes, Acciones, Pasos, Características)

### Checkpoint: Core Steps
- [ ] Build succeeds
- [ ] Steps 1-6 navigatable with data persistence

### Phase 3: Complex Steps
- [ ] Task 6: Implementar Paso 7 (Burst Mode Fotos + Etiquetado)
- [ ] Task 7: Implementar Pasos 8-9 (Mediciones, Diagnóstico)

### Checkpoint: Complex Steps
- [ ] Build succeeds
- [ ] Photo capture + labeling works
- [ ] Measurements and diagnostic steps work

### Phase 4: Final Step + Integration
- [ ] Task 8: Implementar Paso 10 (Revisión Final + Vista Previa PDF)
- [ ] Task 9: Integrar WizardInforme en TecnicoView reemplazando formulario actual
- [ ] Task 10: Verificación final: `npm run build` exitoso

### Phase 5: Ship
- [ ] Commit y push a `feature/informe-adaptativo-tipo-servicio`

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| TecnicoView es 2316 líneas, integrar wizard es riesgoso | High | Hacerlo en una rama, mantener formulario old como fallback, integrar gradual |
| Burst mode con `<input capture multiple>` no funciona en iOS Safari | Med | Fallback a captura individual secuencial (input file sin multiple) |
| Estado del wizard no se sincroniza con auto-save existente | Med | Unificar en un solo localStorage key, deshabilitar auto-save viejo cuando wizard activo |

## Open Questions

- ¿Los datos de Equipo/Cliente están completos en BD para auto-carga? Validar con OTs reales.
