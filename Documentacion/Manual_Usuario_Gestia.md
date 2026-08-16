# Manual de Usuario - Gestia v4.0
**Sistema Integrado de Gestión de Mantenimiento**
*Mafort Service S.A.C.*

---

## 📖 Índice del Manual

1. [Sección I: Introducción General](#sección-i-introducción-general)
2. [Sección II: Portal del Técnico de Campo (Core)](#sección-ii-portal-del-técnico-de-campo-core)
3. [Sección III: Portal de Supervisión y Calidad](#sección-iii-portal-de-supervisión-y-calidad)
4. [Sección IV: Gestión Comercial y CRM](#sección-iv-gestión-comercial-y-crm)
5. [Sección V: Operaciones e Inventario](#sección-v-operaciones-e-inventario)
6. [Sección VI: Portal del Cliente (Firma Digital)](#sección-vi-portal-del-cliente-firma-digital)

---

## Sección I: Introducción General

¡Bienvenido a Gestia! Esta plataforma web centraliza todo el flujo de mantenimiento de equipos críticos.

### 1. Inicio de Sesión
1. Ingresa a la URL proporcionada por el administrador.
2. Introduce tu **correo corporativo** y **contraseña**.
3. (Opcional) Activa "Recordarme" para no tener que iniciar sesión diariamente.
4. Si ingresas desde un móvil, puedes usar la opción "Agregar a la pantalla de inicio" para instalar Gestia como una App (PWA).

### 2. El Dashboard (Panel Principal)
Al ingresar, verás un panel adaptado a tu rol. Si eres Técnico, verás tus OTs asignadas; si eres Supervisor o Comercial, verás métricas del negocio.

**Indicadores principales:**
- **Total OTs**: Volumen histórico de trabajos.
- **OTs Activas**: Trabajos ejecutándose en este preciso instante.
- **Cumplimiento SLA**: Porcentaje de trabajos terminados a tiempo.

> [!TIP]
> **Copiloto IA**: En la esquina del Dashboard encontrarás el Copiloto Mafort. Puedes hacerle preguntas en lenguaje natural como *"¿Cuáles contratos vencen este mes?"* y te responderá analizando la base de datos en tiempo real.

---

## Sección II: Portal del Técnico de Campo (Core)

El corazón de Gestia. Aquí es donde los técnicos ejecutan sus rutinas de mantenimiento.

### 1. Conceptos Básicos y Trabajo Offline

> [!IMPORTANT]
> **Modo Offline**: Gestia funciona aunque pierdas señal en sótanos o salas herméticas. Verás un indicador rojo que dice "Offline" en la pantalla. Sigue trabajando con normalidad; el sistema guardará todo automáticamente en tu dispositivo y sincronizará cuando recuperes señal.

### 2. Flujo de Trabajo del Técnico

````carousel
### Paso 1: Bandeja de Trabajo
Al ingresar, el técnico visualiza su "Bandeja de Entrada".
Aquí se listan las **Visitas** y **Órdenes de Trabajo (OT)** que tiene programadas para el día. 
- Pulsa **"Llegar a Sitio"** cuando estés en las instalaciones del cliente.
<!-- slide -->
### Paso 2: Abrir el Wizard
Haz clic en una OT pendiente para abrir el **Wizard del Informe**.
Este es un formulario paso a paso donde registrarás todo lo que hagas.
Tiene 4 secciones principales y 10 pasos en total.
<!-- slide -->
### Paso 3: Asistente Inteligente (Auto-llenado)
¿Poco tiempo? Usa el botón mágico **"Auto-llenado Mafort"**.
Este botón pre-completará campos estándar de antecedentes, características y recomendaciones según el equipo que estés revisando. ¡Solo tendrás que afinar los detalles!
````

### 3. El Wizard Paso a Paso

1. **Datos Generales**: Revisa el número de OT y agrega a tu técnico de apoyo si aplica.
2. **Antecedentes**: Redacta (o usa el autollenado) para explicar por qué se está realizando el servicio.
3. **Acciones Realizadas**: Marca las casillas de verificación (ej. "Limpieza externa", "Medición de voltaje") del checklist de 24 acciones estándar.
4. **Características del Equipo**: Llena la matriz con marca, modelo, kVA y especificaciones de baterías.
5. **Registro Fotográfico**: Sube las fotos. 
   - *Nota: Si el equipo es de 40kVA o más, el sistema te exigirá un mínimo de 16 fotos etiquetadas obligatorias.*
6. **Mediciones**: Registra voltajes y amperajes de Entrada (Red) y Salida (Equipo) en las fases R, S y T.
7. **Envío**: Al finalizar, haz clic en "Enviar a Revisión". La OT pasará al estado `EN_REVISION` y llegará a la bandeja de tu Supervisor.

---

## Sección III: Portal de Supervisión y Calidad

Destinado a ingenieros y supervisores de calidad que auditan el trabajo de campo.

### 1. Revisión de Informes

Cuando un técnico envía un informe, aparece en la **Cola de Revisión**.

````mermaid
flowchart LR
    A[Cola de Revisión] --> B{Auditoría}
    B -->|Aprobar| C[OT APROBADA]
    B -->|Rechazar| D[OT OBSERVADA]
    C --> E[Pasa a firma del Cliente]
    D --> F[Vuelve a la bandeja del Técnico]
````

### 2. Acciones del Supervisor
- **Aprobar**: Haz clic en el botón verde "Aprobar Reporte". El estado cambia a `APROBADA` y se envía al cliente.
- **Observar con Correcciones**: Si notas que faltan fotos o los voltajes no cuadran, usa el botón rojo "Observar". Escribe el motivo del rechazo. El técnico recibirá una notificación para corregirlo y volverlo a enviar.

> [!NOTE]
> Puedes generar el PDF o DOCX en cualquier momento desde esta pantalla para ver exactamente cómo quedará el documento impreso antes de aprobarlo.

---

## Sección IV: Gestión Comercial y CRM

El módulo para gestionar la cartera de clientes y contratos.

### 1. Crear un Cliente
1. Ve a **Comercial > Clientes > Nuevo Cliente**.
2. Ingresa RUC, Razón Social y correos de contacto.
3. Utiliza los selectores en cascada para la ubicación geográfica (País → Provincia → Distrito).

### 2. Generación de Contratos y OTs
Los contratos se vinculan a los clientes y a equipos específicos del inventario.

**Para crear una OT:**
1. Ve a **Gestión de OTs > Nueva OT**.
2. Selecciona el cliente y opcionalmente el contrato y equipo que cubrirá la OT.
3. Selecciona el **Tipo de Servicio** (Predictivo, Preventivo, Instalación, etc.).
4. Asigna un **Técnico Titular** y la **Fecha Programada**. Al guardar, la OT pasa a estado `PROGRAMADA`.

---

## Sección V: Operaciones e Inventario

### 1. Gestión de Visitas
Una "Visita" es un desplazamiento físico que puede agrupar múltiples OTs.
- Para programar, ve a **Operaciones > Visitas > Nueva Visita**.
- Selecciona la fecha, el técnico y marca todas las OTs pendientes que ese técnico ejecutará en ese mismo viaje.
- Si una OT no se pudo ejecutar en campo (cliente no dio acceso), la OT quedará como `NO_EJECUTADA`. Desde aquí podrás reprogramarla clonándola o agendando una nueva visita de seguimiento.

### 2. Inventario de Equipos
Es un catálogo vivo de las máquinas.
- **Historial de Servicios**: Haz clic en cualquier equipo (ej. "UPS 40kVA Sede Central") para ver una línea de tiempo con todos los mantenimientos históricos y el nombre del técnico que los ejecutó.
- **Estado Operativo**: Actualiza si el equipo está `Operativo`, `En reparación` o `Dado de baja`.
- **Alertas**: El sistema marcará en rojo aquellos equipos cuya fecha de "Próximo Servicio" ya haya expirado.

---

## Sección VI: Portal del Cliente (Firma Digital)

La etapa final del ciclo de vida del servicio.

1. El cliente accede a su portal y visualiza las OTs en estado `APROBADA`.
2. Al abrir el informe, podrá leer las 10 páginas del reporte oficial renderizado en pantalla (con fotos, antecedentes y mediciones).
3. **Firma Digital**: Al final del reporte hay un cuadro (Canvas). 
   - El cliente puede usar su dedo (en tablet/móvil) o el mouse para estampar su firma con tinta azul marino corporativa.
4. Al hacer clic en "Firmar y Conformar", la OT cambia a estado `FIRMADA`.
5. El sistema bloquea el documento y genera el **PDF Final** que habilita el proceso de facturación.

---
*Gestia v4.0 - Manual de Usuario generado por IA para Mafort Service S.A.C.*
