# Plan Fix — El técnico puede editar un informe ya aprobado por el supervisor

**Fecha:** 2026-07-31
**Tipo:** Fix (bug)
**Módulo:** Técnico (`src/components/TecnicoView.tsx`) y Wizard (`src/components/WizardInforme.tsx`)
**Mockup:** [Documentacion/mockups/fix-tecnico-editar-informe-aprobado.html](../mockups/fix-tecnico-editar-informe-aprobado.html)

## Contexto

Cuando el supervisor aprueba un informe (`OTStatus.APROBADA`), el técnico aún
ve el botón "Crear / Editar Informe Técnico" en su panel de acción, y puede
abrir el editor para modificar el informe ya aprobado. No debería poder.

## Causa raíz

1. **Botón de edición incondicionado** — En `TecnicoView.tsx` el action card
   (líneas 2287-2406) encadena `if/else` solo para `PROGRAMADA`, `EN_CAMINO`,
   `EN_SITIO` y `TRABAJO_EN_EJECUCION`. Cualquier otro estado (incluidos
   `EN_REVISION`, `INFORME_ENVIADO`, `APROBADA`, `FIRMADA`, `FACTURADA`,
   `CERRADA`, `CORREGIDA`) cae en el `else` que muestra
   "Crear / Editar Informe Técnico" y ejecuta `setIsEditingReport(true)`.
2. **Envío sin validación de estado** — `handleWizardComplete`
   (TecnicoView.tsx:848) y `handleSubmitReport` (TecnicoView.tsx:~826) cambian
   el estado a `EN_REVISION` sin comprobar si la OT está en un estado no
   editable. El botón "Enviar Informe" del wizard (WizardInforme.tsx:1007)
   llama a `onComplete` sin restricciones.

## Alcance

**Incluido:**
1. Ocultar el botón de editar en el action card para estados no editables y
   mostrar una tarjeta de estado de bloqueo (ver mockup):
   - `EN_REVISION` / `INFORME_ENVIADO` → "Informe en Revisión" (amber).
   - `APROBADA` / `FIRMADA` / `FACTURADA` / `CERRADA` → "Informe Aprobado —
     no editable" (emerald).
   - `CORREGIDA` / estados restantes no editables → bloqueo genérico.
2. Mantener intacto el flujo de corrección de `OBSERVADA` ("Corregir Informe
   Técnico") y de creación en `INFORME_PENDIENTE`.
3. Defensa en profundidad: en `handleWizardComplete` y `handleSubmitReport`
   validar que la OT esté en estado editable; si no, notificar error y abortar
   sin cambiar estado.

**Excluido:**
- Cambios en la vista del supervisor.
- Cambios en permisos del backend.
- Refactor del action card.

## Ajuste aprobado por el usuario

El action card deja de usar `bg-slate-900` (negro) y pasa al verde de marca
`#0F9E82` (`teal-brand`), el color del sistema, con texto en blanco y
overlays `bg-white/10` para las tarjetas de bloqueo. Aplicado en el mockup.

## Criterios de aceptación

1. Con OT en `APROBADA`, el técnico NO ve el botón de editar: ve la tarjeta
   "Informe Aprobado — no editable".
2. Con OT en `EN_REVISION` o `INFORME_ENVIADO`, el técnico NO ve el botón de
   editar: ve la tarjeta "Informe en Revisión".
3. Con OT en `OBSERVADA`, el técnico SÍ ve "Corregir Informe Técnico" y puede
   reenviar (flujo intacto).
4. Con OT en `INFORME_PENDIENTE`, el técnico SÍ ve "Crear / Editar Informe".
5. Aunque el wizard estuviera abierto (caso extremo), reenviar con estado no
   editable aborta con notificación de error y no cambia el estado de la OT.
6. Sin `window.alert()`, sin emojis, sin hex crudos nuevos ni utilities
   Tailwind inválidas.

## Desglose de tareas

| Tarea | Estado |
|---|---|
| Diagnóstico y localización de causa raíz | completed |
| Mockup antes/después entregado | completed |
| Plan en `Documentacion/planes/fixes/` | completed |
| Mockup aprobado por el usuario (fondo verde Mafort) | completed |
| Crear rama `fix/tecnico-no-editar-informe-aprobado` | completed |
| Action card: bloquear edición para estados no editables + tarjetas de estado | completed |
| Guardas de estado en `handleWizardComplete` y `handleSubmitReport` | completed |
| Verificación (build + prueba manual del flujo aprobar→técnico) | completed |
| Commit + push | pending |

## Riesgos

- Cambiar la cadena de estados del action card podría afectar el flujo de
  estados intermedios si algún estado queda sin rama explícita → cubrir con
  un `else` de bloqueo genérico (nunca un botón de edición por defecto).
- El wizard guarda borradores automáticamente; bloquear el botón no elimina
  los borradores locales previos (no es el alcance).

## Dependencias

- `guia_ui_ux.md` (patrón de badges/tarjetas de estado).
- `ConfirmModal` / `ToastModal` ya usados en el módulo.
