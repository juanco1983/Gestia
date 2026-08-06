# Plan QA — Pruebas E2E de UI exhaustivas (todo el sistema, desde el navegador)

**Fecha:** 2026-08-01
**Tipo:** QA (pruebas end-to-end desde el navegador con Playwright)
**Alcance:** Todo el sistema Gestia (5 roles, todos los módulos, todos los campos)
**Herramienta:** Playwright (`@playwright/test` disponible en devDependencies) + servidor local `http://localhost:3000`

## Contexto

El runner E2E existente (`scratch/e2e-test-runner.ts`) valida el backend **por API**,
pero **no cubre el llenado de campos en la UI**. El usuario detectó que muchos
campos de los modales no se llenan en las pruebas actuales. Se requiere una capa de
pruebas **desde el navegador real** (Playwright) que recorra **todas las opciones del
sistema**, **y llene TODOS los campos** de cada formulario/modal de cada módulo.

Estas pruebas servirán además como **pase de regresión para el rediseño UX/UI** del
módulo de Gestión de OT (ver `Documentacion/planes/UX-UI/2026-08-01-rediseno-modulo-gestion-ot.md`).

## Cuentas de prueba (login con password `mafort`)

| Rol | Email | Módulos accesibles |
|---|---|---|
| Administrador | `admin@mafort.pe` | Dashboard, Monitoreo, GestionOTs, ClientesContratos, Ventas, Tecnico, Supervisor, Cliente, Usuarios |
| Ventas | `ventas@mafort.pe` | Dashboard, Monitoreo, GestionOTs, ClientesContratos, Ventas |
| Tecnico | `juan.cordova@materiagris.pe` | Dashboard, Monitoreo, Tecnico |
| Supervisor | `supervisor@mafort.pe` | Dashboard, Monitoreo, Supervisor |
| Cliente | `cliente@mafort.pe` | Dashboard, Monitoreo, Cliente |

## Objetivos de la suite

1. **Login** con cada rol (acceso rápido y manual).
2. **Navegación** por todo el sidebar según el rol.
3. **Llenado completo de TODOS los campos** de cada formulario/modal/wizard.
4. **Estado vacío / error / validación** de los formularios.
5. **Confirmación** de flujos (toast/confirm).
6. **Verificación visual** del patrón canónico (Dashboard) en los módulos
   rediseñados (Gestión de OT).

## Enfoque

- Cada módulo se prueba **en un nuevo slice** (archivos `tests/<modulo>.spec.ts`).
- Helpers reutilizables en `tests/helpers/` (login, navegación, llenado de campos
  genérico a partir de un esquema de campos).
- Datos de prueba: se usará `<base-url> --local` sobre la BD de dev `mafort_db` con
  `npm run dev`.
- Se prioriza el llenado con valores válidos y de borde por campo.

## Desglose de tareas

| # | Tarea | Especificación | Estado |
|---|---|---|---|
| 0 | Setup del runner | Configurar `playwright.config.ts`, helpers de login y navegación, utils de llenado de campos por esquema | pending |
| 1 | Login + Navegabilidad | Login para los 5 roles, verificación del sidebar esperado por rol, logoff | pending |
| 2 | Dashboard (admin + roles) | KPIs, charts (rangos trimestral/semestral), alertas de riesgo, copiloto IA, tab monitoreo | pending |
| 3 | Gestión de OT (Ventas) | Tabs lista/analytics/targets/comercial, filtros, KPIs, paginación, exportar CSV | pending |
| 4 | **OT — Crear OT Marco** | Llenar TODOS los campos: datos generales contrato, presupuesto general, selección de equipos, checkboxes KVA, drawer | pending |
| 5 | **OT — Agregar Línea** | Llenar TODOS los campos de cuota/línea | pending |
| 6 | **OT — Editar Línea** | Editar campos (acordeón Acuerdo Padre, factura, comercial, descripción), toggle | pending |
| 7 | **OT — Asignar Técnico** | Asignar técnico titular + apoyo, fecha, detectar conflictos, guardar asignación | pending |
| 8 | **OT — Programar Visita** | Wizard de pasos (stepper), selección de técnicos/equipos, programación, confirmar | pending |
| 9 | **OT — Bitácora** | Agregar comentario/avance, timeline | pending |
| 10 | Clientes y Contratos | Tab clientes y contratos, crear cliente, crear contrato, ampliación/adenda, picker equipos, drawer detalle equipos, asignar contrato | pending |
| 11 | Ventas | Módulo comercial: KPIs VentasView, emisión de OT, drawer equipos | pending |
| 12 | Técnico | Seleccionar OT, Wizard (10 pasos) llenando TODOS los campos del informe, o formulario clásico | pending |
| 13 | Supervisor | Tab resumen/previsualización, revisión de informe | pending |
| 14 | Cliente | Vista de cliente (informes, equipos, OTs) | pending |
| 15 | Usuarios (solo admin) | CRUD de usuarios, permisos/permisos | pending |
| 16 | Verificación visual | Screenshots grid + verificación de clases válidas (Tokens, sin hex crudos) | pending |
| 17 | Documentación final | Reporte de covertura de pruebas y resultados | pending |

## Criterios de aceptación

1. **Todo formulario de todos los módulos se abre en el navegador y se llenan todos
los campos** con datos de prueba** (verificables vía el valor `value/Selecci de los inputs).**
2. Recorrer todas las pestañas / sub-opciones de cada módulo accesible por rol.
3. Zero alert: sin crash de consola (`console.error`) durante la ejecución.
4. Los flujos de negocio (crear Marco → línea, asignar → programar, informe → aprobar) se
5. termine de punta a punta sin bloqueos de UI.
6. Cero errores al correr `npm test` (o `npx playwright test`).
7. Reporte HTML de ejecución generado con Playwright report.

## Riesgos

- El llenado de campos "no específicos de un esquema requiere que las escibas de los campos y selectores estén flexionidad por `data-testid`.
- Los modales usan `z-[*]` altos y la navegación puede requerir espera de animación.
- El alcance del sistema es amplio (~15 módulos, 15 modales, 1 wizard de 10 pasos), se prioriza por slices.
- Fecha actual del sistema es 2026; la BD dev (mafort_db) contiene datos recientes de prueba.

## Dependencias

- Servidor local corriendo: `npm run dev` (http://localhost:3000).
- BD local `GET` con datos seed de prueba.
- Playwright en devDependencies (ya instalado).