# Todo List: Feature Entidad Visita

## Phase 1: Foundation (Database & API)
- [x] **Task 1**: Modelo Prisma `Visita` y campo `visitaId` en `OT`
  - Acceptance: Schema Prisma incluye `model Visita` y `OT.visitaId`
  - Verify: `npx prisma validate` + `npx prisma db push`
  - Files: `prisma/schema.prisma`

- [x] **Task 2**: Interfaces y Enums TypeScript
  - Acceptance: `VisitaStatus` enum, `Visita` interface, y `visitaId?: string` en `OT`
  - Verify: `npm run build`
  - Files: `src/types.ts`

- [x] **Task 3**: Endpoints REST en `server.ts`
  - Acceptance: `GET /api/visitas`, `POST /api/visitas`, `PUT /api/visitas/:id` con cascada de estados
  - Verify: `npm run build`
  - Files: `server.ts`

- [x] **Task 4**: Extensión del Sync Offline
  - Acceptance: `POST /api/sync` y cola `localStorage` soportan `visitaState`
  - Verify: `npm run build`
  - Files: `server.ts`, `src/App.tsx`, `src/components/TecnicoView.tsx`

## Phase 2: Operations Scheduling & Integration
- [x] **Task 5**: State Global y Handlers en `App.tsx`
  - Acceptance: `visitas` en state, feteched al montar, propagado a vistas
  - Verify: `npm run build`
  - Files: `src/App.tsx`

- [x] **Task 6**: Programación de Visitas y Validación de Ubicación
  - Acceptance: `ModalProgramarVisita` crea Visita + OTs y deshabilita equipos sin ubicación
  - Verify: Prueba visual en modal
  - Files: `src/components/ot/ModalProgramarVisita.tsx`

- [x] **Task 7**: Sugerencia de Auto-Agrupación
  - Acceptance: Detecta visitas existentes en `PROGRAMADA` para mismo cliente/ubicación/fecha/técnico y sugiere agrupar
  - Verify: Prueba visual en modal
  - Files: `src/components/ot/ModalProgramarVisita.tsx`

## Phase 3: Technician Field View Redesign
- [x] **Task 8**: Rediseño Sidebar Agrupado por Visita
  - Acceptance: `TecnicoView` agrupa OTs por Visita con barra de progreso
  - Verify: Previsualización en navegador
  - Files: `src/components/TecnicoView.tsx`

- [x] **Task 9**: Panel de Acción Logística a Nivel Visita
  - Acceptance: "Iniciar Ruta" y "Registrar Llegada" operan a nivel Visita (solo Titular)
  - Verify: Prueba de clic en navegador
  - Files: `src/components/TecnicoView.tsx`

- [x] **Task 10**: Estado `NO_EJECUTADA` y Bloqueo de Informes
  - Acceptance: Permite marcar `NO_EJECUTADA` con motivo y bloquea informe en `EN_REVISION`
  - Verify: Prueba de edición en navegador
  - Files: `src/components/TecnicoView.tsx`, `src/types.ts`

- [x] **Task 11**: Integración en Monitoreo de Operaciones
  - Acceptance: `TechMonitoringDashboard` y `OrdenesTrabajoView` muestran visitas asociadas
  - Verify: `npm run build`
  - Files: `src/components/TechMonitoringDashboard.tsx`, `src/components/OrdenesTrabajoView.tsx`

## Phase 4: E2E Browser Testing & Verification
- [x] **Task 12**: Pruebas E2E completas desde Navegador con Playwright
  - Acceptance: Todos los flujos del guion E2E ejecutados con Playwright (`npx playwright test` / `npm run test:playwright`) sin errores
  - Verify: Test suite de Playwright en verde (`chromium`)
  - Files: `tests/visitas-workflow.spec.ts`

- [x] **Task 13**: Documentar Resultados E2E
  - Acceptance: Guion y evidencias E2E guardados en `Documentacion/pruebas_e2e/2026-08-05-entidad-visita-e2e.md`
  - Verify: Archivo actualizado
  - Files: `Documentacion/pruebas_e2e/2026-08-05-entidad-visita-e2e.md`
