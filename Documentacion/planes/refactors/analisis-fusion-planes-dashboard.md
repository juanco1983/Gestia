# Análisis Comparativo: Fusión de Planes para el Dashboard GESTIA

## Resumen del Análisis

Se analizaron dos documentos de planificación del módulo Dashboard:

- **Plan A**: `Rediseño modulo Dashboard.md` — *Dashboard por Roles + Centro de Comando Operativo (GESTIA 4.0)*
- **Plan B**: `plan-dashboard-indicadores-operativos.md` — *Indicadores de Valor Operativo (4 Pilares de Métricas)*

---

## ✅ Veredicto: FUSIÓN TOTAL — Son Complementarios, No Competitivos

Los dos planes **no se contradicen**. El Plan A define **estructura, roles y UX**, mientras el Plan B define **el qué medir y cómo calcularlo**. Juntos forman un documento de especificación completo.

```
Plan A (GESTIA 4.0) = EL CÓMO (arquitectura, roles, UX, navegación)
Plan B (Indicadores) = EL QUÉ (métricas, cálculos, fuentes de datos)

Fusión = Spec técnico completo y ejecutable
```

---

## 🔍 Comparación Detallada por Dimensión

| Dimensión | Plan A (Rediseño Dashboard) | Plan B (Indicadores Operativos) | Decisión Fusión |
|---|---|---|---|
| **Objetivo Central** | Centro de Comando por Rol | Indicadores de Valor Operativo | ✅ Idéntico objetivo, distintos ángulos — **Fusionar** |
| **Roles Cubiertos** | Operaciones, Supervisor, Técnico, Ventas, Gerencia | Solo Operaciones (implícito) | ✅ Plan A amplía — **Mantener todos los roles del Plan A** |
| **KPIs de Operaciones** | SLA en Riesgo, Técnicos Disponibles, Servicios Críticos | MTTR, Pipeline OTs, Tasa Rechazo Informes | ✅ Complementarios — **Fusionar ambos conjuntos** |
| **Indicadores de Activos** | Equipos Pendientes (genérico) | Índice Equipos en Riesgo/Bypass, Ranking Fallas (específico) | ✅ Plan B es más rico — **Priorizar Plan B, conservar profundidad** |
| **Cobertura Contractual** | Contratos por Vencer (en KPIs) | Contratos venciendo ≤45d con pendientes, % Preventivos | ✅ Plan B más operativo — **Usar Plan B, eliminar duplicado de Plan A** |
| **Carga de Técnicos** | Widget Carga de Técnicos (visual, colores) | Carga Diaria por Técnico + Ratio Multi-Técnico | ✅ Plan A define UX visual, Plan B los datos — **Fusionar** |
| **Actividad en Tiempo Real** | Feed Live de actividades (timestamped) | No incluido | ✅ **Diferenciador único del Plan A — Conservar** |
| **Pipeline Operacional** | Contrato → OT → Informe → PDF (flujo completo) | Embudo de estados de OT activas | ✅ Plan A más completo, Plan B más accionable — **Fusionar con embudo de estados** |
| **Panel de IA** | Recomendador reactivo (no ejecuta, solo sugiere) | No incluido | ✅ **Diferenciador clave del Plan A — Conservar** |
| **UX / Performance** | Máx 2 clics, Lazy Loading, Cache, Virtual Scroll | No definido | ✅ **Exclusivo Plan A — Conservar** |
| **Criterios de Aceptación** | 7 criterios definidos | No definidos | ✅ **Usar los del Plan A, añadir métricas del Plan B** |

---

## 🗑️ Qué Eliminar / Consolidar (Sin Pérdida de Valor)

| Elemento | Está en | Acción |
|---|---|---|
| "Contratos por vencer" (KPI simple) | Plan A | Reemplazar por la versión enriquecida del Plan B (≤45d + pendientes) |
| "Equipos Pendientes" (KPI genérico) | Plan A | Ampliar con el Índice de Equipos en Riesgo del Plan B |
| "Potencia Total Gestionada (kVA)" | Plan B | **Mantener** — métrica de escala útil para Gerencia |
| Layout secuencial (texto plano) | Plan A | Reemplazar por el diagrama visual del Plan B |

---

## 🏆 Plan Maestro Fusionado: Estructura Final Recomendada

### Sección 1: Objetivo y Alcance *(Plan A)*
- Dashboard = Centro de Comando Operativo, no pantalla de bienvenida.
- Cada usuario ve solo la información relevante para su rol.

### Sección 2: Principios de Diseño *(Plan A — íntegros)*
- Interactividad total. Máximo 2 clics. Priorizar acción sobre estadística.

### Sección 3: Dashboard por Rol

