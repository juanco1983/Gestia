# Plan: Módulo Dashboard Operativo y Métricas de Valor (GESTIA)

## Contexto y Objetivo

El presente documento define la propuesta de diseño e indicadores clave de rendimiento (KPIs) para el módulo **Dashboard Operativo** en la plataforma GESTIA. 

El objetivo principal es transformar los datos operativos recopilados en tiempo real (Órdenes de Trabajo, Informes Técnicos de UPS/HVAC, Equipos y Contratos) en un **centro de mando estratégico y preventivo** que maximice la continuidad operativa de los clientes y la eficiencia del personal de campo.

---

## 📊 Pilares de Indicadores Operativos

### Pilar 1: Salud Operativa y Cumplimiento de SLA
*Enfoque: Monitoreo en tiempo real para Despachadores y Jefes de Operaciones.*

| Indicador | Lógica de Cálculo | Propósito Operativo |
|---|---|---|
| **SLA de Atención (Tiempo de Respuesta)** | `horaLlegadaSitio - fechaProgramada` en OTs `CORRECTIVO` y `EMERGENCIA`. | Garantizar respuesta rápida según el nivel de servicio acordado con el cliente. |
| **Tiempo Medio de Reparación (MTTR)** | `horaFinServicio - horaInicioServicio` | Evaluar duración real del trabajo técnico según tipo de equipo (UPS vs Climatización). |
| **Embudo de OTs Activas (Pipeline)** | Conteo vivo por estados: `Pendiente Programación` → `Programada` → `En Sitio/En Proceso` → `En Revisión` → `Observada`. | Identificar inmediatamente embotellamientos en el flujo de trabajo. |
| **Tasa de Rechazo de Informes (%)** | `(Informes OBSERVADAS / Total Informes en Revisión) * 100` | Evaluar calidad del llenado de informes técnicos y detectar necesidades de capacitación. |

---

### Pilar 2: Confiabilidad y Salud de Activos Críticos (UPS & HVAC)
*Enfoque: Prevención de caídas de Data Centers y fallas energéticas/térmicas.*

| Indicador | Lógica de Cálculo | Propósito Operativo |
|---|---|---|
| **Índice de Equipos en Riesgo / Observación** | Equipos con estado `En observación`/`En reparación`, o con parámetros críticos en su último informe (modo *Bypass Estático/Manual*, Temp > 30°C, celdas de batería degradadas). | **Alertar proactivamente antes de que ocurra una caída del sistema del cliente.** |
| **Top Equipos con Mayor Recurrencia de Fallas** | Ranking de equipos con mayor número de OTs `CORRECTIVO` acumuladas en los últimos 6-12 meses. | Justificar cambios de baterías, venta de repuestos o reemplazo tecnológico del activo. |
| **Potencia Total Gestionada (kVA)** | Sumatoria de `potenciaKva` de todos los equipos con contrato activo. | Métrica de escala y capacidad total del parque mantenido. |

---

### Pilar 3: Productividad y Balance de Carga del Personal Técnico
*Enfoque: Optimización de itinerarios y recursos de campo.*

| Indicador | Lógica de Cálculo | Propósito Operativo |
|---|---|---|
| **Carga Diaria por Técnico** | Número de OTs asignadas por técnico para el día y la semana. | Distribuir equilibradamente el trabajo y evitar la sobrecarga del personal. |
| **Ratio de Trabajo en Equipo Multi-Técnico** | `%` de servicios ejecutados con Técnico de Apoyo / Adicionales vs Visitas Individuales. | Dimensionar requerimientos de personal para equipos de alta potencia. |
| **Cumplimiento de Horarios (Puntualidad)** | Desviación entre `horaProgramada` y `horaLlegadaSitio`. | Medir eficiencia en desplazamientos y rutas. |

---

### Pilar 4: Cobertura Contractual y Visitas Preventivas
*Enfoque: Garantía de cumplimiento del 100% de visitas del contrato.*

| Indicador | Lógica de Cálculo | Propósito Operativo |
|---|---|---|
| **Cobertura de Preventivos (%)** | `(Equipos con Mantenimiento Ejecutado en el Periodo / Total Equipos en Contrato) * 100` | Asegurar que ningún equipo contratado quede sin revisión preventiva. |
| **Contratos Próximos a Vencer con Pendientes** | Contratos con vigencia `≤ 45 días` que registran `pendientesCount > 0`. | Evitar pérdida de visitas contratadas antes del vencimiento comercial. |

---

## 🎨 Arquitectura de Layout Propuesta

```
+-----------------------------------------------------------------------------------+
|  [KPI Summary Cards: 4 Métricas Top]                                              |
|  - SLA Cumplimiento (96.4%)  - MTTR Promedio (2.4h)  - % Cobertura Preventivos (88%)|
|  - Equipos en Riesgo (3)                                                          |
+------------------------------------------------------+----------------------------+
|  [Gráfico 1: Embudo de Estado de OTs (Pipeline)]    | [Widget: Alertas Críticas] |
|  Programadas -> En Sitio -> En Revisión -> Aprobadas | - UPS-003 en Modo Bypass   |
|                                                      | - Contrato BCP vence 15d   |
+------------------------------------------------------+----------------------------+
|  [Tabla/Ranking: Top 5 Equipos con Más Fallas]      | [Carga por Técnico (Hoy)]  |
|  Cliente | Código | Tipo | Correctivos (últ. 6m)    | Técnico A: 3 OTs (Ok)     |
|                                                      | Técnico B: 5 OTs (Saturado)|
+-----------------------------------------------------------------------------------+
```

---

## 🛠️ Factibilidad Técnica

- **100% Soportado por la Base de Datos Actual**: Toda la información se calcula a partir de las entidades existentes (`OT`, `TechnicalReport`, `Equipo`, `Contrato`, `User`, `OtEquipoAsignacion`).
- **No Requiere Modificaciones en BD**: Se implementa a nivel de consultas agregadas en backend/frontend.
