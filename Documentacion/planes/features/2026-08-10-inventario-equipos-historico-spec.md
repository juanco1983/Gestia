# Spec: Módulo Inventario de Equipos + Histórico de Informes Técnicos

## Objetivo

Entregar el módulo **Inventario de Equipos** (plan V1 de julio 2026, nunca
implementado) y, como eje nuevo de este ciclo, que cada equipo tenga **adjuntos
todos los informes técnicos generados en su historia** para consultarlos desde un
único lugar: número de informe, fecha de servicio, tipo de servicio, técnico,
estado de la OT, voltajes de entrada/salida y descarga directa del PDF.

Usuario objetivo: Administrador, Ventas, Supervisor (edición) y Técnico
(solo-lectura). Éxito = vista consolidada nacional de equipos + histórico íntegro
de informes por equipo con PDF descargable.

## Estado base (dónde partimos)

- El plan V1 existe en `Documentacion/planes/features/2026-07-25-inventario-equipos.md`
  (T1-T14 sin implementar). Mockup aprobado en julio: `Documentacion/mockups/inventario-equipos.html`.
- No existe `InventarioEquiposView.tsx` ni endpoint `/api/inventario-equipos`.
- La rama vieja `feature/inventario-equipos` está 124 commits atrás de `dev` y su
  único commit (fix ToastModal/ConfirmModal) ya está en `dev` → se descarta.
