# Plan — Módulo Inventario de Equipos

**Fecha:** 2026-07-25
**Rama:** `feature/inventario-equipos` (partida de `dev` post-merge PR #68, #69, #70, #71)
**Tipo:** feature
**Mockup de referencia:** [`Documentacion/mockups/inventario-equipos.html`](../../mockups/inventario-equipos.html) — aprobado por usuario el 2026-07-25

> **ACTUALIZACIÓN 2026-08-10 (ciclo vigente):** este plan V1 no llegó a
> implementarse (rama descartada, su único commit ya está en `dev`). El ciclo que
> se ejecuta ahora se especifica en
> [`2026-08-10-inventario-equipos-historico-spec.md`](2026-08-10-inventario-equipos-historico-spec.md)
> y su mockup vigente (con la card de **Histórico de Informes Técnicos**) es
> [`Documentacion/mockups/inventario-equipos-historico.html`](../../mockups/inventario-equipos-historico.html).
> Rama nueva: `feature/inventario-equipos-historico`.

---

## 1. Contexto

Gestia actualmente gestiona equipos (`Equipo` en `prisma/schema.prisma:263-282`) como entidades secundarias vistas solo dentro del módulo Comercial (`ClientesContratosView.tsx:2298-2330, 2718-2790`). No existen:

- Vista consolidada de todos los equipos (listado global).
- Buscador ni filtros por empresa/estado/tipo.
- Visibilidad del historial de visitas efectuadas y futuras programadas por equipo.
- Visibilidad de informes técnicos por equipo.
- Entrada de menú propia para "Inventario de Equipos".

El usuario necesita un módulo dedicado accesible desde el menú principal que resuelva todos estos puntos.

## 2. Alcance

### Incluido (V1 — este ciclo)

- Entrada **"Inventario de Equipos"** en el menú lateral (`src/modulesConfig.tsx`) → nuevo `id: 'InventarioEquipos'` con icono `Boxes` de `lucide-react`, accesible para Administrador, Ventas, Supervisor, Técnico (este último en solo-lectura).
- Vista `src/components/InventarioEquiposView.tsx` nueva con:
  - Header card canónico (`bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px...]`).
  - 4 KPI cards: Total Equipos, Operativos (cantidad + %), En Obs. + Repar., Próximas Visitas.
  - Buscador texto libre (código, serie, marca, modelo).
  - Filtros: button group de estado (Todos/Operativo/En Reparación/Baja) + select Empresa + select Tipo.
  - Tabla con columnas: Código, Modelo, Serie, Voltaje Ult. Informe, Empresa, Estado (badge por color), Visitas (Hist/Futuras), Acción (ver detalle).
  - Paginación cliente-side (10/fila).
- Drawer lateral de detalle (reaprovecha esqueleto de `EquipoDetailDrawer.tsx` tras homologación cosmética puntual) con 6 cards: Ficha Técnica, Empresa y Contrato, Voltaje Último Informe (con nota aclaratoria), Visitas Históricas (timeline), Visitas Futuras (badges), Informes Técnicos (lista). Footer: Editar + Eliminar (`<ConfirmModal>` danger).
- Estado vacío canónico (icono `Boxes` + CTA "Agregar Equipo").
- Cambio de estado con `<ConfirmModal>` y notificación `<ToastModal>` (reusa ambos patrones canónicos ya mergeados en `dev`).
- Endpoint nuevo `GET /api/inventario-equipos` en `server.ts` que trae en una sola query (con `include`): `servicios` (count + último), OTs futuras (vía `OtEquipoAsignacion` + `OT` join), último `TechnicalReport` (para voltaje), cliente (vía `clienteId` OR `contrato.clientId`).
- Registro en `App.tsx` de `currentRole === 'InventarioEquipos'` en el switch de vistas.
- Acceso visual a roles.

### Excluido (V2 — próximo ciclo, post-PR)

- Prisma migration para `@@index([equipoId])` en `OtEquipoAsignacion` (optimización query visitas futuras) — V1 usa query sin índice, compatible con datasets actuales.
- Agregar `voltajeNominal Float?` a `Equipo` (V1 muestra voltaje del último informe, documentado como tal).
- Formalizar `@relation` entre `Equipo` y `Client` (V1 usa FK soft como ya hace `server.ts:1511-1516`).
- CRUD completo de equipos (V1: cambiar estado, ver detalle. Crear/editar queda fuera de scope — ya existe en `ClientesContratosView`).
- Export CSV/PDF del listado.
- Push de toast auto-dismiss (queda como deuda de §5.4 `guia_ui_ux.md`).

## 3. Criterios de aceptación

1. Item "Inventario de Equipos" aparece en el menú lateral para todos los roles (con badge "247" placeholder en V1).
2. Click → carga `InventarioEquiposView` con header + KPIs + buscador + filtros + tabla.
3. Tabla muestra datos reales del endpoint `GET /api/inventario-equipos`.
4. Buscador filtra por código, serie, marca, modelo en tiempo real (debounce 300ms).
5. Filtros funcionan: estado (button group), empresa (select poblado con `Client.razonSocial`), tipo (select poblado con `Equipo.tipo` distintos).
6. KPIs recalculan al aplicar filtros.
7. Click en botón "ver detalle" (icono `Eye`) abre drawer con los 6 cards poblados.
8. "Cambiar Estado" en drawer abre `<ConfirmModal>` con `tone: 'warning'`, al confirmar ejecuta `PUT /api/equipos/:id/estado` ya existente + muestra `<ToastModal>` success.
9. "Eliminar" en drawer abre `<ConfirmModal>` con `tone: 'danger'`, al confirmar ejecuta `DELETE /api/equipos/:id` existente + toast success + refresh del listado.
10. Estado vacío: cuando `/api/inventario-equipos` retorna `[]`, se muestra icono `Boxes` grande + CTA "Agregar Equipo" (placeholder → link a `ClientesContratosView` que ya tiene la vista de creación).
11. Responsive 320/768/1024/1440 según skill `frontend-ui-engineering`.
12. Sin `window.alert/confirm/prompt`, sin emojis en UI, sin hex crudos, sin utilidades Tailwind v4 inválidas (reglas `AGENTS.md`).
13. Typecheck `tsc --noEmit` limpio.
14. Drawer cumple ARIA modal (`aria-modal`, `aria-labelledby`, foco trap, `Escape` cierra, click en backdrop cierra).

## 4. Desglose de tareas

### DEFINE (skills: spec-driven-development + planning-and-task-breakdown)
- [x] Análisis codebase (schema/API/Dashboard/components) — completado
- [x] Mockup HTML aprobado por usuario — completado (`Documentacion/mockups/inventario-equipos.html`)
- [x] Spec + plan formal — este documento (commit)

### BUILD (skill: incremental-implementation + frontend-ui-engineering + api-and-interface-design)
- [ ] **T1 — Backend:** Endpoint `GET /api/inventario-equipos` en `server.ts`. Soporta `?q&clienteId&estado&tipo&page&page_size`. Resuelve agregados en una sola query con `include`. Asignar a subagente `general` con skill `api-and-interface-design`.
- [ ] **T2 — Backend:** Test mínimo del endpoint (verify schema de respuesta + filtros).
- [ ] **T3 — Tipos:** Extender `src/types.ts` con `InventarioEquipoDTO` (Equipo + agregados: `visitasHistoricasCount`, `visitasFuturas`, `ultimoInforme?`, `empresa?`). Actualizar `data_dictionary.md §9` (commit en misma PR por regla `AGENTS.md`).
- [ ] **T4 — Frontend skeleton:** Crear `src/components/InventarioEquiposView.tsx` con header card + KPI cards + estado vacío (sin tabla aún). Skill `frontend-ui-engineering`.
- [ ] **T5 — Frontend tabla + filtros + buscador:** Filtros button group + selects + input. Lógica `useState` para filtros, `useEffect` para fetch del endpoint con debounce. Tabla canónica con columnas definidas en mockup. Paginación.
- [ ] **T6 — Frontend drawer de detalle:** Drawer overlay (mismo patrón que `ConfirmModal`/`ToastModal` — `createPortal`). 6 cards. Reusa esqueleto de `EquipoDetailDrawer.tsx` pero con homologación cosmética (sin `animate-slide-in-right`, sin `#00B594`, sin `createPortal` duplicado).
- [ ] **T7 — Frontend acciones:** Cambiar estado (`<ConfirmModal>` warning + `PUT` + toast success). Eliminar (`<ConfirmModal>` danger + `DELETE` + toast + refresh).
- [ ] **T8 — Integración menú:** Agregar entrada en `modulesConfig.tsx` con `id: 'InventarioEquipos'`, `displayLabel: 'Inventario de Equipos'`, icono `Boxes`, badge placeholder. Actualizar union type de `currentRole` en `App.tsx:162` para incluir `'InventarioEquipos'`. Render condicional `currentRole === 'InventarioEquipos' && <InventarioEquiposView ... />`.

### VERIFY (skills: test-driven-development + debugging-and-error-recovery)
- [ ] **T9 — Typecheck** `npm run lint` limpio.
- [ ] **T10 — Browser testing** (`browser-testing-with-devtools` se requiere Chrome DevTools MCP, pero si no disponible se valida manual): carga vista en desktop y mobile, aplica filtros, abre drawer, ejecuta cambio de estado y eliminación en dev local.

### REVIEW (skills: code-review-and-quality + code-simplification)
- [ ] **T11 — Code review**的五 axis (seguridad, performance, accesibilidad, design adherence, mantenimiento).

### SHIP (skills: git-workflow-and-versioning + documentation-and-adrs + shipping-and-launch)
- [ ] **T12 — Commit atómicos por tarea** (T1-T8 separados en commits conceptuales). Push continuo a `origin/feature/inventario-equipos`.
- [ ] **T13 — PR a `dev`** con descripción basada en este plan, link al mockup, capturas de pantalla (si browser testing).
- [ ] **T14 — ADR** en `Documentacion/` registrando decisión de V1 sin Prisma migration (decisión documentada en sección 5 de este plan).

## 5. Riesgos y dependencias

### Riesgos

| # | Riesgo | Prob | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | Query `OtEquipoAsignacion` por `equipoId` sin índice es full scan | Media | Bajo (datasets actuales <1000 equipos) | Aceptar en V1. Mitigar en V2 con Prisma migration `@@index([equipoId])`. |
| R2 | Equipos sin `clienteId` ni `contratoId` muestran empresa vacía | Baja | Medio | Endpoint usa OR `clienteId`/`contrato.clientId` (patrón `server.ts:1511-1516`). Caso: equipo en adenda — evaluar. |
| R3 | `EquipoDetailDrawer.tsx` requiere homologación cosmética (`animate-slide-in-right`, `#00B594`, `createPortal` dup) | Alta | Bajo | Homologar solo lo que se toca (scope discipline). No refactorizar completo. |
| R4 | No hay tabla shared canónica — tabla nueva puede divergir de `TablaOrdenesTrabajo.tsx` | Media | Bajo | Extraer `<Tabla>` shared se posterga a V2. V1 define tabla local inline siguiendo mockup. |
| R5 | El `currentRole` union type en `App.tsx:162` puede romper otros switch | Baja | Alto | Agregar `'InventarioEquipos'` al union type sin tocar otros casos. Typecheck detecta breaks. |

### Dependencias

- ✅ `<ToastModal>` + `useLocalToast` (mergeado en `dev` PR #68 + fix PR #69).
- ✅ `<ConfirmModal>` + `useConfirm` (mergeado en `dev` PR #68 + fix PR #69).
- ✅ Rama `feature/inventario-equipos` creada.
- ⏳ Mockup aprobado (inventario-equipos.html).
- ⏳ Regla de planes por categoría (este documento lo sigue).

## 6. Decisiones de diseño

- **Voltaje**: V1 muestra voltaje del último `TechnicalReport` (atributo del informe, no del equipo). Nota tipográfica `text-[10px] text-slate-400 font-mono uppercase` visible en el drawer ("Voltaje es atributo del último informe técnico, no del equipo") para gestionar expectativa del usuario. V2: agregar `voltajeNominal Float?` a `Equipo` si se quiere mostrar nominal fijo.
- **Visitas Futuras**: query a `OT` con `estado` IN (`'Creada'`, `'Pendiente de Programación'`, `'Asignada'`, `'Programada'`) AND `fechaProgramada >= hoy` cruzado con `OtEquipoAsignacion` para asociar el equipo. Se hace en backend para minimizar round-trips.
- **Visitas Históricas**: `ServicioEquipo[]` count → campo derivado `visitasHistoricasCount: number` en el DTO.
- **Tabla canónica**: V1 define tabla local inline en `InventarioEquiposView.tsx` (no extraer shared). Consideración futura: extraer `<Tabla>` shared si V2 añade más listados.
- **Roles con acceso**: Administrador, Ventas, Supervisor, Técnico. Técnico en solo-lectiva (sin botón Eliminar, sin "Cambiar Estado" — solo ver). Verificación en `InventarioEquiposView` por `currentUser.role`.
- **Drawer**: drawer right-side overflow, máximo 480px en desktop, full-width en mobile, con `createPortal`-style del patrón ConfirmModal.

## 7. URLs rapidas

- Mockup: `C:\Informes Mafort IA\Documentacion\mockups\inventario-equipos.html`
- Schema: `prisma/schema.prisma:263-282` (Equipo), `295-310` (ServicioEquipo), `312-327` (OtEquipoAsignacion)
- API existente: `server.ts:1506-1664`
- Tipos: `src/types.ts:309-365`
- Skill activos: `frontend-ui-engineering`, `api-and-interface-design`, `incremental-implementation`, `test-driven-development`

## 8. Próximos pasos del operador

1. Commit este plan + reglas AGENTS + reorganización carpetas + mockup en rama `docs/planes-por-categoria`.
2. Push + URL PR a `dev`.
3. Cuando el PR de docs mergeee, volver a `feature/inventario-equipos`, hacer `git pull origin dev` para sincronizar.
4. Lanzar subagente `general` para T1 (endpoint backend) con skill `api-and-interface-design`.
5. Lanzar subagente `general` para T4-T7 (frontend) con skill `frontend-ui-engineering` en incremental.

