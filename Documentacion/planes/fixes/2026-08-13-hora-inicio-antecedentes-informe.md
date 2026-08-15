# Plan: Hora programada y datos del equipo en Antecedentes del informe

- Fecha: 2026-08-13
- Tipo: `fixes`
- Estado: COMPLETED
- QA Report: `Documentacion/evidencias/2026-08-13-qa-report-antecedentes-hora-programada.md`

## Contexto

En el portal del Técnico, al generar el informe técnico (wizard), la sección
**Antecedentes** no mostraba la hora de inicio de la visita ni los datos del
equipo. Mientras la precarga de marca/modelo/serie ya funcionaba (fix
2026-08-07 vía `clientEquipos`), la **hora de inicio** seguía incorrecta:
el código usaba `ot.horaInicioServicio || "09:00"` y, en OTs programadas, el
sistema estampa la hora actual del dispositivo al pasar la OT a "Trabajo en
Ejecución" al abrirla, pisando la hora programada de la visita del contrato.

## Alcance

- `src/utils/reportDefaults.ts` (función `buildCaracteristicasFromEquipo` y
  retorno de cabecera): la hora de inicio debe priorizar la **hora programada
  de la visita** del contrato.
- Test de regresión E2E que valide hora + marca/modelo/serie en Antecedentes.
- Helper de tests E2E: desactivar el tour de bienvenida para evitar flakiness.

## Criterios de aceptación

- [x] En el paso 2 del wizard, la hora inicio precargada = `ot.horaProgramada`
      (ej. 08:30), no la hora del sistema.
- [x] El texto de Antecedentes contiene marca/modelo/serie del equipo y la
      hora programada ("a las 08:30").
- [x] No hay regresión en precarga de características (spec previo) ni en
      inventario de equipos.
- [x] `npm run lint` limpio.
- [x] Evidencia E2E (video `.webm`) guardada.

## Desglose de tareas

### completed

- [x] Reproducir el bug en navegador real (spec temporal `repro-antecedentes`).
- [x] Aplicar fix en `reportDefaults.ts` (`horaProgramada || horaInicioServicio || "09:00"`).
- [x] `npm run build` y verificar repro → PASS.
- [x] Convertir repro en spec de regresión `wizard-antecedentes-hora-programada.spec.ts`.
- [x] Desactivar tour de bienvenida en `tests/helpers/auth.ts`.
- [x] Suite conjunta (8 specs) → 8 passed.
- [x] Limpieza de datos de debug y residuos (`dbg_*`, `OT-ANTECED-*`, `OT-REGRES-*`).
- [x] Documentar guion E2E y QA Report; copiar video evidencia.

## Riesgos y dependencias

- Ningún cambio de esquema Prisma ni de API.
- El estampado de `horaInicioServicio` al iniciar ruta (`App.tsx:819-822`)
  permanece: es el comportamiento correcto al iniciar la visita real.
- Entorno de tests: el server sirve `dist/` estático; cambios de fuente
  requieren `npm run build`.