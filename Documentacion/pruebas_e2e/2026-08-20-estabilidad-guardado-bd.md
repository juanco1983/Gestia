# Flujo E2E — Estabilidad de guardado en BD (fix OTs offline)

- Fecha: 2026-08-20
- Rama: `fix/estabilidad-guardado-bd`
- Spec Playwright: `tests/fix-estabilidad-guardado.spec.ts`
- Plan: `Documentacion/planes/fixes/2026-08-19-ot-offline-no-sincroniza.md`

## Contexto

Los handlers de guardado de los módulos no-Técnico usaban un patrón "optimista /
fallo silencioso": si el POST/PUT/DELETE a la BD fallaba, se actualizaba igual el
estado local (registro fantasma) y se advertía solo por consola. Esto permitía que
una OT creada desde una tablet sin conexión quedara visible solo en ese dispositivo
y jamás llegara a AWS RDS (fuente de verdad).

El fix cambia el comportamiento a **server-confirmed**: la UI espera la respuesta de
la BD antes de actualizar el estado; si falla, muestra un error claro (`<ToastModal>`)
y el formulario permanece abierto para reintentar. El módulo Técnico conserva su cola
offline (ADR-001).

## Escenarios E2E validados (desde navegador, Playwright)

### 1. POST fallido por red cortada no deja registro fantasma

1. Login como **Ventas** y navegar a **Comercial** (Directorio de Clientes).
2. Interceptar `POST /api/clients` con `route.abort()` (simula caída de red → `TypeError` → "offline").
3. Abrir **Registrar Cliente**, llenar razón social y RUC, enviar.
4. **Esperado:** el modal de formulario permanece abierto; aparece toast "Error de Conexión" indicando que el cliente **NO fue guardado**.
5. **Esperado:** el cliente NO aparece en el directorio (sin registro fantasma).
6. Cerrar toast y modal; cero errores de consola inesperados.

### 2. POST 500 (fallo de servidor/BD) tampoco deja registro fantasma

1. Login como **Ventas** y navegar a **Comercial**.
2. Interceptar `POST /api/clients` devolviendo `500` con `{ error: 'Error interno en la BD' }`.
3. Llenar y enviar el formulario de cliente.
4. **Esperado:** toast "Error de Registro" con el mensaje del servidor; modal abierto; cliente NO aparece en el directorio.

### 3. Regresión: módulo Técnico offline intacto (pwa-tecnico-offline.spec.ts)

1. Setup vía API: equipo + OT técnica en ejecución.
2. Login como **Técnico**; precarga offline verificada en IndexedDB (`ots` + `lastSyncAt`).
3. Abrir la OT y llenar el informe hasta el paso final; guardar borrador (IndexedDB `drafts`).
4. Cortar la red (`context.setOffline(true)`) + toggle UI a **Offline**.
5. Enviar informe → toast "Reporte Cacheado Localmente"; cola `reports_queue` ≥ 1 pendiente; chip de cola visible.
6. Reconectar → cola se sincroniza vía `/api/sync` (200) y pasa a "Sin cola".
7. **Esperado:** cero errores de consola inesperados (incluye validar que el toggle de conectividad no produce `pageerror` al cortar la red).

## Resultados (corrida definitiva 2026-08-20)

- `tests/fix-estabilidad-guardado.spec.ts` → **2/2 PASS**
- `tests/pwa-tecnico-offline.spec.ts` → **1/1 PASS**
- `tests/gestion-ot-tabs.spec.ts` → **3/3 PASS**
- Regresión e integración de módulos afectados → **17 PASS / 0 FAIL**

Evidencia: `Documentacion/evidencias/definitivas/2026-08-20-estabilidad-guardado-bd/`
(videos `.webm`, traces, screenshots y reporte HTML de Playwright).

## Comando de ejecución

```
npx playwright test tests/fix-estabilidad-guardado.spec.ts tests/pwa-tecnico-offline.spec.ts
```