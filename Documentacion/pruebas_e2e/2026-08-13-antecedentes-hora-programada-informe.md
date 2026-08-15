# Flujo E2E: Antecedentes del informe con hora programada y datos del equipo

Fecha: 2026-08-13
Autor: agente (QA gate)
Relacionado: plan `Documentacion/planes/fixes/2026-08-13-hora-inicio-antecedentes-informe.md`
Spec: `tests/wizard-antecedentes-hora-programada.spec.ts`

## Contexto

Al generar el informe técnico desde el portal del Técnico, la sección
**Antecedentes** no mostraba la hora de inicio de la visita ni los datos del
equipo (marca/modelo/serie/ubicación) del contrato. La causa raíz: mientras
el wizard precargaba correctamente los datos del equipo (fix previo), la hora
de inicio usaba `ot.horaInicioServicio || "09:00"` y en las OTs programadas el
sistema estampaba la hora de sistema al marcarse la OT como "Trabajo en
Ejecución", pisando la hora programada de la visita del contrato.

## Cambio aplicado

`src/utils/reportDefaults.ts`: la hora de inicio ahora prioriza la
programada de la visita del contrato:

```ts
const horaInicio = ot.horaProgramada || ot.horaInicioServicio || "09:00"
horaInicio: ot.horaProgramada || ot.horaInicioServicio || "09:00",
```

Nota: `buildCaracteristicasFromEquipo` no requirió cambios — la precarga de
marca/modelo/serie ya funciona vía `clientEquipos` (fetch
`/api/clients/:id/equipos`). El fallo previo del bug original (marca/modelo
"NO REGISTRADO") fue resuelto en un fix anterior (2026-08-07).

## Trámite previo del entorno E2E

- El server sirve `dist/` estático si existe (`server.ts` ~2921); para probar
  cambios de fuente se debe ejecutar `npm run build`.
- El tour de bienvenida arranca a los 600 ms y navega al Dashboard, rompiendo
  clicks en el portal técnico ("element detached from DOM"). El helper
  `tests/helpers/auth.ts` ahora escribe `gestia_tour_progreso_visto=1` tras
  limpiar localStorage, evitando que el tour interfiera en los E2E.

## Guion ejecutado (navegador real — Playwright)

Precondiciones: server local en `http://localhost:3000` con Postgres local.

1. Auth por API (`/api/login` admin@mafort.pe) y crear equipo real
   (Vertiv / GXT5 / SN-ANTECED-0001 / 10 kVA / Sala de Servidores).
2. Crear OT `OT-ANTECED-*` en estado "Trabajo en Ejecución" vinculada al
   equipo, con `horaProgramada: "08:30"` y sin `horaInicioServicio`.
3. Login UI como Técnico (user_5 / Juan Córdova) y abrir la OT en el portal
   técnico.
4. Click en "Llenar Informe" → wizard.
5. Paso 2 (Datos de Cabecera): verificar `input[type="time"]` = `08:30`
   (hora programada, no hora de sistema).
6. Paso 3 (Antecedentes): verificar que el texto autogenerado contiene
   `Vertiv`, `GXT5`, `SN-ANTECED-0001` y `a las 08:30`.

## Verificaciones

| Escenario | Resultado |
|---|---|
| Hora inicio paso 2 = 08:30 (programada) | PASS |
| Antecedentes contienen marca/modelo/serie del equipo | PASS |
| Antecedentes contienen "a las 08:30" | PASS |

## Resultado

- `npx playwright test tests/wizard-antecedentes-hora-programada.spec.ts`
  → **1 passed (51.2s)**
- Suite regresión conjunta (precarga + inventario + antecedentes):
  → **8 passed (3.8m)**
- `npm run lint` (tsc --noEmit): limpio.
- Video evidencia: `Documentacion/evidencias/2026-08-13-antecedentes-hora-programada-informe.webm`.