# QA Report — Inventario de Equipos + Histórico de Informes

> **Fecha**: 2026-08-10 (incremento estado derivado + modal Ver validado 2026-08-11)
> **Rama**: `feature/inventario-equipos-historico`
> **Cambio**: Feature (frontend + backend) — módulo consolidado de inventario de
> equipos con histórico de informes técnicos por equipo, estado derivado del último
> informe y modal de vista previa del informe (formato documento) + descarga PDF.

## Archivos afectados

- **Nuevos**: `src/components/InventarioEquiposView.tsx`,
  `src/components/InventarioEquipoDrawer.tsx`, `tests/inventario-equipos.spec.ts`,
  `Documentacion/pruebas_e2e/2026-08-10-inventario-equipos-historico.md`.
- **Modificados**: `server.ts` (endpoint `GET /api/inventario-equipos` con
  `deriveEstadoEquipo`, filtro por estado y KPIs sobre estado derivado, DTO de
  informes con campos de diagnóstico, `estadoOrigen`/empresa en el equipo,
  `ESTADOS_VISITA_FUTURA`, seeds con `InventarioEquipos`),
  `src/components/InventarioEquipoDrawer.tsx` (panel "Estado según último informe",
  botones Ver + PDF, modal `viewReport` con `DocumentFormat`, eliminación de
  "Cambiar Estado"), `src/types.ts` (DTOs ampliados), `src/modulesConfig.tsx`,
  `src/App.tsx` (union type, filtro sidebar por rol, `currentRole` navegable por
  Técnico, excepción en sync-route), `src/mockData.ts`, `src/utils/reseedDb.ts`.
- **Docs**: spec + plan actualizado
  `Documentacion/planes/features/2026-08-10-inventario-equipos-historico-spec.md`,
  mockup `Documentacion/mockups/inventario-equipos-historico.html` (aprobado:
  panel estado derivado, botones Ver+PDF, Pantalla 4 modal vista previa).

## Pruebas ejecutadas

### E2E Playwright (navegador real, `npx playwright test tests/inventario-equipos.spec.ts`)
| Test | Resultado |
|---|---|
| Muestra header, KPIs y la tabla con los equipos sembrados | ✔ PASS |
| Búsqueda por código filtra la tabla | ✔ PASS |
| El drawer muestra el histórico de informes con su detalle y voltajes | ✔ PASS |
| El estado del equipo se deriva del diagnóstico del último informe | ✔ PASS |
| El botón Ver abre el modal con el informe en formato documento (PDF) y permite descargar | ✔ PASS |
| El rol Técnico ve el módulo en solo lectura sin acciones destructivas | ✔ PASS |

Resultado: **6 passed** en 3 corridas consecutivas estables (~2-2.8m). Videos
`.webm` generados en `test-results/` (config `video: 'on'`).

### Compilación / lint
- `npx tsc --noEmit` → **limpio** (0 errores).
- `npm run build` (vite + esbuild) → **éxito** (~1-2min).

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
   *(Este flujo quedó obsoleto al eliminar la acción manual "Cambiar Estado".)*
4. **El tour guiado bloqueaba el sidebar** en E2E (overlay driver.js). **Fix** en el
   spec: fijar `gestia_tour_progreso_visto=1` + reload tras login.
5. **Selectores errados en el spec** (anidamiento del drawer). **Fix**: apuntar a
   elementos a nivel de página dentro del `.fixed.inset-0` del drawer.

## Hallazgos del incremento de hoy (estado derivado + modal Ver)

1. **El campo `empresa` desapareció del DTO del endpoint**: al editar el bloque de
   retorno de `GET /api/inventario-equipos` para el estado derivado se eliminó
   accidentalmente la línea `empresa`, dejando `empresa=null` en las filas.
   **Fix**: restaurado el campo; verificado contra la API real (`Prosegur Test S.A.`).
2. **Strict-mode en el spec**: `getByRole('button', { name: 'Cerrar' })` resolvía 4
   botones (Cerrar sesión x2 + drawer + modal). **Fix**: scoping al overlay del
   modal (`z-[9500]`) con `getByLabel('Cerrar')`.
3. **Ruido flaky de consola `Failed to load resource ... 404 ()`** (sin URL):
   subresource del navegador (favicon/fonts), no del server — confirmado con
   listener de `response` en 13+ corridas dirigidas (cero 4xx del app). **Fix**:
   filtrar ese ruido y `favicon` en los asserts de consola, patrón ya usado por el
   resto de specs del repo.

## Cobertura
- Vista: KPIs (sobre estado derivado), tabla, filtros, búsqueda debounce, paginación, estado vacío.
- Estado derivado: regla completa validada (operativo vs en observación), sin acción manual.
- Drawer: histórico completo con voltajes, estados de OT, Ver + PDF, panel de estado derivado.
- Modal Ver: vista previa del informe en formato documento con `DocumentFormat` y botón Descargar PDF.
- Backend: endpoint validado con datos reales (resolución directa + fallback legacy).
- NO cubierto en E2E: registro/creación de equipos (CRUD completo queda para fases
  posteriores; hoy solo lectura), generación real del PDF en ventana de impresión
  (solo se validó presencia del botón, el modal Ver usa el render en pantalla).

## Riesgos / dependencias
- El modal Ver comparte `DocumentFormat` con el flujo de impresión de OT; cualquier
  cambio futuro en ese componente afecta la vista previa del inventario.
- La resolución legacy de informes (equipos sin `equipoId`) se verifica contra
  `OtEquipoAsignacion`; conviene una migración de datos a `TechnicalReport.equipoId`.

## Status
**APPROVED** — 6 escenarios E2E pasan en navegador real (3 corridas consecutivas),
lint/typecheck limpios, build OK, evidencia en video `.webm` generada y guion
persistido en `Documentacion/pruebas_e2e/`.