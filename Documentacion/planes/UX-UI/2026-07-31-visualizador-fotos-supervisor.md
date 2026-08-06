# Plan — Visualizador de Fotos Ampliadas en Auditoría del Supervisor

**Fecha:** 2026-07-31
**Módulo:** Supervisor (`src/components/SupervisorView.tsx`)
**Categoría:** UX-UI
**Mockup:** [Documentacion/mockups/supervisor-visualizador-fotos.html](../mockups/supervisor-visualizador-fotos.html)

## Contexto

En la vista de auditoría del supervisor (tab "Resumen Técnico"), el registro
fotográfico de conformidad se muestra como una grilla de miniaturas
`grid grid-cols-2 md:grid-cols-4 gap-3` (SupervisorView.tsx:745-786). Las
miniaturas **no son clicables**: el supervisor no puede ampliar una foto para
validar su nitidez o legibilidad antes de aprobar o rechazar el informe.

El supervisor necesita inspeccionar cada evidencia fotográfica en tamaño real
para decidir si la foto es nítida (válida como evidencia) o requiere retoma
por parte del técnico.

## Alcance

**Incluido:**
1. Miniaturas de la grilla clicables (cursor pointer + overlay "Ampliar" al hover).
2. Nuevo modal "Visualizador de Foto Ampliada" (lightbox a pantalla completa):
   - Imagen ampliada centrada con `max-h-[70vh] object-contain`.
   - Navegación anterior/siguiente entre las fotos del informe.
   - Controles de zoom (50%–200%).
   - Contador (ej: "Foto 3 de 8") y nombre del slot de la foto.
   - Miniaturas de navegación en el footer con estado de nitidez.
   - Cierre con botón, clic fuera y tecla ESC.
3. Control de validación de nitidez por foto: toggle "Nítida" / "Requiere
   retoma" (sin persistencia en esta iteración, ver criterios).

**Excluido:**
- Persistencia de la valoración de nitidez en el modelo de datos / reporte
  (se decide tras validación del mockup).
- Cambios en `TecnicoView`, `VentasView` o en la vista de cliente.
- Refactor del grid fotográfico en otros módulos.

## Criterios de aceptación

1. Al hacer clic en cualquier miniatura del registro fotográfico se abre el
   modal con la foto correspondiente en pantalla completa.
2. El modal permite recorrer las fotos con flechas anterior/siguiente y con
   las miniaturas del footer.
3. El zoom funciona entre 50% y 200% con indicador de porcentaje.
4. Se puede cerrar el modal con botón, clic fuera o tecla ESC.
5. El supervisor puede marcar cada foto como "Nítida" o "Requiere retoma",
   visible tanto en el header del modal como en la miniatura del footer.
6. Sin `window.alert()`, sin emojis, sin hex crudos ni utilities Tailwind
   inválidas (reglas AGENTS.md). Patrón visual de `guia_ui_ux.md` §3/§4.
7. A11y: foco manejado, `aria-label` en controles de icono, cierre con ESC.

## Desglose de tareas

| Tarea | Estado |
|---|---|
| Entregar mockup visual para validación (antes/después) | inProgress |
| Validación y aprobación del mockup por el usuario | pending |
| Plan de trabajo en `Documentacion/planes/UX-UI/` | inProgress |
| Implementar estado del lightbox (foto seleccionada, zoom, nitidez) | pending |
| Hacer miniaturas clicables con overlay hover | pending |
| Implementar modal visualizador (navegación, zoom, cierre, footer) | pending |
| Integrar control de nitidez "Nítida" / "Requiere retoma" | pending |
| Verificación (build, lint, pruebas manuales del flujo) | pending |
| Commit + push en rama `feature/supervisor-visualizador-fotos` | pending |

## Riesgos

- Imágenes base64 de gran tamaño pueden ralentizar el render del modal →
  usar `object-contain` y no escalar el DOM (solo la imagen).
- El modal convive con el modal fullscreen existente del documento
  (`isFullscreen`); ambos usan `z-[10000]` → el lightbox debe montarse con
  `createPortal` y un z-index mayor o por encima del fullscreen para evitar
  superposición confusa.
- Cerrar el fullscreen de documento al abrir el lightbox de foto evita
  estados anidados inesperados.

## Dependencias

- `guia_ui_ux.md` (sistema de diseño vigente).
- Componente `DocumentFormat` no se modifica.
- Sin dependencias de paquetes nuevas (solo `lucide-react` ya presente).
