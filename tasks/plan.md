# Implementation Plan: Entidad Visita (Agrupación de OTs por Viaje)

## Overview
Implementar la entidad agrupadora `Visita` para separar la logística del viaje físico (1 solo traslado por cliente/ubicación/fecha/técnico) del trabajo técnico por equipo (1 OT por equipo), manteniendo total retrocompatibilidad con las OTs individuales preexistentes.

## Architecture Decisions
- **Modelo Prisma `Visita`**: Nueva tabla en BD que gestiona los estados de viaje (`PROGRAMADA`, `EN_CAMINO`, `EN_SITIO`, `EN_EJECUCION`, `COMPLETADA`) y almacena timestamps de salida/llegada.
- **Relación con OT**: `OT.visitaId` vincula N OTs a 1 Visita. Si `visitaId` es `null`, la OT opera en modo legacy individual.
- **Cascada de Estados Logísticos**: Al cambiar el estado de la Visita a `EN_CAMINO` o `EN_SITIO`, el backend actualiza en cascada el estado de todas las OTs vinculadas.
- **Validación de Ubicación**: Se exige `Equipo.ubicacion` poblado antes de permitir programar visitas en `ModalProgramarVisita`.
- **Auto-Completado**: Cuando todas las OTs de una Visita están en `INFORME_ENVIADO`, `EN_REVISION`, `APROBADA`, `NO_EJECUTADA` o canceladas, la Visita pasa automáticamente a `COMPLETADA`.
- **Pruebas E2E desde Navegador**: La verificación final exige ejecutar el flujo visual completo interactuando con el navegador (clics, formularios, simulación de roles) y documentarlo en `Documentacion/pruebas_e2e/2026-08-05-entidad-visita-e2e.md`.

## Dependency Graph

```
1. Prisma Schema & Types (Visita model + OT.visitaId + VisitaStatus enum)
   │
   ├── 2. Database Migration (npx prisma db push)
   │
   ├── 3. Backend API Endpoints (server.ts: GET/POST/PUT /api/visitas + cascade + offline sync)
   │
   ├── 4. Frontend Global State (App.tsx: visitas state + fetch + CRUD handlers)
   │
   ├── 5. Operations Programming (ModalProgramarVisita: create Visita + auto-grouping + location validation)
   │
   ├── 6. Technician Field View (TecnicoView: grouped sidebar + logistics action card + OT report lock)
   │
   └── 7. E2E Browser Testing Verification (User-perspective browser validation & documentation)
```

## Task List & Checkpoints

### Phase 1: Foundation (Database & API)
- [ ] **Task 1**: Modelo Prisma `Visita` y campo `visitaId` en `OT` (`prisma/schema.prisma`)
- [ ] **Task 2**: Interfaces y Enums TypeScript (`src/types.ts`)
- [ ] **Task 3**: Endpoints REST para Visitas y lógica de cascada (`server.ts`)
- [ ] **Task 4**: Extensión de sincronización offline (`server.ts` & `App.tsx`)

#### Checkpoint 1: Foundation
- [ ] `npx prisma validate` pasa sin errores
- [ ] `npx prisma db push` ejecuta limpiamente en BD local
- [ ] Endpoints `/api/visitas` responden correctamente

### Phase 2: Operations Scheduling & Integration
- [ ] **Task 5**: State global de visitas y handlers en `App.tsx`
- [ ] **Task 6**: Creación de Visitas y validación de `Equipo.ubicacion` en `ModalProgramarVisita.tsx`
- [ ] **Task 7**: Sugerencia de auto-agrupación para visitas existentes en `ModalProgramarVisita.tsx`

#### Checkpoint 2: Operations Scheduling
- [ ] Programar N equipos crea 1 Visita + N OTs vinculadas en la BD
- [ ] Equipos sin ubicación quedan bloqueados en el modal de programación

### Phase 3: Technician Field View Redesign
- [ ] **Task 8**: Rediseño de Sidebar agrupado por Visitas en `TecnicoView.tsx`
- [ ] **Task 9**: Panel de Acción Logística a nivel Visita (Iniciar Ruta / Registrar Llegada) en `TecnicoView.tsx`
- [ ] **Task 10**: Estado `NO_EJECUTADA` y bloqueo de informes en `EN_REVISION` en `TecnicoView.tsx`
- [ ] **Task 11**: Integración en `TechMonitoringDashboard.tsx` y `OrdenesTrabajoView.tsx`

#### Checkpoint 3: Technician Execution
- [ ] Técnico controla traslados con 1 solo clic a nivel Visita
- [ ] Informes en `EN_REVISION` quedan bloqueados en modo solo lectura

### Phase 4: E2E Browser Testing & Verification
- [ ] **Task 12**: Pruebas E2E completas desde el Navegador con Playwright (`npx playwright test`)
- [ ] **Task 13**: Documentación final y registro de resultados en `Documentacion/pruebas_e2e/2026-08-05-entidad-visita-e2e.md`

## Risks and Mitigations

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Incompatibilidad con OTs antiguas sin `visitaId` | Alto | Tratar `visitaId == null` como OTs individuales legacy con flujo actual intacto |
| Equipos de inventario con ubicación nula | Medio | Exigir y validar `ubicacion` obligatoria en el wizard antes de permitir seleccionar el equipo |
| Conflicto de roles (Apoyo vs Titular) | Bajo | Filtrar controles de traslado para que solo el Titular pueda cambiar estados de viaje de la Visita |
