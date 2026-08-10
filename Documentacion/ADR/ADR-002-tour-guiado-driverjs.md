# ADR-002: Guía interactiva (tour) con `driver.js`

## Status

Accepted

## Date

2026-08-10

## Context

Gestia es una aplicación compleja con múltiples roles y un proceso de negocio
lineal (Cliente → Contrato → Equipo → Visita → OT → Asignar técnico → Informe →
Aprobación → Facturación → Portales). Los usuarios nuevos carecen de guía
cognitiva para recorrer el proceso en el orden real: hoy es posible abrir "Crear
OT" en Gestión de OT antes de programar la visita, tareas que requieren
prerrequisitos (el informe técnico exige equipo del contrato) o el cierre
financiero (N° de factura + monto). Se desea un **tour guiado interactivo lineal
único** que recorra todo el proceso con overlay, spotlight y tooltips, advierta
dependencias y termine con la facturación.

Requisitos clave:

1. Overlay oscurecedor + spotlight (recorte) sobre el elemento destacado.
2. Tooltip card con estilo Dashboard (tokens del sistema de diseño: teal-brand,
   `bg-white rounded-2xl border border-slate-100`, font-mono para el progreso).
3. Navegación Atrás/Siguiente/Saltar, progreso "Paso X de N", teclado (Esc y
   flechas), sin `window.alert` ni emojis (reglas AGENTS.md UI/UX).
4. Recorrido modular: el tour cruza módulos (`currentRole`) sin router.
5. Persistencia del progreso en `localStorage` + auto-start al primer login.
6. Bundle liviano, cero dependencias adicionales, TypeScript.

## Decision

Se adopta **`driver.js` v1.8.0** como motor del tour:

- Librería MIT con 0 dependencias, ~5 kB gz, tipada en TypeScript.
- API: `driver(config)` → `Driver.drive(index)` / `Driver.destroy()`.
- Configs utilizadas: `animate`, `smoothScroll`, `allowClose: false`,
  `allowKeyboardControl: false` (el teclado se maneja desde `TourGuide` para
  casar con el estado de React), `overlayColor: 'rgb(15 23 42)'`,
  `overlayOpacity: 0.55`, `stagePadding`, `stageRadius`, `popoverClass`.
- El render de los botones se personaliza vía `onPopoverRender` (footer con
  Atrás / Siguiente / Saltar y barra de progreso), casi igual a las opciones
  nativas `showButtons` / `showProgress` / `progressText` canceladas por las
  reglas de diseño.
- Los pasos se definen en `src/tour/steps.ts` (`TourStep`) mapeados a
  `DriveStep` en `TourGuide.tsx`; el spotlight usa selectores `data-tour="<slug>"`
  insertados en los componentes clave del flujo (Dashboard, Comercial,
  Operaciones, OT, Técnico, Supervisión, Ventas, Cliente, Administración).
- **Orquestación React, no driver.js**: el estado vive en `useTour`
  (`tour.active`, `tour.stepIndex`); `TourGuide` sincroniza con `d.drive(index)`
  y pide navegación de módulo vía `onNavigate(module)` antes de mostrar cada
  paso. `driver.js` deja de recorrer pasos por su cuenta.
- **Resiliencia**: si un paso no encuentra su elemento (permisos de rol o carga
  diferida), se busca con `document.querySelector` y en fallo se degrada a
  popover centrado sin spotlight (reconstruyendo los steps sin `element`).
- CSS del tour en `src/tour/tour.css` (importado junto al `driver.css` de la
  librería) para sobrescribir con tokens del sistema de diseño.

## Alternatives Considered

### Construcción propia (overlay + portal + tooltip)
- Pros: control total, sin dependencia externa.
- Cons: posicionamiento/scroll/aria-managed impecables es difícil de lograr
  bien; riesgo de deuda y bugs de borde alto para un beneficio marginal.
- Rejected: `driver.js` cubre el escenario más complejo (spotlight + scroll +
  resposive) y queda muy por debajo del umbral de peso del proyecto.

### React Joyride
- Pros: popular en ecosistema React, steps como estado.
- Cons: más de 15 dependencias transitivas; no brilla en overlays de fuerte
  personalización visual (stage radius, padding), que son requisito de diseño.
- Rejected: `driver.js` pesa menos (~5 kB gz vs cientos de kB) y su modo
  imperativo encaja mejor con la orquestación por `currentRole`.

### shepherd.js / intro.js
- Pros: maduras y conocidas.
- Cons: shepherd requiere Popper (dependencia extra); intro.js tiene menos
  control de encuadre angular y estilos propietarios; ambas amplían el bundle
  comparado con `driver.js`.
- Rejected por peso, dependencias adicionales y control del spotlight.

## Consequences

- El tour agrega ~5 kB gz (driver.js) + ~2 kB de CSS propio al bundle.
- `driver.js` importa `./dist/driver.css`; se agrega una importación CSS
  adicional protegida por la rama feature.
- El anclaje por selectores `data-tour` introduce un contrato débil: si un
  componente cambia su markup, el paso puede no encontrarse; la degradación a
  popover centrado evita que el tour se rompa con hosting de error.
- No se usa el auto-avance de `driver.js`; toda la navegación la controla
  `useTour`, lo que mantiene el estado del tour sincronizado con el módulo
  activo (sin React Router).
- El onboarding queda persistido en `localStorage`
  (`gestia_tour_progreso` + `gestia_tour_progreso_visto`).

## Related

- Plan: `Documentacion/planes/features/2026-08-09-tour-guiado-interactivo.md`
- Mockup v1: `Documentacion/mockups/tour-guiado-interactivo.html`