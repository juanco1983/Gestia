# Plan: OTs creadas desde dispositivo offline no se sincronizan a la BD de AWS

- Fecha: 2026-08-19
- Tipo: `fixes`
- Estado: COMPLETADO (fix + QA APPROVED el 2026-08-20; pendiente: PR a dev)
- Rama: `fix/estabilidad-guardado-bd`

## Contexto

Síntoma reportado por el usuario: una OT registrada desde una **tablet** se ve en
esa tablet, pero **no aparece en la PC** (mismo ambiente QA, misma cuenta).

Durante el diagnóstico se confirmó:

1. **La BD vive en AWS RDS** (`gestia_qa`), es la única fuente de verdad.
   El `docker-compose.yml` local (`localhost:5432/mafort_db`) es solo el entorno de
   desarrollo del operador y no participa en QA (ver
   `arquitectura_infraestructura_nube.md §9.1.1`).
2. **`handleAddOT` (src/App.tsx:769-788)**: si `POST /api/ots` falla, la OT se
   agrega **solo al estado React local** (`setOts(prev => [...prev, newOT])`).
   No se encola en IndexedDB ni en la cola de sync.
3. **`handleSyncOffline` (src/App.tsx:973-977) está DESACTIVADO**: retorna `true`
   sin enviar nada ("Sincronización offline desactivada por solicitud del usuario").
4. **`src/offline/sync.ts` (`flushQueue`) solo sincroniza `reports`**, nunca OTs.
   El store IndexedDB `ots` (src/offline/db.ts:78) es solo de lectura/precarga
   (preload.ts), no de escritura de nuevas OTs.
5. **Alcance PWA documentado**: ADR-001 y plan `2026-08-07-pwa-tecnico-offline.md`
   establecen que la escritura offline es **solo para el módulo Técnico** (informes
   técnicos), no para la creación de OTs.

Conclusión: la OT creada en la tablet quedó en la caché del navegador de ese
dispositivo (estado local + posible IndexedDB), nunca llegó a RDS, y por eso la PC
(que lee de la BD) no la muestra.

## Alcance

- Documentación corregida (ya aplicado):
  - `Documentacion/architecture_c4.md` — §1 estado offline y §5 decisión 4:
    IndexedDB real, sync desactivada, OTs offline no sincronizan.
  - `Documentacion/Guias y Estandares/arquitectura_infraestructura_nube.md` —
    §9.1.1 ubicación de BDs en AWS RDS.
- Fix de código (en curso): **estabilidad de guardado en toda la app**.

### Principio de diseño (confirmado por el usuario)

> **Todo módulo excepto Técnico funciona como una aplicación normal**: cada
> guardado es una operación hacia la BD (fuente de verdad). Si no hay conexión o
> el servidor rechaza la operación, **NO se "guarda" en silencio en el estado
> local**: se muestra un error claro y el dato queda solo en el formulario para
> reintentar. El único módulo con escritura offline es **Técnico** (informes,
> ADR-001): cola offline + sync.

### Handlers auditados en `src/App.tsx` (patrón de fallo silencioso)

| Handler | Líneas | Patrón actual | Acción |
|---|---|---|---|
| `handleAddOT` | 769-788 | POST falla → `setOts` local (fantasma) | **No setear en catch**; `notifyError` |
| `handleAddClient` | 712-733 | POST falla → setea cliente local + `throw "offline"` | Quitar `setClients` en catch; propagar error |
| `handleUpdateClient` | 735-755 | PUT falla → actualiza local + `throw "offline"` | Quitar set local en catch; propagar error |
| `handleAddContract` | 757-767 | `setContracts` optimista; fallo solo `warn` | `await` POST primero, luego set; error en catch |
| `handleUpdateOT` | 822-833 | set optimista; fallo solo `warn` | `await` PUT primero, luego set; error en catch |
| `handleUpdateOtStatus` | 859-881 | set optimista; fallo solo `warn` | `await` PUT primero, luego set; error en catch |
| `handleCreateVisita` | 925-941 | set optimista; fallo solo `warn` | `await` POST primero, luego set; error en catch |
| `handleUpdateVisita` | 943-971 | set optimista; fallo solo `warn` | `await` PUT primero, luego set; error en catch |
| `handleAddUser` | 979-989 | set optimista; fallo solo `warn` | `await` POST primero, luego set; error en catch |
| `handleUpdateUser` | 991-1006 | set optimista; fallo solo `warn` | `await` PUT primero, luego set; error en catch |
| `handleDeleteUser` | 1020-1041 | set optimista; fallo solo `warn` | `await` DELETE primero, luego quitar; error en catch |
| `handleAddLog` | 1008-1018 | set optimista; fallo solo `warn` | Error en catch (bitácora) |
| `handleAddOtLinea` | 1044-1054 | set optimista; fallo solo `warn` | `await` POST primero, luego set; error en catch |
| `handleUpdateOtLinea` | 1056-1094 | set optimista + recálculo saldo; fallo solo `warn` | `await` PUT primero, luego set; error en catch |
| `handleAddContratoComercial` | 1096-1117 | POST falla → setea local + `throw "offline"` | Quitar set local en catch; propagar error |
| `handleUpdateContratoComercial` | 1119-1140 | PUT falla → actualiza local + `throw "offline"` | Quitar set local en catch; propagar error |
| `handleUpdateTipoCambio` | 1142-1152 | set optimista; fallo solo `warn` | `await` POST primero, luego set; error en catch |

