# Guion de Pruebas E2E: Antecedentes con datos reales y fotos vacías en Wizard Informe Técnico

> **Fecha**: 2026-08-09
> **Rama**: `fix/informe-antecedentes-datos-equipo-y-fotos`
> **Archivos de Prueba**: `tests/antecedentes-modelo-real-y-fotos-vacias.spec.ts`, `tests/wizard-precarga-caracteristicas.spec.ts`
> **Build**: requiere `npx vite build` antes (webServer Playwright sirve `dist/`).

## 1. Contexto

Dos bugs al generar el informe técnico:
1. Antecedentes mostraba MODELO/MARCA/SERIE ficticios (`"RT-X Dual Conversion"`,
   `"APC Smart-UPS"`) en vez de los reales del equipo vinculado.
2. El paso 7 (Fotografías) aparecía con imágenes SVG de prueba precargadas
   (`getTechnicalSvg`), sin que el técnico las tomara.

## 2. Criterios de Aceptación

- [x] El textarea de Antecedentes (paso 3) contiene el modelo/marca/serie reales.
- [x] No contiene los ficticios (`RT-X Dual Conversion`, `EXM 3 Phase Series`,
      `APC Smart-UPS`, `EMERSON LIEBERT`).
- [x] En el paso 7 no existen `<img src^="data:image/svg+xml">` precargadas.
- [x] Cero errores de consola no preexistentes.
- [x] Regresión: el paso 6 sigue precargando características reales del equipo.

## 3. Pasos E2E

| # | Módulo | Acción | Criterio |
|---|---|---|---|
| 1 | API | `POST /api/login` admin | token OK |
| 2 | API | `POST /api/equipos` con `MOD-ANT-<run>`, `MARCA-ANT`, `SN-ANT-<run>` | 200 |
| 3 | API | `POST /api/ots` vinculada al equipo | 200 |
| 4 | UI | `login(page, 'Tecnico')` | `#tecnico-portal-container` visible |
| 5 | UI | Click en la card de la OT | heading con otId visible |
| 6 | UI | Click "Llenar Informe" | wizard abierto |
| 7 | UI | "Siguiente" ×2 → paso 3 (Antecedentes) | `Sección 1 · Subpaso 3 de 3` visible |
| 8 | UI | Leer `textarea.inputValue()` | contiene `MOD-ANT-` y `MARCA-ANT` y `SN-ANT-`; NO contiene `RT-X Dual Conversion` etc. |
| 9 | UI | "Siguiente" ×4 → paso 7 (Fotografías) | `Sección 3 · Subpaso 2 de 3` visible |
| 10 | UI | `count('img[src^="data:image/svg+xml"]')` | === 0 |
| 11 | — | `consoleErrors` filtradas | 0 inesperados |

## 4. Resultados

| Prueba | Resultado |
|---|---|
| `tests/antecedentes-modelo-real-y-fotos-vacias.spec.ts` | **PASS** |
| `tests/wizard-precarga-caracteristicas.spec.ts` (regresión paso 6) | **PASS** |
| `tests/wizard-rediseno-secciones.spec.ts` | FAIL preexistente (panel removido en `7618afd`) |
| `npm run typecheck` | EXIT 0 |
| `npm run build` | EXIT 0 |

## 5. Evidencia

- Video + trace en `test-results/antecedentes-modelo-real-y-fotos-vacias-*/`.
- QA Report: `Documentacion/evidencias/2026-08-09-qa-report-antecedentes-modelo-real-y-fotos-vacias.md`.
