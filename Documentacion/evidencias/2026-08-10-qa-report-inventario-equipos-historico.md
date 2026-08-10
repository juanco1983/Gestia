# QA Report — Inventario de Equipos + Histórico de Informes

> **Fecha**: 2026-08-10
> **Rama**: `feature/inventario-equipos-historico`
> **Cambio**: Feature (frontend + backend) — módulo consolidado de inventario de
> equipos con histórico de informes técnicos por equipo y descarga PDF directa.

## Archivos afectados

- **Nuevos**: `src/components/InventarioEquiposView.tsx`,
  `src/components/InventarioEquipoDrawer.tsx`, `tests/inventario-equipos.spec.ts`,
  `Documentacion/pruebas_e2e/2026-08-10-inventario-equipos-historico.md`.
- **Modificados**: `server.ts` (endpoint `GET /api/inventario-equipos`,
  `ESTADOS_VISITA_FUTURA`, seeds con `InventarioEquipos`),
  `src/types.ts` (DTOs), `src/modulesConfig.tsx`, `src/App.tsx` (union type,
  filtro sidebar por rol, `currentRole` navegable por Técnico, excepción en
  sync-route), `src/mockData.ts`, `src/utils/reseedDb.ts`.
- **Docs**: spec + plan actualizado
  `Documentacion/planes/features/2026-08-10-inventario-equipos-historico-spec.md`,
  mockup `Documentacion/mockups/inventario-equipos-historico.html`.

## Pruebas ejecutadas

### E2E Playwright (navegador real, `npx playwright test tests/inventario-equipos.spec.ts`)
| Test | Resultado |
|---|---|
| Muestra header, KPIs y la tabla con los equipos sembrados | ✔ PASS |
| Búsqueda por código filtra la tabla | ✔ PASS |
| El drawer muestra el histórico de informes con su detalle y voltajes | ✔ PASS |
| Cambiar estado del equipo requiere confirmación y muestra toast de éxito | ✔ PASS |
| El rol Técnico ve el módulo en solo lectura sin acciones destructivas | ✔ PASS |

Resultado: **5 passed** (2m 12s). Videos `.webm` generados en `test-results/`
(config `video: 'on'`).

### Compilación / lint
- `npx tsc --noEmit` → **limpio** (0 errores).
- `npm run build` (vite + esbuild) → **éxito** (~1min).

## Durante el desarrollo se resolvieron 5 hallazgos

1. **El módulo no aparecía en el sidebar para Admin**: los usuarios sembrados
   tienen `allowedModules` poblado (sin `InventarioEquipos`) y el filtro de
   `App.tsx` hacía `early-return` por esa lista. **Fix**: evaluar
   `InventarioEquipos` por rol (Admin/Ventas/Supervisor/Técnico) ANTES del chequeo
   de `allowedModules`, con `||` sobre la lista. Además se añadió el id a los
   seeds (`server.ts`, `reseedDb.ts`, `mockData.ts`).
2. **El clic en el sidebar no navegaba para el rol Técnico**: el efecto
   "sync route on role switch" (`App.tsx`) revertía `currentRole` a `'Tecnico'` al
   no ser Admin/Ventas. **Fix**: excepción `currentRole !== 'InventarioEquipos'`.
3. **El toast de éxito no era visible tras cambiar estado**: `onChanged()` cerraba
   el drawer en el mismo render que `notifySuccess` (el toast es estado local del
   drawer). **Fix**: `refresh()` recarga la lista y mantiene el drawer abierto
   actualizando `selected` si el equipo persiste; solo lo cierra si desapareció.
4. **El tour guiado bloqueaba el sidebar** en E2E (overlay driver.js). **Fix** en el
   spec: fijar `gestia_tour_progreso_visto=1` + reload tras login.
5. **Selectores errados en el spec** (anidamiento del drawer). **Fix**: apuntar a
   elementos a nivel de página dentro del `.fixed.inset-0` del drawer.

## Cobertura
- Vista: KPIs, tabla, filtros, búsqueda debounce, paginación, estado vacío.
- Drawer: histórico completo con voltajes, estados de OT, PDF, acciones con
  confirmación y toast, y rol Técnico en solo lectura.
- Backend: endpoint validado con datos reales (resolución directa + fallback legacy).
- NO cubierto en E2E: registro/creación de equipos (CRUD completo queda para fases
  posteriores; hoy solo lectura + estado/eliminación), generación real del PDF en
  ventana de impresión (solo se validó presencia del botón e invocación del flujo).

## Riesgos / dependencias
- El PDF depende del patrón `printWindow` existente en `TablaOrdenesTrabajo`;
  requiere permisos de pop-up en el navegador del usuario final.
- La resolución legacy de informes (equipos sin `equipoId`) se verifica contra
  `OtEquipoAsignacion`; conviene una migración de datos a `TechnicalReport.equipoId`.

## Status
**APPROVED** — 5 escenarios E2E pasan en navegador real, lint/typecheck limpios,
evidencia en video `.webm` generada y guion persistido en `Documentacion/pruebas_e2e/`.