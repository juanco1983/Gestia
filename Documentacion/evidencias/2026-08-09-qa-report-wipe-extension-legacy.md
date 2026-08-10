# QA Report — Extensión de wipe-operacional a tablas legacy

- **Fecha:** 2026-08-09
- **Rama:** `fix/wipe-extension-legacy`
- **Tipo de cambio:** API admin (mantenimiento) — sin UI ni schema
- **Status:** **APPROVED**

## Archivos afectados
- `server.ts` (endpoint `POST /api/admin/wipe-operational-db`)

## Pruebas ejecutadas
- **Lint/typecheck:** `npm run lint` EXIT 0
- **Build:** EXIT 0
- **Integracion (local real):** server local con build nuevo, POST al endpoint con
  token admin firmado -> HTTP 200. Resumen reporta:
  - visitas: 35, contractsLegacy: 5, targetVentas: 1, userActivityLogs: 72
  - technicalReports: 5, ots: 22, equipos: 19, contratoNuevo: 2, clients: 5
- **Verificacion post (conteo BD local):** todas las tablas operacionales+legacy en 0,
  usuarios conservados (7).

## Resultado
| Check | Resultado |
|---|---|
| Lint + build | PASS |
| Endpoint borra legacy tables | PASS |
| Usuarios y catalogos conservados | PASS |
| Sin errores 500 | PASS |

**Fallos:** 0

## Cobertura
Cubierta la integracion local del endpoint extendido. La verificacion en los
ambientes dev y qa se hara tras el deploy (criterios del plan).

## Verificacion en ambientes (2026-08-10)
Wipe ejecutado via `POST /api/admin/wipe-operational-db` con token admin firmado
en `dev` (d24240l09ia1ef.cloudfront.net) y `qa` (dxw5j68fci6ic.cloudfront.net).
| Entorno | Pre | Wipe HTTP | Post |
|---|---|---|---|
| dev | 8u/18cli/3legacy/54OT/2rep/79logs | 200 | 0 operacional+legacy; 8u |
| qa | 7u/3cli/0legacy/2OT/2rep/60logs | 200 | 0 operacional+legacy; 7u |

El summary de ambos responde `contractsLegacy`, confirmando el deploy del codigo
extendido en los dos ambientes. Criterio del plan cerrado.

## Verdict
APPROVED — listo para commit, push, PR a dev y promocion a qa.
