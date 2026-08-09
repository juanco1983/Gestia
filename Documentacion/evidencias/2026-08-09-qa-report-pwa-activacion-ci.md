# QA Report — Activación PWA en CI (dev/qa)

- **Fecha:** 2026-08-09
- **Rama:** `infra/pwa-ci-dev-qa`
- **PR:** hacia `dev`
- **Tipo de cambio:** Infra / CI / headers de servidor (sin cambios de lógica de negocio, UI ni schema Prisma)
- **Status:** **APPROVED**

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `.github/workflows/app-deploy.yml` | Output `pwa_flag` (1 dev/qa, 0 main) + `VITE_PWA_TECNICO` en Build Application |
| `server.ts` | `express.static(dist, { setHeaders })` con `Cache-Control: no-cache, no-store, must-revalidate` para `sw.js`, `registerSW.js`, `index.html`, `*.webmanifest` |
| `Documentacion/arquitectura_infraestructura_nube.md` | `arquitectura_infraestructura_nube.md` §4.1 (rename a `Guias y Estandares/`) |
| `Documentacion/planes/infra/2026-08-09-pwa-activacion-ci.md` | Plan de infra nuevo |

## Nivel de test aplicado

Cambio de infraestructura (CI + headers). No toca API, BD, UI ni flujos de negocio,
por lo que **no requiere E2E de navegador nuevo** (el E2E del módulo PWA offline ya
existe y pasa). Se aplicó:

- **Lint/typecheck:** `npm run lint` → EXIT 0
- **Build con flag:** `VITE_PWA_TECNICO=1 npm run build` → genera `dist/sw.js` (25 KB) + `dist/registerSW.js`; `index.html` referencia ambos ✓
- **Unit (regex setHeaders):** 7/7 casos PASS (sw.js/registerSW/index/manifest → no-cache; assets con hash → cacheables)
- **Integración real (servidor + headers HTTP):** arrancado `dist/server.cjs` con el build PWA y consultado HTTP:
  - `GET /sw.js` → **200**, `Content-Type: application/javascript`, `Cache-Control: no-store, must-revalidate, no-cache`
  - Contenido idéntico a `dist/sw.js` (25 151 bytes) — es el SW real de workbox, **no** el fallback SPA ✓
  - `GET /` → referencia `registerSW.js` ✓

## Resultados

| Check | Resultado |
|---|---|
| `npm run lint` | PASS |
| `npm run build` con flag genera sw.js + registerSW.js | PASS |
| `index.html` referencia registerSW.js | PASS |
| Regex no-cache 7 casos | PASS |
| `/sw.js` 200 application/javascript (no HTML fallback) | PASS |
| Headers no-cache reales | PASS |
| `/sw.js` idéntico a dist (SW real servido) | PASS |

**Fallos:** 0

## Cobertura

- **Cubierto:** generación del bundle PWA en build CI-equivalente, headers HTTP reales,
  ausencia de fallback HTML en `/sw.js`, lint.
- **No cubierto (post-merge):** verificación en el CloudFront real de dev/qa tras correr
  el workflow (depende del deploy; criterios de aceptación del plan marcan estos checks).

## Riesgos / dependencias

- Requiere ejecutar el workflow en `dev` (push o dispatch) para regenerar el bundle
  deployado. `main` sigue sin PWA (`pwa_flag=0`) hasta validación en dev/qa.
- Sin invalidación de CloudFront: los headers no-cache bastan porque el SW y el HTML
  ahora se sirven con no-store (no hay riesgo de SW stale caching).

## Verdict

**APPROVED** — listo para push → PR → QA del deploy en dev/qa.