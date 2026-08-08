# Flujo E2E: Rediseño del Wizard de Informe Técnico (4 secciones + fotos cámara/fototeca)

Fecha: 2026-08-07
Spec: `tests/wizard-rediseno-secciones.spec.ts`
Prioridad: **UI/UX — flujo del módulo técnico**

## Objetivo
Verificar que el wizard de informe técnico rediseñado (mockup aprobado) muestre:
1. Las **4 secciones** de navegación laterales en tema claro (patrón Dashboard,
   sin `bg-slate-900`): Datos del Servicio / Trabajo Realizado / Inspección
   Técnica / Diagnóstico y Envío, con breadcrumb "Sección N · Subpaso".
2. **Barra de progreso global** y **footer táctil** de 3 botones.
3. **Dos orígenes de fotos** (Tomar con cámara | Elegir de fototeca) tanto en la
   panorámica (paso 6) como en los slots (paso 7).
4. En el paso 10 (Revisión Final), el panel **"Estado del Informe · 4 secciones"**
   agrupado por las 4 secciones (checklist por sección + ítems ok/pendiente),
   eliminando la doble muestra de progreso del layout previo.

## Guion E2E (interacción real de usuario en navegador)

| # | Paso | Acción | Resultado esperado |
|---|---|---|---|
| 1 | Autenticación API | `POST /api/login` (admin@mafort.pe) | token JWT |
| 2 | Crear OT | `POST /api/ots` con `tecnicoTitular=Juan Córdova`, `estado=Trabajo en Ejecución` | OT creada |
| 3 | Login UI | Login como Técnico (`juan.cordova@materiagris.pe`) | Portal técnico visible |
| 4 | Abrir OT | Clic en la tarjeta de la OT | Ficha de OT visible |
| 5 | Iniciar informe | Clic en **"Llenar Informe Técnico"** | Wizard abierto |
| 6 | Verificar secciones | Ubicar textos `Datos del Servicio`, `Trabajo Realizado`, `Inspección Técnica`, `Diagnóstico y Envío` | Las 4 secciones visibles |
| 7 | Verificar breadcrumb | Texto `Sección 1 · Subpaso 1 de 3` | Visible |
| 8 | Verificar progreso + footer | `Progreso`, `Guardar borrador`, `Anterior`,`Siguiente` | Visibles |
| 9 | Avanzar a paso 6 | Clic **Siguiente** ×5 | Breadcrumb `Sección 3 · Subpaso 1 de 3` |
| 10 | Fotos panorámica | Ver botones `Tomar con cámara` y `Elegir de foto el` | Visibles (paso 6) |
| 11 | Ir a paso 7 | Clic **Siguiente** | `Tomar con cámara` y `Elegir de fototeca` visibles (paso 7) |
| 12 | Ir a paso 10 | Clic **Siguiente** ×3 | Heading `Revisión Final y Vista Previa PDF` visible |
| 13 | Verificar checklist agrupado | `Estado del Informe · 4 secciones` + `1 · Datos del Servicio`, `2 · Trabajo Realizado`, `3 · Inspección Técnica`, `4 · Diagnóstico y Envío`, `Diagnóstico + Reco.` | Los 4 grupos y sus ítems visibles |

## Assertions clave (en el spec)

- Las 4 secciones del sidebar se renderizan en el wizard.
- Breadcrumb de sección/subpaso presente.
- `Progreso` y los 3 botones del footer táctil están visibles.
- Botones de origen de foto (`Tomar con cámara`, `Elegir de fototeca`) visibles
  en ambos pasos (6 y 7).
- Checklist "Estado del Informe" del paso 10 agrupado en las 4 secciones con
  sus estados (frente a fotos pendientes muestra advertencia).
- Sin errores de consola inesperados (se ignora el 404 preexistente de
  `/api/clients/:id/equipos`).

## Comando de ejecución

```
npx playwright test tests/wizard-rediseno-secciones.spec.ts --reporter=list
```

## Resultado

**PASS** ✓ — wizard rediseñado muestra 4 secciones, shell claro, progreso,
breadcrumb, footer táctil, botones de foto cámara/fototeca y el checklist
"Estado del Informe" del paso 10 agrupado en las 4 secciones. Evidencia (video
`.webm` + trace + screenshot) en `test-results/`.

## Notas

- La precarga de características del equipo (fix previo) sigue cubierta por
  `tests/wizard-precarga-caracteristicas.spec.ts`, que navega ahora por
  "Siguiente" (la sección 3 colapsa hasta que arribas al paso 6).
- Sin `window.alert()` nuevo; se conserva el patrón de notificación existente.