#### Operaciones (Fusión A+B)
- Servicios Activos → Pipeline de OTs (embudo de estados)
- Servicios Programados Hoy + Carga de Técnicos
- **SLA de Respuesta (MTTR)** ← Plan B
- **Tasa de Rechazo de Informes (%)** ← Plan B
- Equipos en Riesgo (modo Bypass, observación) ← Plan B
- Contratos próximos a vencer con pendientes (≤45d) ← Plan B
- Alertas Automáticas de Riesgo

#### Supervisor *(Plan A — ya definido)*
- Informes Pendientes / Observados / Aprobados Hoy
- Tiempo Promedio de Revisión

#### Técnico *(Plan A — ya definido)*
- Agenda del Día / Próximo Servicio / Informes pendientes

#### Ventas *(Plan A — ya definido)*
- Contratos Próximos a Vencer / PDFs pendientes

#### Gerencia *(Fusión A+B)*
- KPIs Operativos: MTTR, % Cobertura Preventivos, Tasa SLA
- Ranking Top Equipos con Más Fallas ← Plan B
- Potencia Total Gestionada (kVA) ← Plan B
- Productividad y Tendencias

### Sección 4: Layout Visual Enriquecido

```
+-----------------------------------------------------------------------------------+
|  HEADER: Saludo + Rol + Fecha                                                     |
+---------------------------+-------------------+-----------------------------------+
|  [KPI Cards: 4 Métricas]  |                   |  [Alertas Automáticas]            |
|  - Servicios Activos      |   Pipeline de      |  ⚠️ UPS-003 modo Bypass           |
|  - SLA Cumplimiento       |   OTs (embudo)     |  ⏰ Contrato BCP vence en 12d    |
|  - Equipos en Riesgo      |                   |  👷 Técnico A: 5 OTs (saturado)  |
|  - % Preventivos cubierto |                   |                                   |
+---------------------------+-------------------+-----------------------------------+
|  [Servicios Prioritarios — Tarjetas con SLA + Progreso]                           |
+----------------------------------------------+------------------------------------+
|  [Actividad en Tiempo Real (Live Feed)]      |  [Carga de Técnicos]              |
|  08:00 - Juan inició Preventivo BBVA         |  Técnico A ● Verde (3 OTs)        |
|  08:40 - Supervisor aprobó Informe           |  Técnico B ● Rojo (5 OTs)         |
+----------------------------------------------+------------------------------------+
|  [Top 5 Equipos con Más Fallas (últimos 6m)] |  [Panel IA: Sugerencias]          |
|                                              |  ➜ Mover UPS-07 → Pedro           |
|                                              |  ➜ Reprogramar Servicio BBVA      |
+-----------------------------------------------------------------------------------+
```

### Sección 5: Fórmulas de Cálculo *(Plan B — íntegras)*
- Todas las definiciones técnicas de KPIs con su fuente de datos en BD.

### Sección 6: Componentes Técnicos *(Plan A — íntegros)*
- `KpiCard`, `ServiceCard`, `LiveActivity`, `TechnicianLoad`, `AlertPanel`, `Pipeline`, `AIPanel`, `QuickActions`

### Sección 7: Performance y UX *(Plan A — íntegros)*
- Lazy Loading, Auto Refresh, Cache Local, Virtual Scroll.

### Sección 8: Criterios de Aceptación *(Fusión A+B)*
- Los 7 criterios del Plan A + 2 adicionales:
  - ✅ Los KPIs de operaciones incluyen MTTR, Tasa Rechazo y Cobertura Preventivos.
  - ✅ Las alertas automáticas detectan modos Bypass activos en equipos críticos.

---

## 🛠️ Factibilidad Técnica

> [!IMPORTANT]
> **100% viable con la BD actual.** No requiere nuevas tablas ni migraciones. Todo se calcula con datos existentes en `OT`, `TechnicalReport`, `Equipo`, `Contrato`, `User` y `OtEquipoAsignacion`.

### Elementos que requieren desarrollo adicional:
| Elemento | Complejidad | Prioridad |
|---|---|---|
| Feed de Actividad en Tiempo Real | Media (WebSocket o polling) | Alta |
| Cálculo de MTTR automático | Baja (diferencia de campos de hora existentes) | Alta |
| Índice de Equipos en Riesgo por datos técnicos del informe | Media (parsear campos de informe) | Media |
| Panel de IA con Recomendaciones | Alta (lógica heurística o LLM) | Baja (Fase 2) |

---

## ✅ Próximos Pasos Recomendados

1. **Fusionar ambos planes** en un único archivo `spec-dashboard-operativo-v2.md` (documento maestro).
2. **Implementar en Fases**:
   - **Fase 1** (Alta prioridad): KPI Cards + Pipeline de OTs + Alertas de Riesgo + Carga de Técnicos.
   - **Fase 2** (Media): Feed de Actividad en Tiempo Real + Ranking de Equipos con Fallas.
   - **Fase 3** (Baja): Panel de IA / Sugerencias automatizadas.
