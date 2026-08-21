# QA Report — Estabilidad de guardado en BD (fix OTs offline no sincronizan)

- **Fecha:** 2026-08-20
- **Rama:** `fix/estabilidad-guardado-bd`
- **PR:** hacia `dev`
- **Tipo de cambio:** Fix de comportamiento en handlers de guardado (server-confirmed) en todos los módulos excepto Técnico. Sin cambios de schema Prisma ni de API.
- **Status:** **APPROVED**

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | 16 handlers de guardado pasan de "optimista / fallo silencioso" a **server-confirmed**: `handleAddClient`, `handleUpdateClient`, `handleAddContract`, `handleAddOT`, `handleUpdateOT`, `handleUpdateOtStatus`, `handleAddUser`, `handleUpdateUser`, `handleDeleteUser`, `handleAddLog`, `handleAddOtLinea`, `handleUpdateOtLinea`, `handleAddContratoComercial`, `handleUpdateContratoComercial`, `handleUpdateTipoCambio`. Técnico conserva su bifurcación offline (ADR-001). Fix adicional: call sites fire-and-forget de `handleAddLog` (login, logout, toggles Conectado/Offline) con `.catch(() => {})` para evitar rejection sin manejar al cortar la red. |
| `src/components/VentasView.tsx`, `ClientesContratosView.tsx`, `SupervisorView.tsx`, `ClienteView.tsx`, `UserManagementView.tsx`, `OrdenesTrabajoView.tsx`, `TechMonitoringDashboard.tsx`, `ModalAsignarTecnico.tsx`, `ModalAgregarLinea.tsx`, `ModalEditarLinea.tsx`, `ModalCrearOtMarco.tsx` | Consumidores actualizados a `await` + captura de error con `<ToastModal>`/`alertState`; ya no cierran modal ni marcan editado en fallo; ramas `type: 'offline'` migradas a `type: 'error'`. |
| `tests/fix-estabilidad-guardado.spec.ts` | Spec E2E nuevo: POST fallido (abort) y POST 500 NO dejan registro fantasma y muestran error claro. |
| `.gitignore` | Excluye `test-results/` y `playwright-report/` (artefactos accidentalmente commiteados en `46aa5bf`; se limpian en este PR). |
| `Documentacion/architecture_c4.md`, `Documentacion/Guias y Estandares/arquitectura_infraestructura_nube.md` | Documentación del estado offline y ubicación de BDs en AWS RDS. |
| `Documentacion/planes/fixes/2026-08-19-ot-offline-no-sincroniza.md` | Plan del fix actualizado. |

## Nivel de test aplicado

Cambio de UI + handlers (frontend/flujos). Se aplicó:

- **Lint/typecheck:** `npm run lint` → EXIT 0
- **Build:** `npm run build` → EXIT 0
- **E2E desde navegador (Playwright, `video: 'on'`):** spec nuevo del fix + regresión de módulos afectados + módulo Técnico offline intacto.
- **Integración (API/BD Postgres):** suite de integración y ciclo de vida completo.

## Resultados

### E2E nuevos (fix-estabilidad-guardado.spec.ts)

| Test | Resultado |
|---|---|
| Crear cliente con POST fallido (red cortada) NO deja registro fantasma y muestra error | PASS |
| Crear cliente con POST 500 tampoco deja registro fantasma | PASS |

### Regresión E2E (módulos afectados)

| Test | Resultado |
|---|---|
| gestion-ot-tabs (3 pestañas KPIs sin errores de consola) | PASS (3/3) |
| ot-botones-creacion-deshabilitados | PASS |
| limpieza-observaciones-al-aprobar | PASS |
| supervisor-visor-fotos | PASS |
| full-browser-user-workflow (cliente → contrato → equipo → OT → informe → aprobación → monto/factura) | PASS |
| visitas-workflow (integración CRUD + E2E técnico de campo) | PASS (2/2) |
| tecnico-ui-redesign (clics reales módulo Técnico) | PASS |
| pwa-tecnico-offline (borrador + reporte offline → IndexedDB → sync al reconectar) | PASS |

### Integración (API/BD Postgres)

| Test | Resultado |
|---|---|
| integration-suite (CRUD visita + correlativo VIS-YYYY-NNNN, cascada de estados logísticos en Postgres, sync masivo offline `/api/sync`) | PASS (3/3) |
| full-lifecycle-integration (cliente → equipo → visita → OT → logística → informe) | PASS |
| full-visita-integration-flow (programación → ejecución → completado) | PASS |

**Fallos:** 0. Se detectó y corrigió 1 regresión durante el gate:
`pageerror: offline` (rejection sin manejar) al hacer clic en el toggle Offline de
conectividad con la red cortada — el fix hizo que `handleAddLog` propagara el error
y los call sites fire-and-forget (login, logout, toggles) no lo capturaban. Corregido
con `.catch(() => {})` en los 4 call sites y verificado con el spec PWA (0 errores de
consola).

## Evidencia

- `Documentacion/evidencias/definitivas/2026-08-20-estabilidad-guardado-bd/reporte-playwright/` (HTML de la corrida definitiva)
- `Documentacion/evidencias/definitivas/2026-08-20-estabilidad-guardado-bd/screenshots/` (videos `.webm` + traces + screenshots de los specs: fix-estabilidad-guardado, pwa-tecnico-offline, gestion-ot-tabs)
- `Documentacion/pruebas_e2e/` (flujo E2E documentado, ver plan)

## Cobertura

- **Cubierto:** fallo silencioso eliminado en módulos no-Técnico (clientes, contratos, OTs, usuarios, líneas, tipo de cambio); sin registros fantasma en error/offline; error claro `<ToastModal>`; módulo Técnico offline (ADR-001) intacto; sync masivo `/api/sync` sin regresión; cascada de estados y correlativos intactos.
- **No cubierto:** validación visual en tablet real (se simuló offline en navegador); opción C (rescate del registro atrapado en la tablet) descartada por decisión — el registro queda únicamente en ese dispositivo.

## Riesgos / dependencias

- El registro atrapado en la tablet del usuario NO migra a RDS (decisión documentada en el plan). No requiere migración Prisma ni cambios de API.
- Sin reintroducción de sync de OTs offline (guardia anti auto-seeding).

## Verdict

**APPROVED** — listo para commit → push → PR a `dev`.