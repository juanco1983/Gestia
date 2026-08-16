# Especificación de Análisis Funcional del Sistema — Gestia IA

**Versión:** 4.1.0  
**Fecha de Última Actualización:** 2026-08-16  
**Proyecto:** Gestia IA — Plataforma de Gestión de Mantenimiento Eléctrico, Climatización e Informes Técnicos  

---

## 1. Visión General del Sistema

Gestia IA es una plataforma web integral diseñada para optimizar y auditar los servicios de mantenimiento preventivo, correctivo y de emergencia de equipos industriales de potencia (UPS, Rectificadores, Bancos de Baterías, Climatización y Transformadores).

La solución abarca el ciclo de vida completo del servicio: desde la cotización y vinculación comercial con contratos marco, la programación y despacho de órdenes de trabajo (OT), la ejecución offline/online en campo por el técnico, la auditoría y control de calidad por el supervisor, hasta la aprobación final y firma de conformidad del cliente.

---

## 2. Matriz de Actores y Roles de Usuario

| Rol | Módulos Accesibles | Responsabilidades Principales |
|---|---|---|
| **Administrador** | Todos los módulos | Control total de configuración, usuarios, catálogo de equipos, contratos, métricas globales y auditoría. |
| **Ventas / Comercial** | Dashboard, Monitoreo, Gestión de OT, Clientes y Contratos, Ventas, Inventario | Registro de contratos marco, adendas, vinculación de OTs financieras, seguimiento de cotizaciones y facturación. |
| **Supervisor de Calidad** | Dashboard, Monitoreo, Supervisión, Inventario de Equipos | Auditoría técnica de informes de campo, aprobación/rechazo de OTs, inspección de evidencias fotográficas en alta resolución. |
| **Técnico de Campo** | Dashboard, Monitoreo, Técnico (Bandeja y Formulario Wizard), Inventario | Ejecución de mantenimientos en sitio, toma de lecturas eléctricas, captura de evidencias fotográficas rotuladas y envío a revisión. |
| **Cliente** | Dashboard, Monitoreo, Portal del Cliente | Visualización en tiempo real del estado de sus equipos, descarga de informes aprobados en PDF/DOCX y firma digital de conformidad. |

---

## 3. Módulos Funcionales y Reglas de Negocio

### 3.1. Módulo Inventario de Equipos (`InventarioEquiposView.tsx`)
- **Ficha Técnica Consolidada:** Muestra el catálogo de equipos asignados a clientes y sedes.
- **Columna Dedicada Marca:** Muestra la marca del equipo (ej: *APC, Eaton, Emerson, Schneider*) derivada del registro técnico.
- **Columna Dedicada Estado del Contrato:**
  - 🟢 **`Vigente`**: Contrato activo cuya fecha de fin es igual o posterior a la fecha actual.
  - 🔴 **`Vencido`**: Contrato cuya fecha de fin ya expiró.
  - ⚪ **`Sin Contrato`**: Equipo no asociado a un contrato marco o adenda activa.
- **Cálculo de Visitas Históricas:** Combina dinámicamente el conteo de OTs ejecutadas históricamente y los informes técnicos consolidados en base de datos Postgres (`Math.max(otsCount, reportsCount)`).

### 3.2. Módulo Supervisión y Auditoría (`SupervisorView.tsx` & `TechMonitoringDashboard.tsx`)
- **Panel de Revisión de Calidad:** Espacio de auditoría rápida de lecturas (Voltaje Entrada/Salida, Bypass, Estado Baterías) y diagnóstico técnico.
- **Visor Lightbox Modal de Foto Ampliada:** Al hacer clic sobre cualquier miniatura del *Registro Fotográfico de Conformidad* (18 slots de evidencia), la imagen se despliega en un modal centrado a pantalla completa en alta definición.
- **Regla de Limpieza de Observaciones al Aprobar:**
  - Cuando un supervisor hace clic en **"Aprobar Informe"**, la OT cambia a estado 🟢 **`Aprobada`** y se elimina explícitamente cualquier nota previa de corrección (`correccionesSupervisor = ""`).
  - El informe desaparece de la bandeja de pendientes/observados y se traslada a la bitácora de informes aprobados/firmados.

### 3.3. Módulo Técnico de Campo (`TecnicoView.tsx` & `WizardInforme.tsx`)
- **Bandeja de Trabajo:** Organizada en pestañas (*Por Ejecutar / En Proceso*, *Historial Aprobados*).
- **Asistente Wizard de Informe:** Flujo estructurado en pasos (Antecedentes, Acciones Realizadas, Mediciones de Entrada/Salida, Registro Fotográfico Obligatorio SLA, Diagnóstico y Recomendaciones).
- **Ejecución Offline:** Sincronización transparente con IndexedDB/Dexie cuando no hay conectividad a Internet.

---

## 4. Regla Estricta de Mantenimiento de la Documentación

> [!IMPORTANT]
> **Toda nueva funcionalidad, cambio en las reglas de negocio, modificación en flujos UI/UX o alteración del esquema de datos DEBE actualizar la documentación correspondiente en `Documentacion/` (incluyendo este documento de Análisis Funcional) en el mismo Commit y PR hacia `dev`.**
