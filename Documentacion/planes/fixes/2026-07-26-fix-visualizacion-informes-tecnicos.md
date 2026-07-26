# Plan de Fix: Visualización de Informes Técnicos en Panel de Supervisor

**Fecha:** 2026-07-26  
**Categoría:** `fixes`  
**Estado:** In Progress  

## Contexto y Problema
El supervisor no puede visualizar los informes técnicos cargados por los técnicos para ciertas OTs (ej. `OT-OM-CO-001-1`), mostrando el mensaje *"La data del reporte es ilegible o el técnico aún no inicia el cuestionario."*.

## Causa Raíz
1. `getAssociatedReport` en `SupervisorView.tsx` retornaba prematuramente `undefined` cuando `equipoId` estaba presente pero no coincidía de forma exacta con `report.equipoId`, impidiendo ejecutar la línea de fallback por `otId`.
2. Falta de sanitización/normalización de cadenas en las comparaciones de `otId` y `equipoId`.
3. Actualización de estado en `App.tsx` rígida por `id` de reporte.

## Tareas
- [ ] Refactorizar `getAssociatedReport` en `SupervisorView.tsx` con fallback garantizado y normalización de IDs.
- [ ] Ajustar la búsqueda de informes en `TecnicoView.tsx` y `App.tsx`.
- [ ] Validar con `npx tsc --noEmit` y suite e2e.

## Criterios de Aceptación
- Al hacer clic en cualquier OT pendiente con reporte registrado, la vista de supervisor muestra inmediatamente el informe en pantalla.
