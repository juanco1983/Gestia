# Plan + Spec Infra: Activar PWA (offline Técnico) en los ambientes dev y qa

> **Tipo:** Infra / CI-CD
> **Fecha:** 2026-08-09
> **Rama:** `infra/pwa-ci-dev-qa`
> **ADR:** `Documentacion/ADR/ADR-001-pwa-tecnico-offline.md`
> **Requerimiento:** el PWA del módulo Técnico (Service Worker + IndexedDB) ya está
> mergeado y desplegado en `dev`/`qa`, pero **el build de CI no lo activa**.

## 1. Contexto y Problema

El feature `feature/pwa-tecnico-offline` (PR #117) mergeó código frontend + SW a `dev`.
Sin embargo, en el ambiente desplegado el PWA **no funciona**:

- `.github/workflows/app-deploy.yml` corre `npm run build` **sin** `VITE_PWA_TECNICO`,
  por lo que `dist/` del deploy NO contiene `sw.js` ni `registerSW.js`.
- Verificación real en el CloudFront de dev (`https://d24240l09ia1ef.cloudfront.net/sw.js`):
  devuelve `200 text/html` = es el fallback SPA para rutas inexistentes, **no hay SW**.
- `index.html` desplegado no referencia `registerSW.js`.

Diagnóstico cerrado: **el flag de build no se está pasando en CI**.

## 2. Alcance

### Dentro
- Activar `VITE_PWA_TECNICO=1` en el paso "Build Application" del workflow para las
  ramas **`dev` y `qa`** (y cualquier rama no-`main`). `main` queda en `0` hasta
  validar en estos ambientes.
- Headers de servidor: servir `sw.js`, `registerSW.js`, `index.html` y `.webmanifest`
  con `Cache-Control: no-cache, no-store, must-revalidate` para que el navegador y
  CloudFront nunca sirvan un SW stale.
- Documentación: actualizar `arquitectura_infraestructura_nube.md` §4.1 y §3.4.

### Fuera
- Habilitar PWA en `main`/producción (requiere validación previa en dev/qa + decisión).
- Cambios al código del SW o de la capa offline (ya validados).

## 3. Cambios

| Archivo | Cambio |
|---|---|
| `.github/workflows/app-deploy.yml` | El paso "Determinar ambiente EB" emite `pwa_flag` (`1` salvo `main`); el paso `Build Application` pasa `VITE_PWA_TECNICO=${{ steps.env.outputs.pwa_flag }}` |
| `server.ts` | `express.static(distPath, { setHeaders })` aplica no-cache a `sw.js|registerSW.js|index.html|.webmanifest` |

## 4. Criterios de Aceptación

- [ ] `https://<cloudfront-dev>/sw.js` responde `200 application/javascript` (no HTML fallback).
- [ ] `https://<cloudfront-dev>/index.html` referencia `registerSW.js`.
- [ ] Headers `Cache-Control: no-cache, no-store, must-revalidate` en `sw.js` e `index.html`.
- [ ] `VITE_PWA_TECNICO` presente en el log del build CI (visible en Actions).
- [ ] `npm run lint` y `npm run build` (con flag) EXIT 0.

## 5. Desglose de Tareas

| # | Tarea | Archivos | Estado |
|---|---|---|---|
| 1 | Plan + rama nueva desde `dev` | este documento | completed |
| 2 | `pwa_flag` por rama en workflow + env en build | `.github/workflows/app-deploy.yml` | completed |
| 3 | Headers no-cache para SW/HTML en `server.ts` | `server.ts` | completed |
| 4 | Actualizar `arquitectura_infraestructura_nube.md` | doc | completed |
| 5 | Validar build local con flag (sw.js + registerSW.js) | `dist/` | completed |
| 6 | Commit + push + PR `infra/pwa-ci-dev-qa` → `dev` | — | pending |
| 7 | Ejecutar workflow en `dev`; verificar SW vía CloudFront | AWS | pending |
| 8 | QA gate (qa-engineer) | `Documentacion/evidencias/` | pending |

## 6. Verificación Manual (post deploy)

1. Abrir `https://<cloudfront-dev>/` en Chrome como Técnico.
2. DevTools → Application → Service Workers: debe aparecer `sw.js` activo.
3. Cache Storage: `gestia-pages`/assets precacheados.
4. IndexedDB `gestia_offline`: `ots` precargadas tras login.
5. `context.setOffline` ya cubierto por el E2E `tests/pwa-tecnico-offline.spec.ts`.