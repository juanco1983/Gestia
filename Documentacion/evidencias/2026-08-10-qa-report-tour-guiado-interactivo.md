# QA Report — Tour Guiado Interactivo (14 pasos)

> **Fecha**: 2026-08-10
> **Rama**: `feature/tour-guiado-interactivo`
> **Cambio**: Feature UI — guía interactiva (tour) con driver.js que recorre el
> proceso completo de negocio y termina con la facturación (N° factura + monto).

## Archivos afectados

- **Nuevos**: `src/tour/steps.ts`, `src/tour/useTour.ts`, `src/tour/TourGuide.tsx`,
  `src/tour/tour.css`, `tests/tour-guiado.spec.ts`,
  `Documentacion/ADR/ADR-002-tour-guiado-driverjs.md`,
  `Documentacion/pruebas_e2e/2026-08-10-tour-guiado-interactivo.md`.
- **Modificados**: `package.json` + `package-lock.json` (driver.js v1.8.0),
  `src/App.tsx` (integración tour + botón ayuda header + atajo Ctrl+Shift+H),
  y 9 componentes con anclaje `data-tour` (ClientesContratosView, OrdenesTrabajoView,
  TechMonitoringDashboard, TecnicoView, VentasView, ClienteView, UserManagementView,
  DashboardHeader, TablaOrdenesTrabajo).
- **Docs**: plan `Documentacion/planes/features/2026-08-09-tour-guiado-interactivo.md`,
  mockup `Documentacion/mockups/tour-guiado-interactivo.html`.

## Pruebas ejecutadas

### E2E Playwright (navegador real, `npx playwright test tests/tour-guiado.spec.ts`)
| Test | Resultado |
|---|---|
| Recorre los 14 pasos, termina en facturación y persiste el progreso | ✔ PASS |
| Auto-start no se repite tras marcar visto, y Ctrl+Shift+H lo relanza | ✔ PASS |
| Navegación por teclado: → avanza, ← retrocede, Esc salta | ✔ PASS |

Resultado: **3 passed**. Videos `.webm` generados en `test-results/` (config `video: 'on'`).

### Compilación / lint
- `npx tsc --noEmit` → **limpio** (0 errores).
- `npm run build` (vite + esbuild) → **éxito** en ~1min.

## Durante el desarrollo se corrieron 2 ciclos de fallo → fix
1. **Overlay huérfano / spotlight duplicado**: el consumo de `d.setSteps()` por cada
   paso reseteaba el puntero `__overlaySvg` sin remover el SVG del DOM → 2 overlays.
   **Fix**: dejar de reconstruir steps por paso; confiar en el fallback nativo de
   driver.js (elemento faltante → popover centrado). Afectó a los 3 tests.
2. **`_visto` se borraba tras reload**: el efecto de limpieza de caché global de
   `App.tsx` (línea ~116) borraba toda key `gestia_*` no incluida en la lista blanca,
   incluida `gestia_tour_progreso_visto` → el tour se auto-lanzaba de nuevo.
   **Fix**: añadir ambas keys del tour a la lista blanca.
3. **Botón "Terminar"**: llamaba `handlers.next()` (handlers sin `finish`). **Fix**:
   añadir `finish` a los handlers y cerrar con `d.destroy()`.

## Cobertura
- Recorrido completo de 14 pasos con verificación de título, banner de dependencia
  (⚠) en pasos 4/5/9/10, botones Atrás/Saltar y Terminar en el final.
- Persistencia: `gestia_tour_progreso.completed=true` tras terminar.
- No auto-reinicio tras recarga + relanzamiento por `Ctrl+Shift+H`.
- Teclado: →/←/Esc.
- NO cubierto (requiere flujo de datos completo): ejecución real de la facturación
  escrita en BD durante el tour E2E (el paso 13 solo guía el click a "Editar" y el
  modal se cubrió en el flujo completo `full-browser-user-workflow` previo).

## Riesgos / dependencias
- Anclaje por selectores `data-tour` = contrato débil con el markup; driver.js
  degrada a popover centrado si el elemento no existe.
- Dependencia nueva: `driver.js` v1.8.0 (MIT, 0 deps) → ADR-002.

## Status
**APPROVED** — todos los tests E2E pasan, lint limpio, evidencia en video generada y
guion persistido en `Documentacion/pruebas_e2e/`.