**Se conserva como está** (módulo Técnico, ADR-001): `handleAddReport` /
`handleSaveReportOffline` (colas IndexedDB) y `handleSyncOffline` (desactivado).

## Criterios de aceptación (del fix a implementar)

- [x] Si `POST`/`PUT`/`DELETE` a la BD falla (offline o error), el dato **NO** se
      agrega/actualiza en el estado local ni se muestra como persistido; se muestra
      un mensaje de error claro (patrón `<ToastModal>`) y el formulario permanece
      para reintentar.
- [x] La PC y la tablet muestran los mismos datos en todos los módulos (misma
      fuente: RDS). No puede existir un registro visible solo en un dispositivo
      (validado con E2E de no-fantasma + integración contra Postgres).
- [x] No regresión en el flujo online de creación (contrato marco, saldo, OT
      financiera, programación de visitas).
- [x] El módulo **Técnico** conserva su cola offline (informes) intacta.
- [x] `npm run lint` limpio.
- [x] `npm run build` exitoso.
- [x] QA gate: E2E + integración locales pasados; QA Report en `Documentacion/evidencias/`.

## Opciones de remediación (por decidir)

| Opción | Descripción | Pros | Contras |
|---|---|---|---|
| **A. Bloquear creación offline** ✅ ELEGIDA | En `handleAddOT`, si el POST falla, mostrar error claro y **NO guardar en estado local** | Fiel al ADR-001 (offline solo Técnico), cero riesgo de datos fantasmas, no requiere reactivar sync | El usuario debe reintentar cuando haya conexión |
| **B. Encolar OT para sync** | Extender `sync.ts` para encolar OTs (`ots` store + `flushQueue` enviando `ots`), y reactivar `handleSyncOffline` | Recupera datos; aprovecha `/api/sync` que ya acepta `ots` (server.ts:1464) | Amplía alcance offline más allá del ADR-001; reintroduce sync general (riesgo de auto-seeding) |
| **C. Recuperar la OT atrapada** | Script/endpoint de rescate que lea el IndexedDB de la tablet y la inserte en RDS | Recupera el dato existente sin esperar el fix | Manual, one-shot; contradice la decisión de que las OTs no son offline |

## Desglose de tareas

### completed

- [x] Reproducir/diagnosticar: causa raíz identificada (sync desactivada + OTs
      offline no encoladas).
- [x] Documentar hallazgo en `architecture_c4.md` y reforzar ubicación BD en
      `arquitectura_infraestructura_nube.md`.
- [x] Auditoría de handlers de guardado en `src/App.tsx`: el patrón de fallo
      silencioso aplica a TODOS los módulos (no solo OTs). Confirmado con el
      usuario: comportamiento de "aplicación normal" (error de conexión en el
      guardado) en todos los módulos excepto Técnico.

### inProgress

- [x] **Decisión: Opción A ampliada a toda la app** — Los módulos no-Técnico
      funcionan como app normal: sin guardado silencioso en estado local, error
      claro al fallar la escritura en BD, reintento por el usuario. El módulo
      Técnico conserva su cola offline (ADR-001).
      **Guardia anti auto-seeding:** no se reintroduce sync de OTs offline ni se envía
      estado del cliente (motivo original de desactivar sync en `34a8407`).
