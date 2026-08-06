# Evidencias de Pruebas — Gestia IA

Carpeta central donde se depositan **todas las evidencias** de las pruebas del
sistema, en especial las **definitivas** que aprueban el merge a `dev`.

## Estructura

```
Documentacion/evidencias/
├── README.md
├── definitivas/                 # Evidencias que aprueban el subido a `dev`
│   └── <YYYY-MM-DD>-<slug>/     # Un subcarpeta por release/entrega
│       ├── 00-resumen-qa.md     # QA Report (ver skill qa-engineer)
│       ├── reporte-playwright.html
│       ├── screenshots/         # Capturas de los flujos críticos
│       └── runs/                # Outputs crudos de runners (API/integración)
└── (otros resultados intermedios, organizados al trabajar)
```

## Regla de oro

1. **Toda prueba ejecutada** debe dejar evidencia rastreable en esta carpeta.
2. Antes de autorizar el merge a `dev` (`Documentacion/pruebas_e2e/` + AGENTS.md),
   se deposita una evidencia **en `definitivas/`** con: QA Report, reporte/inm
   Playwright (HTML/screenshots), y salidas de runners de integración.
3. El QA Report sigue el skill `qa-engineer` (archivos afectados, pruebas
   ejecutadas/aprobadas/fallidas, cobertura, riesgos, status APPROVED/REJECTED).

## Convención de subcarpetas `definitivas/`

`<YYYY-MM-DD>-<slug>` › luego:

| Archivo | Contenido | Formato |
|---|---|---|
| `00-resumen-qa.md` | QA Report consolidado | Markdown |
| `reporte-playwright/` | HTML de `npx playwright test --last-run/` | HTML + assets |
| `screenshots/` | Capturas de flujos críticos de la entrega | PNG/WebM de |
| `runs/` | Logs/JSON de runners de integración (scratch/e2e-test-runner) | TXT/JSON/CLI |

## Cuándo es "definitiva"

Una evidencia es **definitiva** y válida para merge a `dev` cuando:

- Se ejecutó sobre la app real (`npm run dev` → `http://localhost:3000`) contra
  la BD Postgres (fuente de verdad), no contra `db.json` ni mocks.
- Pasaron los E2E de Playwright desde navegador (simulando usuario real).
- Pasaron las pruebas de integración (API/BD, sync offline, cascada de estados).
- `npm run lint` limpio (propios cambios).
- QA Report con status **APPROVED**.

## Qué NO es evidencia de dev

- Scripts de API sin corrida real.
- Corridas contra `db.json`/mock.
- Reportes producidos pero no adjuntados a esta carpeta.

---

Ver también: `Documentacion/planes/qa/`, `Documentacion/pruebas_e2e/`,
`skills/qa-engineer/SKILL.md`, y la sección **Pruebas E2E y de Integración
Obligatorias (antes de PR / Merge)** de `AGENTS.md`.