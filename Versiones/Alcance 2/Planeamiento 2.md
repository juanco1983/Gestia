# Documento de Especificación Técnico-Funcional: Arquitectura de Procesos y Métricas SLA para Software FSM (Gestión de Servicios de Campo - Especialidad UPS)

Este documento establece el mapa de procesos detallado para el diseño, auditoría y optimización de un software de Gestión de Servicios de Campo (FSM) enfocado en la reparación, mantenimiento, alquiler de Sistemas de Energía Ininterrumpida (UPS) y atención de emergencias críticas. Está estructurado bajo las mejores prácticas internacionales de **ITIL v4 (Gestión de Incidentes y Peticiones de Servicio)** y estándares globales de operaciones de campo.

---

## Módulo 1: Gestión de Contratos, Clientes y Límites Financieros

Este módulo constituye el núcleo de validación de derechos (*entitlements*) antes de disparar cualquier operación. El software debe asegurar que ninguna orden de trabajo (OT) se ejecute sin un respaldo contractual o un acuerdo de cobro explícito.

### 1.1 Modelos de Contratación Soportados
El sistema debe parametrizar tres (3) arquitecturas contractuales principales:

1. **Contrato Marco con Bolsa de Presupuesto / Crédito de Servicios:**
   * **Definición:** Un contrato anual por un monto global fijo (Ej: $20,000.00).
   * **Lógica del Software:** Permite subdividir el monto total en hitos de consumo programados (Ej: 4 mantenimientos preventivos trimestrales de $5,000.00 cada uno) o consumos por demanda tarifados según un catálogo de precios preacordado.
2. **Contrato de Alquiler de Equipos (SLA Operativo):**
   * **Definición:** Facturación recurrente por la disponibilidad de un activo UPS propiedad de la empresa prestadora en las instalaciones del cliente.
   * **Lógica del Software:** Vincula el número de serie del UPS alquilado con la cuenta del cliente, aplicando penalizaciones automáticas al cobro mensual si el equipo falla y el tiempo de reparación supera el SLA contratado.
3. **Servicios Especiales por Evento (Spot / Fuera de Contrato):**
   * **Definición:** Clientes sin contrato vigente o servicios no cubiertos por la póliza estándar (Ej: reparación por daño catastrófico debido a inundación).
   * **Lógica del Software:** Requiere cotización previa obligatoria o aprobación explícita de tarifa por hora hombre + repuestos antes de la asignación técnica.

### 1.2 Reglas de Negocio y Automatizaciones de Control Financiero
* > **RN-01-01: Control de Saldo en Contrato Marco.** Cada vez que una OT asociada a un Contrato Marco cambie al estado "Completada/Cerrada", el sistema debe restar automáticamente el costo del servicio ejecutado del saldo disponible del contrato.
* > **RN-01-02: Bloqueo por Saldo Insuficiente.** Si el saldo remanente de un Contrato Marco es inferior al costo estimado de la siguiente actividad programada, el software debe bloquear la generación automática de la OT, cambiar el estado del contrato a "En Disputa/Finanzas" y disparar una alerta por correo/notificación push al Ejecutivo Comercial asignado.
* > **RN-01-03: Trazabilidad de Consumo.** El sistema mantendrá un log inmutable donde se muestre: `[Saldo Inicial] -> [ID de OT Ejecutada] -> [Monto Descontado] -> [Saldo Resultante] -> [Usuario/Proceso del Sistema]`.

### 1.3 Matriz de SLAs y Alarmas del Módulo 1

| Identificador | Nombre del SLA / Métrica | Descripción Funcional | Umbral Target | Alarma del Sistema (Trigger) |
| :--- | :--- | :--- | :--- | :--- |
| **SLA-FIN-01** | Notificación de Consumo de Saldo Crítico | Alerta automática cuando el presupuesto del contrato marco se agota por niveles de consumo acumulados. | Al llegar al **80% y 95%** del consumo total del contrato. | Envío automático de correo a finanzas y al cliente con la proyección de agotamiento. |
| **KPI-FIN-02** | Tiempo de Renovación / Alerta de Expiración | Días de anticipación con los que el sistema notifica el fin de vigencia de un contrato de alquiler o mantenimiento. | **60 días antes** de la fecha de término. | El tablero del Supervisor Comercial marca el contrato en color Ámbar. A los 30 días pasa a Rojo. |

---

## Módulo 2: Desencadenamiento, Clasificación y Generación de Órdenes de Trabajo (OT)

El software debe centralizar la captura de requerimientos de servicio desde múltiples fuentes de entrada, tipificando el nivel de urgencia técnica de manera estricta.

### 2.1 Orígenes de Disparo de las OTs
El sistema debe procesar la creación de OTs a través de tres flujos independientes:

1. **Flujo de Mantenimiento Preventivo (Cronograma Automatizado):** El motor del software lee la frecuencia del contrato (Ej: cada 60 días) y genera la OT de forma automática 15 días antes de la fecha límite teórica, dejándola en estado *"Pendiente de Programación"*.
2. **Flujo de Incidentes y Atención de Emergencias:** Registrado manualmente por la mesa de ayuda o automáticamente por el cliente mediante un Portal Web/App Móvil. Si el cliente indica "UPS en Bypass de Falla" o "Planta sin Energía", el software autodefine la categoría como Emergencia Crítica.
3. **Flujo Logístico de Alquiler:** Generación de OT de entrega, instalación, puesta en marcha o desinstalación y retiro de equipos UPS.

