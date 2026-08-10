# Fix: Extender wipe-operational-db para tablas legacy

- **Rama:** `fix/wipe-extension-legacy`
- **Fecha:** 2026-08-09
- **Tipo:** fix / mantenimiento admin

## Contexto
`POST /api/admin/wipe-operational-db` limpiaba las tablas operacionales principales
(reports, OTs, equipos, contratos nuevos, clientes, etc.) pero **no** las tablas
legacy/activas `Contract`, `Visita`, `TargetVenta`, `UserActivityLog`. El módulo
Contratos sirve `GET /api/contracts` desde `prisma.contract`, por lo que contratos
legacy quedaban visibles tras un "reiniciar limpio", interfiriendo con pruebas desde
cero.

## Cambio
`server.ts` — el endpoint ahora borra también, antes de `client.deleteMany()`, las
tablas `visita`, `contract`, `targetVenta`, `userActivityLog`, y las reporta en el
campo `summary` de la respuesta.

## Validación local (QA)
- `npm run lint` EXIT 0
- `npm run build` EXIT 0
- Server local + POST `/api/admin/wipe-operational-db` con token admin firmado:
  HTTP 200 con conteos (visitas 35, contractsLegacy 5, targetVentas 1, logs 72 sobre
  datos sembrados), y conteo post en 0 para todas las tablas operacionales+legacy,
  usuarios conservados (7).

## Criterios de aceptación
- [x] wipe borra Contract/Visita/TargetVenta/UserActivityLog
- [x] usuarios y catálogos (Pais/Distrito/TipoContrato) conservados
- [x] lint/build/validacion local OK
- [x] Desplegar a dev y qa y ejecutar wipe en ambos (2026-08-10, HTTP 200 en ambos;
  legacy + operacional en 0, usuarios conservados: dev 8, qa 7)
