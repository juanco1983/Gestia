# GESTIA 4.0
# Operations Module Redesign Plan

## Objetivo
Rediseñar únicamente el módulo de Operaciones para convertirlo en un Centro de Planificación y Control de Servicios.

## Alcance
Solo aplica al módulo Operaciones. Los demás módulos permanecen sin cambios.

## Filosofía
- El Contrato continúa siendo el origen.
- El Servicio pasa a ser la entidad operativa.
- La OT continúa existiendo, pero deja de ser el foco visual.

## Flujo Propuesto
Cliente → Contrato → Programar Servicio → Seleccionar Equipos → Crear Servicio → Generar OT por Equipo → Asignar Técnicos → Agenda → Informe → Supervisor → PDF → Ventas → Cliente.

## Vista 1: Contratos y Adendas
Mantener la pantalla actual y cambiar el botón a 'Programar Servicio'.
Cada tarjeta mostrará Cliente, Contrato, Tipo de Servicio, Vigencia, Equipos, Próxima ejecución, SLA y botón Programar Servicio.

## Wizard
1. Tipo de Servicio.
2. Selección de Equipos.
3. Programación.
4. Asignación inicial.
5. Resumen de creación.

## Vista 2: Servicios Programados
Centro de Operaciones con pestañas: Resumen, Equipos, Asignaciones, Agenda, Informes e Historial.

## IA
Solo recomienda sobrecargas, conflictos, riesgos SLA y reasignaciones.

## Restricciones
No modificar Informes, Supervisor, Ventas ni la lógica existente.

## Criterios de aceptación
- Contrato sigue siendo el origen.
- Servicio es la entidad operativa.
- Una OT por equipo.
- Múltiples técnicos por servicio.
- Trazabilidad completa Contrato→Servicio→OT→Informe→Supervisor→PDF→Cliente.