### 2.2 Matriz de Criticidad e Impacto (Severidad del Incidente)
El software debe calcular la severidad de la OT de manera automática cruzando el **Impacto en el Negocio** del cliente con la **Urgencia Técnica** del UPS:

| Urgencia Técnica / Impacto de Negocio | Alto (Operación Core Detenida / Data Center Caído) | Medio (Pérdida de Redundancia N+1 / Carga protegida pero expuesta) | Bajo (Falla menor sin alarmas críticas / Estética) |
| :--- | :--- | :--- | :--- |
| **Crítica (UPS Apagado / Humo / Explosión)** | **P1 - Emergencia Crítica** | **P2 - Alta Prioridad** | **P3 - Media Prioridad** |
| **Media (UPS en Bypass / Alarma Activa)** | **P2 - Alta Prioridad** | **P3 - Media Prioridad** | **P4 - Baja Prioridad** |
| **Baja (Mantenimiento Programado / Inspección)** | **P3 - Media Prioridad** | **P4 - Baja Prioridad** | **P4 - Baja Prioridad** |

### 2.3 Matriz de SLAs y Alarmas del Módulo 2

| Identificador | Nombre del SLA / Métrica | Descripción Funcional | Umbral Target por Prioridad | Alarma del Sistema (Trigger) |
| :--- | :--- | :--- | :--- | :--- |
| **SLA-REC-01** | TTO (*Time to Own* - Tiempo de Admisión) | Tiempo transcurrido desde que ingresa un ticket/incidente hasta que el software genera la OT y es validada por el despacho. | • **P1:** < 10 minutos<br>• **P2:** < 30 minutos<br>• **P3/P4:** < 4 horas | Si la OT P1 no es admitida en 10 min, el software emite una alarma sonora en la consola de despacho y escala al Gerente de Operaciones de inmediato. |
| **SLA-REC-02** | TTR (*Time to Respond* - Notificación) | Tiempo máximo en el que el sistema confirma al cliente la recepción, el número de OT y la identidad del técnico asignado. | • **P1:** < 15 minutos<br>• **P2:** < 45 minutos<br>• **P3/P4:** < 8 horas | Envío automático de SMS / WhatsApp / Email automatizado con tracking link. |

---

## Módulo 3: Programación Dinámica y Asignación Inteligente de Recursos

Una vez que la OT está en estado *"Lista para Despacho"*, el software debe optimizar la asignación utilizando un tablero visual de arrastrar y soltar (*Dispatch Board*) asistido por reglas de validación obligatorias.

### 3.1 Algoritmo de Filtros de Asignación Obligatoria
El software impedirá la asignación de una OT si el técnico seleccionado no cumple con las siguientes validaciones cruzadas:

1. **Matriz de Competencias Técnicas (Skills Matrix):** El sistema debe catalogar a los técnicos por niveles de certificación (Ej: *Nivel 1: Cambio de baterías y preventivos menores; Nivel 2: Calibración y mantenimiento trifásico < 100 kVA; Nivel 3: Diagnóstico avanzado de fallas en paralelo, UPS > 500 kVA*). Si la OT requiere un técnico Nivel 3, el sistema bloqueará la asignación a técnicos Nivel 1 o 2.
2. **Disponibilidad Geográfica en Tiempo Real (GPS):** El software debe consumir la ubicación del dispositivo móvil de los técnicos. Ante un incidente **P1 (Emergencia)**, sugerirá automáticamente al técnico calificado más cercano en un radio de acción optimizado por tráfico.
3. **Control de Inventario Vehicular (Stock Móvil):** El software cruzará el modelo del UPS registrado en la OT con el stock del almacén móvil (el vehículo del técnico). Si la orden especifica un cambio de tarjetas de control o fusibles ultra-rápidos específicos, el sistema validará si el técnico los lleva físicamente en su inventario móvil o si debe hacer una parada previa en el almacén central.

### 3.2 Matriz de SLAs y Alarmas del Módulo 3

| Identificador | Nombre del SLA / Métrica | Descripción Funcional | Umbral Target por Prioridad | Alarma del Sistema (Trigger) |
| :--- | :--- | :--- | :--- | :--- |
| **SLA-DES-01** | Tiempo de Asignación de Recursos | Ventana máxima de tiempo para asignar un técnico calificado a una orden de trabajo abierta. | • **P1:** < 15 minutos<br>• **P2:** < 1 hora<br>• **P3/P4:** < 24 horas | Si una OT P1 no tiene un técnico asignado en el sistema a los 12 minutos de su creación, la OT parpadea en rojo brillante en la consola y bloquea el procesamiento de otras órdenes secundarias. |

---

## Módulo 4: Ejecución Operativa en Campo e Informe Técnico Avanzado (App Móvil)

Este módulo representa la interacción directa del técnico con el activo UPS en las instalaciones del cliente. La aplicación móvil debe operar bajo una arquitectura **"Offline-First"** debido a que los equipos UPS suelen ubicarse en sótanos blindados, centros de datos aislados o plantas industriales sin conectividad celular.

### 4.1 Flujo Secuencial de Estados de la OT (Trackeo por GPS)
El técnico interactúa con la App modificando los estados de la orden. Cada cambio guarda una marca de tiempo inmutable y coordenadas GPS de validación: