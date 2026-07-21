# GESTIA 4.0
# Dashboard Redesign Specification
Version: 1.0

---

# Objetivo

Rediseñar el Dashboard para convertirlo en un Centro de Comando Operativo.

El Dashboard deja de ser una pantalla de bienvenida y pasa a ser la pantalla principal de trabajo para cada usuario.

---

# Alcance

Este documento aplica únicamente al Dashboard.

No modifica los módulos existentes:

- Clientes
- Comercial
- Contratos
- Operaciones
- Técnicos
- Supervisor
- Informes
- Ventas
- Administración

El Dashboard únicamente consume información de estos módulos.

---

# Principios de Diseño

- Mostrar únicamente información relevante para el rol.
- Todos los indicadores deben ser interactivos.
- El usuario debe poder actuar desde el Dashboard.
- No mostrar información duplicada.
- Priorizar acciones antes que estadísticas.

---

# Dashboard por Rol

## Operaciones

Mostrar:

- Servicios Activos
- Servicios Programados Hoy
- Equipos Pendientes
- SLA en Riesgo
- Técnicos Disponibles
- Servicios Críticos

---

## Supervisor

Mostrar:

- Informes Pendientes
- Informes Observados
- Informes Aprobados Hoy
- Equipos Pendientes
- Tiempo Promedio de Revisión

---

## Técnico

Mostrar:

- Agenda del Día
- Servicios Asignados
- Equipos Pendientes
- Informes Pendientes
- Próximo Servicio

---

## Ventas

Mostrar:

- PDFs Pendientes
- Contratos Próximos a Vencer
- Servicios Finalizados
- Facturación Pendiente

---

## Gerencia

Mostrar:

- KPIs Operativos
- Productividad
- Cumplimiento SLA
- Rentabilidad
- Tendencias

---

# Layout

Header

↓

KPIs

↓

Servicios Prioritarios

↓

Actividad en Tiempo Real

↓

Carga de Técnicos

↓

Alertas

↓

Pipeline Operacional

↓

Panel IA

---

# KPIs

Cada KPI debe ser clicable.

Servicios Activos

↓

Abrir Operaciones

Informes Pendientes

↓

Abrir Supervisor

Contratos por vencer

↓

Abrir Comercial

Equipos Pendientes

↓

Abrir Operaciones

---

# Servicios Prioritarios

Cada tarjeta debe mostrar:

- Cliente
- Contrato
- Servicio
- Supervisor
- Fecha
- Equipos
- Técnicos
- Estado
- SLA
- Barra de Progreso

Botón

Abrir Servicio

Ordenar automáticamente por prioridad.

---

# Actividad en Tiempo Real

Mostrar:

08:00

Juan inició Preventivo BBVA

08:15

Pedro terminó UPS-03

08:40

Supervisor aprobó Informe

09:10

Ventas descargó PDF

09:30

Nuevo Servicio creado

Actualizar automáticamente.

---

# Carga de Técnicos

Mostrar:

Nombre

Disponibilidad

Equipos

Horas ocupadas

Horas libres

Estado

Colores:

Verde

Amarillo

Rojo

Al hacer clic abrir Agenda.

---

# Riesgos

Detectar automáticamente:

- SLA próximos a vencer
- Técnicos sobrecargados
- Equipos sin asignar
- Informes retrasados
- Contratos próximos a vencer

Cada alerta debe abrir el módulo correspondiente.

---

# Pipeline Operacional

Contrato

↓

Servicio

↓

Equipos

↓

OT

↓

Informe

↓

Supervisor

↓

PDF

↓

Cliente

Mostrar:

- Pendientes
- En proceso
- Finalizados
- Tiempo promedio

---

# Panel IA

La IA solamente recomienda.

No ejecuta acciones.

Debe detectar:

- Sobrecarga
- Riesgos SLA
- Retrasos
- Reasignaciones
- Informes pendientes

Ejemplo:

Mover UPS-07 al Técnico Pedro.

Reprogramar Servicio BBVA.

Solicitar aprobación del Supervisor.

---

# Componentes

DashboardHeader

KpiCard

ServiceCard

LiveActivity

TechnicianLoad

AlertPanel

Pipeline

AIPanel

QuickActions

---

# Componentes Reutilizados

Cards

Buttons

Tables

Badges

ProgressBar

Dialogs

Modals

Drawers

Toast

---

# UX

- Máximo dos clics para cualquier acción.
- Mantener el contexto.
- Evitar ventanas innecesarias.
- Reutilizar el Design System.
- Optimizar para pantallas 1920x1080 y superiores.

---

# Performance

- Lazy Loading
- Auto Refresh
- Cache Local
- Virtual Scroll
- Consultas paginadas

---

# Criterios de Aceptación

El Dashboard estará terminado cuando:

- Muestre información específica para el rol.
- Todos los KPIs sean interactivos.
- Muestre el estado de la operación en tiempo real.
- Permita acceder a cualquier módulo en máximo dos clics.
- Integre recomendaciones de IA.
- No replique información de otros módulos.
- Se convierta en el punto principal de entrada del sistema.

---

# Resultado Esperado

El Dashboard se convierte en un Centro de Comando Operativo que proporciona información en tiempo real, prioriza las tareas críticas y permite actuar inmediatamente sobre cualquier evento del negocio.