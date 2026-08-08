# Plan de Corrección: Precarga de datos del equipo en el Informe Técnico (Wizard del Técnico)

## 📌 1. Contexto y Problema
Al registrar un contrato y asociar un equipo con sus características (modelo, número de
serie, marca, potencia, ubicación y especificaciones adicionales), al programar una visita
y generar el informe técnico el paso 6 **"Características del Equipo"** no mostraba esos
datos precargados: aparecían valores genéricos/inventados.

**Causa raíz (cadena de datos rota):**

1. `generateDefaultReport(ot, client)` en `src/utils/reportDefaults.ts` (líneas 255-292)
   construye el mapa `caracteristicas` con **datos ficticios** (`"APC Smart-UPS"`,
   `"MF-…-9880"`, `"EXM 3 Phase Series"`, etc.) y nunca consulta el equipo real.
2. `WizardInforme` inicializaba `caracteristicas = defaults.caracteristicas ?? {}`, por lo
   que el paso 6 siempre usaba esos valores inventados.
3. `TecnicoView` solo pasaba `equipoId` al wizard, **sin el objeto `Equipo`** con datos
   reales. Los `equipos` que recibía como prop se construían con
   `clients.flatMap(c => c.equipos)` (App.tsx:1691), pero `/api/clients` no incluye los
   equipos anidados; además el intento de carga local usaba `/api/clients/:id/equipos`
   (endpoint inexistente, 404 → HTML), de modo que `wizardEquipo` nunca se resolvía.

## 🎯 2. Criterios de Aceptación
- [x] El paso "Características del Equipo" del informe precarga el **modelo** y **nº de
      serie** registrados en el contrato (no los ficticios).
- [x] También precarga marca, tipo, potencia (KVA), ubicación, estado y las
      `especificaciones` adicionales registradas.
- [x] Al **editar** un informe ya guardado se conservan las características ya ingresadas
      (no se sobrescriben con el equipo).
- [x] No introduce `window.alert` ni rompe flujos existentes (regresión E2E + integración OK).

## 🔧 3. Desglose de Cambios

### Archivo: `src/components/WizardInforme.tsx`
- Nueva prop opcional `equipo?: Equipo` y helper `buildCaracteristicsFromEquipo(equipo, base)`
  que fusiona los datos reales del equipo (`CODIGO`, `TIPO`, `MARCA`, `MODELO`, `SERIE`,
  `POTENCIA`, `UBICACIÓN`, `ESTADO` + entradas de `especificaciones`) sobre la base por defecto.
- `caracteristicas` se inicializa únicamente desde el equipo cuando **no hay `initialReport`**
  (informe nuevo); si hay informe existente, se conserva su `caracteristicas` guardado.

### Archivo: `src/components/TecnicoView.tsx`
- Nuevo estado `wizardEquipo` + `useEffect` que resuelve el equipo real por id consultando
  `GET /api/equipos/:id` (endpoint existente), con fallback al prop `equipos`/`clientEquipos`.
- El `Equipo` resuelto se pasa al `<WizardInforme equipo={wizardEquipo} …>`.

## 🔒 4. Verificación (QA)
- [x] `npm run lint` (tsc --noEmit) limpio.
- [x] `npm run build` exitoso.
- [x] E2E Playwright de regresión `tests/wizard-precarga-caracteristicas.spec.ts` — PASS. Crea
      equipo con marca/modelo/serie/especificaciones vía API, vincularlo a una OT del técnico,
      abre wizard paso 6 y verifica que se muestran los valores reales. Video en `test-results/`.
- [x] Suite de integración + E2E técnico (`integration-suite`, `tecnico-ui-redesign`) — PASS.
- [x] QA Report generado (skill `qa-engineer`). Evidencia en `Documentacion/evidencias/`.

## 📎 Flujo E2E
Ver `Documentacion/pruebas_e2e/2026-08-07-precarga-equipo-informe-wizard.md`.