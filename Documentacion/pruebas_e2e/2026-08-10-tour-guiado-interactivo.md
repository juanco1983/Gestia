# Guion de Pruebas E2E: Tour Guiado Interactivo (14 pasos, termina en facturación)

> **Fecha**: 2026-08-10
> **Rama**: `feature/tour-guiado-interactivo`
> **Archivo de Prueba**: `tests/tour-guiado.spec.ts`
> **Librería**: `driver.js` v1.8.0 (ADR-002)

## 1. Contexto

El tour guiado recorre el proceso completo de negocio de Gestia en orden
lineal de 14 pasos, cruzando módulos según la dependencia real del flujo:

Cliente → Contrato → Equipo → Visita → OT → Asignar técnico → Bandeja →
Informe → Aprobación → Ventas → Portal Cliente → Administración → **Facturación
final (N° de factura + monto)**.

Implementación:
1. Motor `driver.js` con overlay + spotlight + tooltip (estilo Dashboard).
2. Estado del tour orquestado por React (`src/tour/useTour.ts`), navegación de
   módulo vía `onNavigate(module)` → `setCurrentRole` (sin router).
3. Pasos anclados con `data-tour="<slug>"` en componentes clave del flujo.
4. Fallback a popover centrado si el elemento destino no se encuentra.
5. Persistencia en `localStorage` (`gestia_tour_progreso`) + auto-start al
   primer login + botón ayuda en header + atajo `Ctrl+Shift+H`.

## 2. Criterios de Aceptación

- [ ] Tras login como Administrador, el tour se auto-inicia (overlay visible).
- [ ] El tour recorre los 14 pasos en orden; cada popover muestra su título y progreso "Paso X de 14".
- [ ] El paso final (14) muestra el banner de facturación y el botón "Terminar".
- [ ] Teclado: `→` avanza, `←` retrocede, `Esc` salta el tour.
- [ ] "Saltar tour" cierra el overlay y persiste el progreso.
- [ ] Al terminar, se marca `completed` en `gestia_tour_progreso` y no se auto-reinicia en el siguiente refresh.
- [ ] Cero errores de consola nuevos.

## 3. Pasos E2E

| # | Módulo | Acción | Criterio |
|---|---|---|---|
| 1 | UI | `login(page, 'Administrador')` | `#sidebar-panel` visible |
| 2 | UI | Esperar overlay del tour (`.driver-overlay`) tras ~600 ms | visible |
| 3 | UI | Popover paso 1: título "Bienvenido a Gestia" | visible |
| 4 | UI | Click "Siguiente" × 13 con verificación de título en pasos clave | popover cambia de título |
| 5 | UI | Paso 14: título "Paso 13 · Final: facturar el servicio" + botón "Terminar" | visible |
| 6 | UI | Click "Terminar" | overlay desaparece |
| 7 | UI | `page.evaluate` leer `gestia_tour_progreso` | `completed: true` |
| 8 | UI | Recargar página | el tour NO se auto-inicia (marcado visto) |
| 9 | UI | `Ctrl+Shift+H` | el tour se reinicia desde el paso 1 |

## 4. Evidencia

- Video `.webm` en `test-results/` (config `video: 'on'`).
- Trace + screenshots automáticos de Playwright.