# Guion de Pruebas E2E: Fallback de Distritos en Formulario de Cliente (QA)

> **Fecha**: 2026-08-08
> **Alcance**: Navegador Real (Playwright) + Simulación de BD sin distritos (QA AWS).
> **Archivo de Prueba**: `tests/distritos-fallback-clientform.spec.ts`
> **Rama**: `fix/distritos-fallback-qa-clientform`

---

## 1. Contexto del Bug

En el **módulo Comercial → Registrar Cliente** el dropdown de **Distrito** quedaba
vacío tras elegir País y Provincia en el entorno **QA (AWS)**.

**Causa raíz (doble):**

1. El entorno QA tenía la tabla `Distrito` desprovista de datos (el seed
   `ensureUbigeoData()` no la pobló), por lo que `/api/ubigeo/distritos?provinciaId=…`
   devolvía `[]`.
2. El fallback del frontend usaba `DEFAULT_DISTRITOS`, una constante que ya **no
   existía** (eliminada en `cc84af2` al introducir `PROVINCIA_DISTRITOS_MAP`).
   Al ejecutarse el fallback con `undefined.filter()` reventaba con un
   `TypeError` no capturado → el estado `distritos` quedaba en `[]` → dropdown
   vacío.

En **local y dev** no se manifestaba porque la BD sí tiene distritos y el fallback
roto nunca se ejecutaba.

---

## 2. Fix Aplicado

En `src/components/ClientesContratosView.tsx`, dentro del `useEffect` de carga de
distritos (endpoint `/api/ubigeo/distritos`), se reemplazó el fallback roto
(`DEFAULT_DISTRITOS.filter(...)`) por el helper existente
`getFallbackDistritos(provQuery)` que resuelve el mapa `PROVINCIA_DISTRITOS_MAP`
(con cobertura de todas las provincias y un genérico por nombre de provincia).

Resultado: aunque la BD devuelva `[]` (caso QA) o falle la request, el dropdown
se puebla de forma instantánea desde el mapa estático.

---

## 3. Matriz de Pasos E2E

| Paso | Módulo | Acción del Usuario | Criterio de Aceptación |
|:---|:---|:---|:---|
| 1 | Login | `Administrador` | Sidebar visible, sin errores de consola. |
| 2 | **Comercial** | Abrir módulo → `Registrar Cliente` | Modal "Registrar Nuevo Cliente" visible. |
| 3 | Red | Interceptar `/api/ubigeo/distritos` → `[]` | Simula BD de QA deshabitada. |
| 4 | Form | Seleccionar País y Provincia (Lima) | Provincia queda seleccionada. |
| 5 | Form | Esperar población del dropdown Distrito | Dorando se puebla vía **fallback** local aunque la API devuelva `[]`. |
| 6 | Form | Verificar opciones de Distrito | Incluye "Miraflores". |

---

## 4. Resultados

| Prueba | Resultado |
|:---|:---|
| `tests/distritos-fallback-clientform.spec.ts` | **PASS** (34.9s) |
| Regresión `tests/full-browser-user-workflow.spec.ts` | **PASS** |
| Regresión `tests/cloud-s3-e2e-workflow.spec.ts` | **PASS** |
| `npx tsc --noEmit -p tsconfig.json` (lint) | **EXIT 0** (limpio) |

---

## 5. Evidencia

- Videos `.webm` y trace en `test-results/` (config Playwright `video: 'on'`, `trace: 'on'`).
- QA Report: `Documentacion/evidencias/2026-08-08-qa-report-fallback-distritos-clientform.md`.