- [x] **Implementar fix de estabilidad de guardado** en `src/App.tsx` (16 handlers):
      `handleAddClient`, `handleUpdateClient`, `handleAddContract`, `handleAddOT`,
      `handleUpdateOT` (bifurca Técnico), `handleUpdateOtStatus` (bifurca Técnico),
      `handleAddUser`, `handleUpdateUser`, `handleDeleteUser`, `handleAddLog`,
      `handleAddOtLinea`, `handleUpdateOtLinea` (recálculo de saldo server-confirmed),
      `handleAddContratoComercial`, `handleUpdateContratoComercial`,
      `handleUpdateTipoCambio`. Patrón: `await` la escritura en BD → solo si `ok`
      actualizar estado con la respuesta del servidor; en `catch` propagar error
      (`"offline"` si `TypeError`, re-lanzar "Sesión expirada"). Se conservan
      intactos (Técnico, ADR-001): `handleAddReport`, `handleSaveReportOffline`,
      `handleSyncOffline`, `handleCreateVisita` (código muerto) y
      `handleUpdateVisita` (solo Técnico).
- [x] **Actualizar vistas consumidoras** para `await` + captura de error con
      `<ToastModal>`/`alertState`:
      - `VentasView`: `handleClientSubmit`, `handleContractSubmit`, `handleOtSubmit`
        (async, try/catch, `notifyError`, no cierran modal si falla).
      - `ClientesContratosView`: ramas `err.message === "offline"` convertidas de
        `type: 'offline'` (guardado en caché) a `type: 'error'` con mensaje claro de
        NO guardado; no cierran modal ni marcan editado en error.
      - `SupervisorView`/`ClienteView`: `handleApproveReport`, `handleDeclineReport`,
        `handleConfirmSignature` async + `await onUpdateOtStatus` + `notifyError`.
      - `ModalAsignarTecnico`: `await onUpdateOT` en ambos flujos.
      - `UserManagementView`: `handleCreateUser`, `handleToggleStatus`, `saveEdit`,
        `saveNewPassword`, delete de usuario: async + `await` + `notifyError` +
        `notifySuccess`.
      - `OrdenesTrabajoView`: `handleCancelLine`, `handleAddCommentSubmit` async +
        `await`; `onUpdateTipoCambio` con try/catch; wrapper de `ModalAsignarTecnico`
        async que espera el guardado antes de cerrar.
      - `ModalAgregarLinea`, `ModalEditarLinea`, `ModalCrearOtMarco`: async +
        `await onAddLinea`/`onUpdateLinea` + `notifyError`; se agregó `useLocalToast`
        donde no existía (`ModalEditarLinea`, `ModalCrearOtMarco`, `OrdenesTrabajoView`).
      - `TechMonitoringDashboard`: wrapper `onUpdateOT` async que espera el guardado
        antes de cerrar.
      - `TecnicoView` NO se tocó (módulo offline, ADR-001).

### pending

- [x] Pruebas E2E + integración locales (18/18 PASS; 1 regresión detectada y corregida: `pageerror: offline` al cortar red en el toggle de conectividad — call sites fire-and-forget de `handleAddLog` en login/logout/toggles ahora con `.catch(() => {})`).
- [x] QA Report + evidencia video `.webm` en `test-results/` y `Documentacion/evidencias/definitivas/2026-08-20-estabilidad-guardado-bd/`.
- [ ] PR a `dev` (rama `fix/estabilidad-guardado-bd`).

## Riesgos y dependencias

- No hay cambios de esquema Prisma ni de API necesarios.
- Al quitar los sets locales en `catch`, los handlers que hoy lanzan `"offline"`
  (clientes, contratos comerciales) siguen propagando error: las vistas que
  muestran `type: 'offline'` (`ClientesContratosView`) deben cambiar a
  `type: 'error'` (regla UI/UX: sin `window.alert`, usar `<ToastModal>`).
- Los handlers "optimistas" (visitas, OTs, users, líneas) cambian de optimista a
  **server-confirmed**: la UI espera la respuesta de la BD antes de actualizar el
  estado; si falla, se notifica y no hay cambio local.
- El registro atrapado en la tablet: queda únicamente en ese dispositivo; opción C
  (rescate) queda descartada salvo nueva decisión.
- Riesgo de regresión en recálculo de saldo (`handleUpdateOtLinea`): validar que el
  saldo se recalcule con los datos del servidor.