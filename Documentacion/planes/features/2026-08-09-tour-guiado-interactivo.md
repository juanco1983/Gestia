# Plan + Spec: Guía interactiva (tour guiado) del sistema Gestia

> **Tipo:** Feature / UX
> **Fecha:** 2026-08-09
> **Rama (build):** `feature/tour-guiado-interactivo`
> **Librería:** `driver.js` v1.8.0 (ver `Documentacion/ADR/ADR-002-tour-guiado-driverjs.md`)
> **Sistema de diseño:** `Documentacion/Guias y Estandares/guia_ui_ux.md` (Dashboard = referencia)

## 1. Objetivo
Un **tour guiado interactivo lineal único** que recorre **todo el proceso de
negocio de Gestia en orden**, cruzando módulos según la dependencia real del flujo:
Cliente → Contrato → Programar Visita → Crear OT → Asignar técnico → Informe
técnico → Aprobación del supervisor (y portales + admin al final). El usuario es
guiado paso a paso con overlay + spotlight + tooltip; los pasos que requieren una
acción previa advierten la dependencia (p.ej. "antes de crear una OT en Gestión de
OT, programa la visita en Operaciones").

## 2. Recorrido lineal del tour (orden del proceso)
| # | Módulo | Elemento / paso |
|---|---|---|
| 1 | Dashboard | Bienvenida · header card · centro de comando |
| 2 | Comercial | Crear cliente (botón "Registrar Cliente") |
| 3 | Comercial | Crear contrato asociado al cliente |
| 4 | Comercial | Asignar/crear equipo al contrato (botón "Asignar Equipo" → `EquipoPickerModal`) |
| 5 | Operaciones | Programar visita (dependencia previa a la OT) |
| 6 | Gestión de OT | Crear OT — **aviso: se genera automáticamente desde la visita** |
| 7 | Operaciones | Asignar técnico a la visita/OT |
| 8 | Técnicos | Bandeja de OTs asignadas · tomar OT |
| 9 | Técnicos | Crear/editar informe técnico (requiere equipo del contrato) · modo offline (opcional) |
| 10 | Supervisión | Bandeja de aprobación · aprobar/rechazar informe |
| 11 | Ventas | Portal de Ventas (targets, ranking) |
| 12 | Cliente | Portal del Cliente (auto-servicio) |
| 13 | Administración | Usuarios y roles · crear/editar usuario |
| 14 | Gestión de OT | **Facturación final — N° de factura + monto del servicio** (cierre del ciclo) |

> El tour es **lineal de 14 pasos** y refleja el proceso real de Gestia: el equipo
> se crea/asocia **dentro del contrato** en Comercial (no es un módulo separado), y
> el informe técnico necesita ese equipo (`TechnicalReport.equipoId` obligatorio).
> Los pasos 5 y 6 contienen avisos de **dependencia** (visita previa a la OT). El
> paso 9 recuerda que el informe usa el equipo del contrato, y el paso 10 es el
> gate de aprobación: solo informes aprobados liberan la facturación.
>
> **El flujo termina con la facturación**: el paso final (14) guía al usuario a
> pulsar "Editar" sobre la cuota de la OT y registrar el **N° de Factura, la Fecha
> de Emisión y el sub importe (monto del servicio)**. Al guardar, el estado pasa
> automáticamente a `FACTURADO` y la línea queda bloqueada (cierre del ciclo).

## 3. UX del Tour (patrón canónico)
- **Overlay oscurecedor** semi-transparente sobre la app.
- **Spotlight** (recorte) que encuadra el elemento destacado con borde teal-brand y
  padding; el resto de la página sigue interactivo solo en el spotlight (opcional).
- **Tooltip card** anclado al elemento (top/bottom según espacio), estilo Dashboard:
  `bg-white rounded-2xl border border-slate-100 shadow-lg p-5 max-w-sm`.
  - **Título** (`font-display`, `text-slate-900`), **paso** `X de N` (badge mono),
    **descripción** (`text-slate-600`), ilustración/icono `lucide`.
  - **Footer**: botones `Atrás` (secondary), `Siguiente` (primary teal-brand),
    `Saltar tour` (ghost). Barra de progreso (teal-brand).
- **Navegación por teclado**: Esc = salir, ←/→ = atrás/siguiente, Tab foco trap dentro
  del tooltip (WCAG AA).
- **Persistencia**: `localStorage['gestia_tour_visto_<modulo>']` para no repetir auto;
  botón "Reiniciar tour" en header (icono `?`/`GraduationCap`).
- **Sin `window.alert`** — todo vía toast/tooltip del tour (regla AGENTS.md §5).
- **Sin emojis en UI** (regla AGENTS.md UI/UX #2).

## 4. Estado de pantallas del mockup
1. **Bienvenida** — modal "Empezar tour" (único, lineal) sobre el Dashboard con overlay.
2. **Paso 3 · Comercial** — spotlight sobre "Asignar Equipo" + tooltip aviso dependencia ("requisito para generar el informe técnico").
3. **Paso 4 · Operaciones** — spotlight sobre "Programar visita" + tooltip aviso dependencia ("la visita alimenta la OT automáticamente").
4. **Paso 5 · Gestión de OT** — spotlight sobre el header de OT + **aviso dependencia:** "la OT se genera automáticamente desde la visita programada".
5. **Paso 14 · Facturación final** — spotlight sobre el botón "Editar" de la línea de OT + tooltip final: "N° de Factura, Fecha de Emisión y sub importe (monto del servicio) → estado FACTURADO".
6. **Centro de ayuda** — botón en header (icono ayuda) + drawer con el progreso lineal del tour (vistos/pendientes) + "Reiniciar tour" + "Continuar donde lo dejé".
7. **Estado final** — toast/modal "Tour del proceso completo" + CTA "Empezar a usar Gestia".

## 5. Criterios de aceptación
- [x] Mockup HTML v1 aprobado (gate de BUILD). Pendiente mockup v2 con el paso 14 de facturación.
- [x] Tour lineal único que recorre el proceso completo en orden (14 pasos).
- [x] Los pasos de dependencia muestran el aviso visita → OT (banner `dependencia`).
- [x] Tour funciona con teclado (Esc, flechas).
- [x] Overlay + spotlight correctamente posicionados (smoothScroll + auto refresh).
- [x] Persistencia del progreso en localStorage (`gestia_tour_progreso` + `_visto`); "Reiniciar" y "Continuar" funcionan.
- [x] Activación: onboarding al primer login + disparador manual (botón ayuda header) + atajo `Ctrl+Shift+H`.
- [x] Sigue tokens de `guia_ui_ux.md` (sin hex crudos, sin `alert`, sin emojis).
- [ ] E2E Playwright: recorre el tour completo de 14 pasos sin errores y avisa dependencia en pasos 4/5.

## 6. Desglose de tareas (BUILD)
1. [x] Instalar `driver.js` v1.8.0 y crear `<TourGuide>` (overlay + spotlight + tooltip + progreso lineal + teclado).
2. [x] Config de pasos en `src/tour/steps.ts` (14 pasos en orden del proceso, con dependencias y paso final de facturación).
3. [x] Persistencia de progreso y modo de activación (auto/manual/atajo) en `src/tour/useTour.ts`.
4. [x] Integración en `App.tsx` (orquestación por `currentRole`/módulo activo, sin router).
5. [x] Botón de ayuda en header + disparador manual (icono ayuda) con progreso lineal.
6. [x] Atributos `data-tour="<paso>"` en componentes clave del flujo.
7. [ ] E2E + QA Report (en curso).

## 7. Riesgos / dependencias
- Posicionamiento del spotlight requiere que los elementos objetivo tengan ids/data
  attributes estables. Se recomienda agregar `data-tour="modulo.paso"` en los
  componentes clave durante BUILD.
- ADR actual prohíbe React Router; el tour se orquesta con `useState` (sin router).
- Dependencia externa `driver.js` v1.8.0 documentada en `Documentacion/ADR/ADR-002-tour-guiado-driverjs.md`.
- Fallback a popover centrado si el elemento destino no se encuentra (permisos de rol).
