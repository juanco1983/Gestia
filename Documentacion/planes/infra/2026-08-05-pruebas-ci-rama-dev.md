# Plan QA en CI — Pruebas automáticas en la rama `dev`

**Fecha:** 2026-08-05
**Tipo:** QA / Infraestructura (automatización de pruebas en CI/CD)
**Etapa del ciclo:** PLAN (documentación + diseño; runner NO construido aún)

## Contexto

Hoy la calidad se valida **solo en local** (Playwright E2E + integración) antes
del push a `dev`. El pipeline CI `app-deploy.yml` **no ejecuta ninguna prueba**:
solo `npm ci` → `prisma generate` → `build` → empaquetar → desplegar a El
Elastic Beanstalk.

**Consecuencia:** un cambio que rompa `/api/health`, el login, una migración
Prisma o la cascada de estados puede llegar a `dev` (rama permanente y estable)
sin ser detectado por la automatización.

## Objetivo

Definir y documentar la estrategia de **pruebas automatizadas en CI para la rama
`dev`**, sin construir todavía los runners (se implementará en una fase
`BUILD` posterior si el usuario lo aprueba).

## Brecha detectada

| Etapa | Dónde se prueba hoy | Necesidad en `dev` |
|---|---|---|
| Pre-PR a `dev` | Local: Playwright E2E + `scratch/e2e-test-runner.ts` (BD local `mafort_db`) | Ya cubierto (manual) |
| Después del deploy a `dev` | **Nada** | Smoke post-deploy: `/api/health` + login + un endpoint representativo |
| En la BD de `dev` real | — | Smoke de solo-lectura (no escribir en la BD de trabajo) |

## Estrategia propuesta (2 jobs mínimos en CI)

### Job A — Tests en CI (bloquea deploy)

- Trigger: antes del deploy a `dev` (mismo `push` de `app-deploy.yml`).
- Pasos: `npm ci` → `prisma generate` → `npm run lint` → correr Playwright E2E
  + integración (`scratch/e2e-test-runner.ts`) contra una **BD Postgres de CI
  separada** (nueva, sembrada con seed), **no** la BD de `dev` real.
- Gate: si falla alguna prueba, **se bloquea el deploy** a `dev`.

### Job B — Smoke post-deploy

- Trigger: después del deploy a `dev` (o al cierre del job A).
- Pasos: golpear `gestia-backend-dev` → verificar `/api/health` == healthy,
  login con un usuario de prueba, y un GET representativo.
- Naturaleza: **solo lectura** — no debe escribir en la BD de `dev` real.

## Criterios de aceptación

1. `dev` queda protegido: ningún merge/deploy si falla el smoke o los tests CI.
2. El smoke post-deploy se ejecuta automáticamente tras cada deploy a `dev`.
3. Las pruebas CI usan una BD aislada (no la de `dev`/trabajo).
4. La evidencia del correr CI se deposita en `Documentacion/evidencias/`. (en
   `definitivas/` antes del merge a `dev`).
5. Documentación actualizada: `arquitectura_infraestructura_nube.md` sección CI/CD.

## Tareas (desglose)

| # | Tarea | Estado |
|---|---|---|
| 1 | Documentar la estrategia (este plan + doc infra) | inProgress |
| 2 | Definir BD de CI separada y script de seed | pending |
| 3 | Crear job CI "Smoke/test" (`app-deploy.yml` o nuevo workflow) | pending |
| 4 | Crear job CI "Smoke post-deploy" (health + login) | pending |
| 5 | Correr ejecución local simulada y verificar gate | pending |
| 6 | Actualizar `arquitectura_infraestructura_nube.md` con el flujo final | pending |

## Dependencias

- GitHub Actions con permisos para golpear `gestia-backend-dev` (URL publica / credenciales).
- BD Postgres dedicada para CI (o usar un esquema/db dentro de la misma instancia dev, sin tocar datos de trabajo).
- `@playwright/test` ya disponible en devDependencies.

## Riesgos / decisiones abiertas

- **No correr E2E escribiendo contra la BD de `dev` real**: usar BD de CI separada.
- Necesidad de secretos CI para login del smoke test. (evitar credenciales en código).
- Postgres sigue siendo única fuente de verdad: el seed de CI se deriva de los
  mismos `INITIAL_USERS`/Prisma que producción.