- Piezas reutilizables ya en `dev`:
  - `src/components/EquipoDetailDrawer.tsx` — drawer con ficha del equipo.
  - `src/components/ot/ModalDetalleEquipos.tsx:386-394` — patrón para resolver
    informes por equipo (`equipoId` directo + vía `OtEquipoAsignacion`).
  - `TablaOrdenesTrabajo.tsx:70-160` — mecanismo de export PDF mediante
    `printWindow` + `billing-pdf-download-element`.
  - `.shared`/patrones canónicos: `<ConfirmModal>`, `<ToastModal>`, `useConfirm`,
    `useLocalToast` (mergeados PR #68/#69).
  - Endpoints ya existentes: `GET /api/equipos`, `GET /api/equipos/:id`,
    `PUT /api/equipos/:id/estado`, `DELETE /api/equipos/:id`.

## Reglas de negocio / alcance

### Alcance incluido (este ciclo)
1. Entrada de menú "Inventario de Equipos" (`modulesConfig.tsx`) → id
   `'InventarioEquipos'`, icono `Boxes`, roles: Administrador, Ventas, Supervisor,
   Técnico (solo lectura: sin Eliminar ni Cambiar Estado).
2. `InventarioEquiposView.tsx` con header canónico, 4 KPI, buscador libre
   (código/serie/marca/modelo, debounce 300ms), filtros (estado button-group,
   select Empresa, select Tipo), tabla con columnas del mockup, paginación 10/fila.
3. Drawer de detalle con 6 cards (Ficha, Empresa y Contrato, Voltaje último
   informe, Visitas históricas, Visitas futuras, **Informes Técnicos**).
4. **Informes Técnicos — histórico completo**: por equipo, listar TODOS los
   `TechnicalReport` vinculados, ordenado por `fechaServicio` desc, cada fila
   mostrando: N° informe, fecha, tipo de servicio, técnico asignado, estado de la
   OT (texto + badge), voltaje entrada/salida y botón **PDF** de descarga directa.
   - Resolución de informes por equipo: `report.equipoId === eq.id` (per-equipo) +
    fallback vía `OtEquipoAsignacion` (patrón `ModalDetalleEquipos.tsx:387-394`).
   - Estado de la OT: del join `TechnicalReport.otId → OT.estado`.
5. Cambio de estado del equipo con `<ConfirmModal>` warning + toast; Eliminar con
   `<ConfirmModal>` danger + toast.
6. Estado vacío canónico (icono `Boxes` + CTA "Agregar Equipo").
7. Responsive 320/768/1024/1440. Cero `window.alert/confirm/prompt`, cero emojis,
   tokens `teal-*`, sin utilidades Tailwind v4 inválidas ni tamaños tipográficos
   arbitrarios.

### Alcance excluido (V2)
- CRUD completo de equipos en el módulo (crear/editar campos sigue en
  `ClientesContratosView`); aquí solo cambiar estado y eliminar.
- Export CSV/PDF del listado.
- Prisma migration `@@index([equipoId])` en `OtEquipoAsignacion`; `voltajeNominal`
  en `Equipo`; relación formal `Equipo↔TechnicalReport` (V1 usa `equipoId` soft).
- Generación del PDF en servidor (V1 usa el export por navegación existente).

## Tecnología
- React 18 + TypeScript + Vite + Tailwind v4. `lucide-react` para iconos.
- Backend Express en `server.ts` (monolito), Prisma (Postgres).
- driver.js ya está para el tour (no aplica aquí). Sin dependencias nuevas
  (confirmado: PDF se resuelve con el mecanismo existente de print).

## Comandos
- Build: `npm run build`
- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`
- E2E: `npx playwright test tests/inventario-equipos.spec.ts`
- Dev: `npx tsx server.ts` (sirve `dist/`; requiere build antes de E2E)
- QA (gate previo a PR): skill `qa-engineer` — deleteMany `TechnicalReport` por
  equipo se valida con integración real + Playwright navegador.

## Estructura
- `server.ts` — endpoint `GET /api/inventario-equipos` (+ subsistencia de los ya
  existentes). Resolución de informes por equipo en la respuesta.
- `src/types.ts` — tipos `InventarioEquipoDTO`, `InformeEquipoDTO`.
- `src/components/InventarioEquiposView.tsx` — nueva vista.
- `src/components/equipo/InventarioEquipoDrawer.tsx` — nuevo drawer (deriva de
  `EquipoDetailDrawer` con homologación, los 6 cards + histórico con PDF).
- `src/modulesConfig.tsx` + `src/App.tsx` — entrada de menú y switch de rol.
- `tests/inventario-equipos.spec.ts` — E2E Playwright.
- Docs: plan (actualizar `2026-07-25-inventario-equipos.md` en rama), ADR nuevo,
  guion `Documentacion/pruebas_e2e/2026-08-10-inventario-equipos-historico.md`,
  mockup `Documentacion/mockups/inventario-equipos-historico.html`.

## Code style
Seguir el Dashboard como única referencia visual. Ejemplo de estilo aceptable:

```tsx
<button className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Ver detalle">
  <Eye size={14} />
</button>
```

Reglas: tokens `teal-brand`/`teal-deep` (nunca hex crudos), font mono para
códigos/números, badges con `bg-{color}-50 text-{color}-700 border border-{color}-200`,
header card `bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]`,
notificaciones vía `<ToastModal>`, confirmaciones vía `<ConfirmModal>` (nunca
`window.alert/confirm`). Nombres en Español/camelCase según repo.

## Estrategia de prueba
- `npx tsc --noEmit` limpio y `npm run lint` EXIT 0.
- **Integración**: `POST` crea OT/informe vinculado a equipo → el histórico del
  equipo devuelve el informe con estado correcto. Incluir caso de informe legacy
  (`equipoId = null` con asignación por `OtEquipoAsignacion`).
- **E2E Playwright** (`video: 'on'`): vista inventario carga KPIs + tabla real;
  abrir drawer en equipo con histórico >1 y verificar filas + botón PDF; aplicar
  filtros/buscador; cambiar estado con ConfirmModal + toast; vista Técnico sin
  botones de acción. Guardar guion en `Documentacion/pruebas_e2e/`.
- **QA Report**: `Documentacion/evidencias/` (definitiva antes del merge a `dev`),

## Límites
- **Always**: typecheck/lint antes de commit; validar con BD real (Postgres, no
  mock); QA gate con video `.webm`; commits atómicos + push por commit.
- **Ask first**: cambios en `prisma/schema.prisma` (no previstos), dependencias
  nuevas (no previstas), cambios en CI/CD.
- **Never**: `window.alert/confirm/prompt`; emojis en UI; hex crudos; utilidades
  Tailwind v4 inválidas; commits directos a `dev`/`main`.

## Criterios de éxito
1. Menú "Inventario de Equipos" visible para los 4 roles, con carga real.
2. KPIs/filtros/buscador funcionan contra BD real.
3. Drawer muestra el histórico íntegro de informes del equipo (todos, no solo el
   último), con N° informe, fecha, tipo, técnico, estado OT y voltajes.
4. Botón PDF descarga el informe (print) sin errores de consola.
5. Cambio de estado y Eliminar con confirm/notificación canónica.
6. Typecheck, lint y E2E (3+ tests) verdes.
7. QA Report APPROVED + videos `.webm` en `test-results/`.
8. Ruta técnica solo lectura (sin Eliminar/Cambiar Estado).

## Preguntas abiertas
- Sin respuestas pendientes: el usuario eligió "Módulo completo + histórico",
  "Resumen completo" por informe y "Descarga directa" del PDF.
- V2 candidatos: voltaje nominal por equipo (hoy se muestra el del último
  informe, ya documentado en el mockup con nota aclaratoria).