# QA Report — Precarga de datos del equipo en el Informe Técnico (Wizard del Técnico)

**Fecha:** 2026-08-07
**Skill:** `qa-engineer`
**Status:** ✅ **APPROVED**

## Cambios
| Archivo | Cambio |
|---|---|
| `src/components/WizardInforme.tsx` | Nueva prop `equipo?: Equipo`, helper `buildCaracteristicasFromEquipo` (fusiona marca/modelo/serie/potencia/ubicación/estado/`especificaciones` sobre los defaults). Inicializa `caracteristicas` desde el equipo solo en informes nuevos; preserva lo guardado al editar. |
| `src/components/TecnicoView.tsx` | Estado `wizardEquipo` + `useEffect` que resuelve el equipo real vía `GET /api/equipos/:id` (fallback prop `equipos`/`clientEquipos`). Lo pasa a `<WizardInforme>`. |
| `tests/wizard-precarga-caracteristicas.spec.ts` | Test E2E de regresión. |
| `Documentacion/planes/fixes/2026-08-07-precarga-equipo-informe-tecnico-wizard.md` | Plan del fix. |
| `Documentacion/pruebas_e2e/2026-08-07-precarga-equipo-informe-wizard.md` | Flujo E2E documentado. |

## Tests ejecutados
| Test | Tipo | Resultado |
|---|---|---|
| `npm run lint` (`tsc --noEmit`) | Compilación | ✅ PASS |
| `npm run build` | Build prod | ✅ PASS |
| `tests/wizard-precarga-caracteristicas.spec.ts` | E2E navegador (regresión) | ✅ PASS (x2) |
| `tests/integration-suite.spec.ts` (3 casos) | Integración API/BD/Postgres | ✅ PASS |
| `tests/tecnico-ui-redesign.spec.ts` | E2E navegador (módulo técnico) | ✅ PASS |

## Cobertura
- **Sí cubierto:** precarga de `modelo`, `serie`, marca y especificaciones en el paso 6 del
  wizard; preservación de características al editar informe existente (por código); flujos de
  integración de visita/OT/sync.
- **No cubierto (aceptable):** validación visual en pantallas móviles (el wizard es desktop).
- **Preexistente (no bloqueante):** `console.error` por `GET /api/clients/:id/equipos` (404,
  ruta sin handler en `server.ts`). Se ignora en el spec; no fue introducido por este cambio.

## Causa raíz (documentada)
1. `generateDefaultReport` rellenaba `caracteristicas` con datos ficticios.
2. `WizardInforme` nunca recibía el `Equipo` real.
3. `TecnicoView` no podía resolver el equipo: prop `equipos` viene de
   `clients.flatMap(c => c.equipos)` (sin anidados) y la carga local apuntaba a
   `/api/clients/:id/equipos` (endpoint inexistente).

## Evidencia
- Video (`.webm`): `Documentacion/evidencias/2026-08-07-precarga-equipo-informe-wizard.webm`
- Video + trace + screenshots crudos: `test-results/`

## Riesgos / dependencias
- La resolución del equipo depende de `GET /api/equipos/:id` (existe y devuelve
  `especificaciones`). Si el equipo no existe (id huérfano), el wizard cae a defaults
  genéricos (comportamiento previo, sin crash).

## DoD
- [x] Compila · [x] Lint limpio · [x] E2E + integración PASS · [x] Sin errores críticos ·
  [x] Flujo E2E en `Documentacion/pruebas_e2e/` · [x] QA Report **APPROVED**
