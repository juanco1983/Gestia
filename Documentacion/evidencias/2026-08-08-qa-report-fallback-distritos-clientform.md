# QA Report — Fallback de Distritos en Formulario de Cliente (QA)

> **Fecha**: 2026-08-08
> **Rama**: `fix/distritos-fallback-qa-clientform`
> **Status**: ✅ **APPROVED**

---

## 1. Archivos afectados

- `src/components/ClientesContratosView.tsx` — se reemplazó el fallback roto
  (`DEFAULT_DISTRITOS.filter(...)`, constante inexistente `TS2304`) por
  `getFallbackDistritos(provQuery)` en el `useEffect` de distritos.
- `tests/distritos-fallback-clientform.spec.ts` — **nuevo** spec E2E de regresión.
- `Documentacion/pruebas_e2e/2026-08-08-fallback-distritos-clientform.md` — guion.

---

## 2. Causa raíz

En QA (AWS) la tabla `Distrito` está vacía → el endpoint `/api/ubigeo/distritos`
devuelve `[]`. El fallback frontend utilizaba `DEFAULT_DISTRITOS`, constante
eliminada en `ccfa2` (reemplazada por `PROVINCIA_DISTRITOS_MAP`), pero las 4
referencias restantes quedaron apuntando a la constante inexistente →
`undefined.filter()` → `TypeError` no capturado → dropdown de Distrito vacío.

Requiere para reproducción una BD sin filas en `Distrito` (caso QA); local y dev
la tienen poblada, por eso no se manifestó ahí.

---

## 3. Pruebas ejecutadas

| Tipo | Prueba | Resultado |
|:---|:---|:---|
| Compilación / lint | `npx tsc --noEmit -p tsconfig.json` | **EXIT 0** |
| E2E (Playwright) | `tests/distritos-fallback-clientform.spec.ts` (simula API `[]`) | **PASS** |
| Regresión E2E | `tests/full-browser-user-workflow.spec.ts` | **PASS** |
| Regresión E2E | `tests/cloud-s3-e2e-workflow.spec.ts` | **PASS** |

Ninguna prueba falló.

---

## 4. Cobertura

- **Cubierto**: dropdown de País → Provincia → Distrito en Registro de Cliente;
  comportamiento con API de distritos vacía (fallback); 0 errores de consola.
- **No cubierto**: edición de cliente existente (mismo `useEffect` con
  `editClientForm`); otras provincias distintas de Lima (el mapa
  `PROVINCIA_DISTRITOS_MAP` ya las cubre por sus entradas del catálogo).

---

## 5. Riesgos / dependencias

- El beneficio directo depende de que el build (Vite) se realice tras el merge a
  `dev` (el `server.ts` de producción sirve `dist/`).
- El entorno QA debe confirmar que al desplegar este fix, el dropdown de la
  provincia sin BD disponible se rellena con el mapa estático.

---

## 6. Decisión

✅ **APPROVED** — listo para commit → push → PR a `dev`.