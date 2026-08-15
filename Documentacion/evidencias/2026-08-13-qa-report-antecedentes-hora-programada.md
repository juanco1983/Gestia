# QA Report — Hora programada y datos del equipo en Antecedentes del informe

- Fecha: 2026-08-13
- Autor: agente (Gate QA Engineer)
- Branch: `feature/inventario-equipos-historico` (cambio aplicado sobre ella; se separará su commit en rama fix/ si así se requiere antes del PR)

## Files affected

- `src/utils/reportDefaults.ts` — la hora de inicio prioriza `ot.horaProgramada`.
- `tests/helpers/auth.ts` — desactiva el tour de bienvenida en E2E (`gestia_tour_progreso_visto=1`) para eliminar flakiness.
- `tests/wizard-antecedentes-hora-programada.spec.ts` — spec E2E de regresión (nuevo).
- `Documentacion/pruebas_e2e/2026-08-13-antecedentes-hora-programada-informe.md` — guion (nuevo).
- `Documentacion/evidencias/2026-08-13-antecedentes-hora-programada-informe.webm` — video evidencia (nuevo).

## Tests executed

| Test | Nivel | Resultado |
|---|---|---|
| `wizard-antecedentes-hora-programada.spec.ts` | E2E (navegador) | **PASS (51.2s)** |
| `wizard-precarga-caracteristicas.spec.ts` (regresión) | E2E (navegador) | **PASS** |
| `inventario-equipos.spec.ts` (regresión, 6 escenarios) | E2E (navegador) | **PASS (6/6)** |
| `npm run lint` (`tsc --noEmit`) | Typecheck | **clean (exit 0)** |

Suite conjunta: **8 passed (3.8m)**.

## Tests failed

Ninguno. El fallo inicial del spec `wizard-precarga-caracteristicas.spec.ts`
era flakiness por el tour de bienvenida (navegaba al Dashboard y rompía el
click en la tarjeta), resuelto desactivando el tour en el helper `login()`.

## Coverage notes

- Cubierto: hora programada en paso 2, marca/modelo/serie y hora en texto de
  Antecedentes, flujo completo wizard para OT en ejecución.
- No cubierto en este run: OT recién iniciada vía "Iniciar Ruta" (el estampado
  `horaInicioServicio` de la hora de sistema en `App.tsx:819-822` sigue siendo
  el comportamiento esperado al iniciar la visita en el momento real de la ruta).
- La precarga de marca/modelo/serie ya estaba resuelta por el fix 2026-08-07;
  este cambio solo corrige la hora.

## Risks / dependencies

- Ningún cambio de esquema Prisma ni de API.
- La prioridad dada a `horaProgramada` es intencional: el contrato define la
  hora de visita; `horaInicioServicio` solo se setea al iniciar la visita
  (evento posterior en el flujo real).

## Status

**APPROVED**