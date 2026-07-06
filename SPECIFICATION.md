# Documento de Alcance y Especificación Técnica
## Proyecto: Automatización de Informes Técnicos de Campo - Mafort

Este documento técnico de especificaciones describe los requerimientos y el alcance funcional, lógico y arquitectónico para el desarrollo del sistema de gestión y captura de informes técnicos de la empresa **Mafort**. Está diseñado específicamente para ser procesado por una plataforma de desarrollo de agentes autónomos (Antigravity), empleando un nivel de detalle atómico y de negocio sumamente riguroso basado en la transcripción de la reunión de alineación técnica.

---

## 1. Descripción General del Proyecto

### 1.1 Contexto de la Empresa (Mafort)
**Mafort** es una empresa especializada en la venta y prestación de servicios de mantenimiento (preventivo, correctivo y de emergencia) para equipamiento de soporte crítico de infraestructura de TI, tales como:
- **UPS** (Unidades de Alimentación Ininterrumpida).
- Sistemas de **climatización/aire acondicionado de precisión**.
- **Transformadores** de potencia.
- **Rectificadores** industriales.

Sus clientes principales son centros de datos (data centers) y salas de servidores distribuidos en Lima y a nivel nacional, donde la continuidad operativa del suministro eléctrico y térmico resulta crítica (criticidad 24/7).

### 1.2 Declaración del Problema
Actualmente, el flujo de captura y entrega de informes técnicos presenta una **brecha operativa (gap) crítica de entre 20 y 30 días** debido a las siguientes causas:
1. **Captura Manual Analógica**: Los técnicos de campo llenan en físico fichas técnicas pre-impresas en papel autocopiativo durante la visita técnica.
2. **Post-procesamiento Retardado**: Los técnicos pueden estar de viaje en provincias durante 20 días sin regresar a la oficina base. Solo al regresar entregan las fichas físicas para su procesamiento.
3. **Redundancia e Ineficiencia en la Oficina Base**: Los datos capturados en físico son transcritos manualmente por el técnico en computadoras de escritorio a plantillas de Microsoft Word (`.docx`), adjuntando manualmente fotos tomadas con sus celulares corporativos.
4. **Bloqueo Financiero**: La emisión de facturas finales está estrictamente condicionada a la conformidad escrita del cliente sobre el informe técnico digitalizado (exportado a PDF). Esta demora de un mes afecta directamente el flujo de caja del negocio.

### 1.3 Objetivo Principal de la Aplicación
Desarrollar una **plataforma digital e interactiva multiplataforma (Web & Móvil)** que agilice y automatice de punta a punta el flujo de levantamiento de datos técnicos en campo, simplificando la captura, acelerando la sincronización en la nube (con soporte offline), reduciendo la brecha operativa a prácticamente cero horas y permitiendo la rápida aprobación y facturación de servicios.

---

## 2. Requerimientos Funcionales (User Stories & Features)

Para asegurar la flexibilidad operativa y responder a la restricción **"Será responsivo"**, todas las interfaces del sistema (Backoffice Web, Visualizadores de Negocio e interfaces de entrada de datos) deben ser **100% responsivas**, adaptándose fluidamente a pantallas de escritorio, portátiles, tablets y móviles con áreas de contacto táctiles confortables (mínimo de 44px para targets de touch en layouts móviles).

### Módulo 1: Gestión de Órdenes de Trabajo (OT) y Programaciones (Backoffice Web)
- **Feature 1.1: Catálogo de Clientes y Equipos**: 
  - Registrar y almacenar datos maestros de Clientes (Razón social, RUC, sedes y contactos autorizados con email y teléfono).
  - Registrar y asociar contratos activos a cada cliente, identificando la cantidad de mantenimientos preventivos planificados en el año (normalmente 3 o 4 por equipo según contrato).
- **Feature 1.2: Registro y Emisión de OTs**:
  - Creación de OTs por el área de Ventas asociando cliente, sede, tipo de servicio (Preventivo, Correctivo, Emergencia) y tipo de equipo a revisar.
  - Al generar una OT, el sistema debe pre-cargar automáticamente los campos básicos de localización, contacto y detalles del contrato.
- **Feature 1.3: Asignación Inteligente de Personal**:
  - Ventas asigna de forma manual o automática a un técnico titular o un equipo de técnicos (por ejemplo, en servicios complejos que requieren dos técnicos por potencia de carga).
  - El sistema detectará las OTs pendientes del técnico titular y el peso de las mismas para evitar sobrecargas de agenda.

### Módulo 2: Portal de Técnicos en Campo e Ingreso de Datos (Móvil / Tablet Multiplataforma)
- **Feature 2.1: Bandeja de Trabajo Responsiva en Campo**:
  - Visualización ordenada de OTs asignadas al técnico según fecha, estado (Pendiente, En Proceso, Completado) y prioridad de criticidad del servicio.
  - El diseño móvil debe priorizar vistas compactas y scannables ajustadas para tablets u operaciones a una sola mano en celulares.
- **Feature 2.2: Formulario Dinámico de Captura Técnica (Ficha de Visita)**:
  - Ingreso estructurado de lecturas según la categoría de equipo (indicadores de batería, potencia de carga, KVA del UPS, mediciones de temperatura de climatización, marcas, bypass activo, etc.).
  - Selección de opciones en listas cerradas de fallos o estados de desgaste de piezas para reducir errores de digitación por parte de los técnicos.
- **Feature 2.3: Captura de Evidencia Fotográfica Condicional**:
  - Habilitar subida de imágenes arrastrándolas de la galería del dispositivo o abriendo la cámara nativa del smartphone/tablet.
  - **Lógica condicional**: El número mínimo de fotografías obligatorias varía según la potencia/KVA del equipo físico (equipos de baja potencia: 4 a 6 fotos de evidencia; equipos de alta potencia y criticidad: mínimo 8 fotos obligatorias para permitir el envío).
- **Feature 2.4: Soporte Lógico de Sincronización Fuera de Línea (Offline)**:
  - Habilidad de almacenamiento local temporal (IndexedDB / Local-Cache) si el técnico pierde conexión en salas de servidores herméticas o con aislamiento por jaulas de Faraday.
  - Los reportes guardados en estado "Offline local" deben re-intentar su carga y subida de imágenes automáticamente al servidor web tan pronto se detecte una conexión activa de red 4G/5G/Wi-Fi en el dispositivo.

### Módulo 3: Flujo de Aprobación, Revisión y Generación de Informes (Supervisor, Ventas, Proyectos)
- **Feature 3.1: Dashboard Multirrol de Bandejas y Seguimiento de Estados**:
  - Pantallas de monitoreo de negocio para Ventas, Supervisor Técnico (Proyectos) y Administradores.
  - Transiciones de estado del informe en tiempo real: `Visita Pendiente` -> `En Proceso de Campo` -> `Sometido a Revisión` -> `Corregido por Técnico` -> `Aprobado por Proyectos` -> `Informado al Cliente (PDF)`.
- **Feature 3.2: Generación Dinámica y Exportación a Formato Word y PDF**:
  - El sistema debe estructurar dinámicamente el Word exportable del informe basado directamente en los datos capturados y las imágenes catalogadas.
  - El supervisor técnico (Proyectos) debe poder descargar este reporte editable para correcciones locales finas o aplicar filtros y comentarios para deponer el informe de vuelta a la bandeja del técnico con notas específicas si hay inconsistencias detectadas.
- **Feature 3.3: Envío Automatizado e Interfaz de Conformidad del Cliente**:
  - Una vez aprobado por el supervisor técnico y verificado por ventas, el sistema genera el informe final PDF de forma automatizada y lo envía al contacto registrado por correo electrónico.
  - Enlace responsivo para que el cliente firme u otorgue una conformidad digital rápida con un solo click.

---

## 3. Arquitectura y Modelo de Datos (Sugerido)

### 3.1 Arquitectura del Sistema
El sistema se propone estructurar bajo una arquitectura de **capas desacopladas (front y back desacoplados)** que garantice extensibilidad total de integraciones futuras (ej. con sistemas ERP o CRM de facturación y cotizaciones):
1. **Front-End**: Aplicación Web de una sola página (SPA) 100% responsiva (Desktop / Tablet / Mobile) que ofrezca tiempos de renderizado inmediatos.
2. **Back-End**: Backend basado en API RESTful organizada por microservicios o controladores independientes de recursos para el despacho ágil de datos JSON.
3. **Database**: Gestor de base de datos relacional para el manejo estruturado de las parametrizaciones cruzadas de contratos, clientes, lecturas y auditorías.

```
       [ Dispositivos Móviles / Tablets ]     [ Computadoras de Escritorio / Laptops ]
                     |                                       |
                     +-------------------+-------------------+
                                         |
                                         v
                         [ Capa de Presentación Responsiva ]
                                         |
                                         v
                            [ Router API RESTful (Servicios) ]
                                         |
                                         v
                         [ Base de Datos Relacional SQL ]
```

### 3.2 Entidades Principales y Atributos Clientes

#### Entidad: `Usuario_Rol` (Roles y Accesos del Sistema)
- `id` (INT, PK, Auto-increment)
- `nombre` (VARCHAR - ej. 'Técnico de Campo', 'Supervisor de Proyectos', 'Área de Ventas', 'Administrador')
- `permisos` (TEXT - JSON de configuración de acceso a bandejas)

#### Entidad: `Usuario` (Usuarios de la Empresa y Personal de Soporte)
- `id` (INT, PK, Auto-increment)
- `email` (VARCHAR, Unique - Email corporativo)
- `password_hash` (VARCHAR)
- `nombre_completo` (VARCHAR)
- `rol_id` (INT, FK referenciando a `Usuario_Rol`)
- `activo` (BOOLEAN, default true)

#### Entidad: `Cliente` (Empresas Clientes de Mantenimiento)
- `id` (INT, PK, Auto-increment)
- `razon_social` (VARCHAR)
- `ruc` (VARCHAR, 11 caracteres)
- `direccion_sede` (VARCHAR)
- `distrito` (VARCHAR)
- `contacto_nombre` (VARCHAR)
- `contacto_email` (VARCHAR)
- `contacto_telefono` (VARCHAR)

#### Entidad: `Contrato` (Acuerdos Comerciales)
- `id` (INT, PK, Auto-increment)
- `cliente_id` (INT, FK referenciando a `Cliente`)
- `tipo_equipo` (VARCHAR - ej. 'UPS', 'Climatización de Precisión', 'Transformador')
- `visitas_planificadas_anuales` (INT, normalmente 3 o 4)
- `fecha_inicio` (DATE)
- `fecha_fin` (DATE)

#### Entidad: `Orden_Trabajo` (OTs de Intervención Técnica)
- `id` (INT, PK, Auto-increment)
- `cliente_id` (INT, FK referenciando a `Cliente`)
- `tipo_mantenimiento` (VARCHAR - ej. 'Preventivo', 'Correctivo', 'Emergencia')
- `equipo` (VARCHAR)
- `potencia_kva` (DECIMAL, nullable - Capacidad técnica del equipo)
- `fecha_programada` (DATE)
- `tecnico_id1` (INT, FK referenciando a `Usuario` - Técnico titular)
- `tecnico_id2` (INT, FK referenciando a `Usuario`, nullable - Técnico de apoyo)
- `estado` (VARCHAR - 'Pendiente', 'En Proceso', 'Enviado para Aprobación', 'Aprobado', 'Facturado')

#### Entidad: `Informe_Tecnico` (Resultado de la Visita)
- `id` (INT, PK, Auto-increment)
- `orden_trabajo_id` (INT, FK referenciando a `Orden_Trabajo`)
- `voltaje_entrada` (DECIMAL, nullable)
- `voltaje_salida` (DECIMAL, nullable)
- `indicadores_bateria` (JSON, nullable - mediciones de celda/temperatura)
- `observaciones_diagnostico` (TEXT)
- `comentarios_adicionales` (TEXT)
- `firma_cliente_conformidad` (TEXT, nullable - Firma digitalizada en base64)
- `creado_en` (TIMESTAMP)
- `modificado_en` (TIMESTAMP)

#### Entidad: `Informe_Foto` (Imágenes y Evidencias de Equipamientos)
- `id` (INT, PK, Auto-increment)
- `informe_tecnico_id` (INT, FK referenciando a `Informe_Tecnico`)
- `url_almacenamiento` (VARCHAR - ruta pública o Base64)
- `descripcion` (VARCHAR)

---

## 4. Stack Técnico y Restricciones

### 4.1 Tecnologías Propuestas en la Reunión de Alineación
- **Front-End**: **Angular** (propuesto por su modularidad y soporte de layouts de componentes).
- **Back-End**: **C# .NET Core** (C-Sharp NetCore) para la API y procesamiento pesado de documentos por su alta performance y adaptabilidad a microservicios desacoplados.
- **Base de Datos**: PostgreSQL o MySQL (Relacionales, gratis y sin costos de licenciamiento corporativo que encarezcan el proyecto).
- **Hosting en la Nube**: **AWS** (Amazon Web Services) o **Azure** (evaluar según coste-efectividad de procesamiento en la nube, prefiriéndose AWS por menores tarifas de arranque sugeridas).

### 4.2 Restricciones del Entorno e Infraestructura
1. **Conectividad de Red Inestable**: El sistema técnico en campo **debe** funcionar en modo local desconectado (offline). El navegador o la app nativa almacena el borrador con las firmas digitales e imágenes localmente y se autogestiona el pool de peticiones REST pendientes al detectar red.
2. **Cómputo Multiplataforma (Responsivo Obligatorio)**: Deberá ser usable fluidamente tanto en tablets como en pantallas de teléfonos inteligentes estándar, con comportamientos de entrada de formulario sumamente ágiles que eviten al técnico digitar cadenas largas de texto, utilizando controles deslizantes, selectores circulares e interruptores táctiles de tamaño accesible.

---

## 5. Task List para Desarrollo (El Backlog)

El siguiente backlog desglosa las tareas precisas y atómicas necesarias para el equipo de desarrollo o agentes de software autónomos.

### Fase 1: Configuración y Base de Datos (Infraestructura Lógica)
- [ ] **Tarea 1.1**: Diseñar scripts DDL de creación de tablas para PostgreSQL con relaciones de claves foráneas indexadas (`Usuario`, `Cliente`, `Contrato`, `Orden_Trabajo`, `Informe_Tecnico`, `Informe_Foto`).
- [ ] **Tarea 1.2**: Implementar el setup inicial de migraciones de base de datos bajo un ORM (Drizzle/Entity Framework) incluyendo inicialización de roles maestros (`Técnico`, `Ventas`, `Proyectos`, `Administrador`).
- [ ] **Tarea 1.3**: Diseñar y sembrar datos semilla (seeding) con 10 tipos bases de equipos críticos de UPS y sistemas de climatización habituales en los contratos de Mafort.
- [ ] **Tarea 1.4**: Configurar el motor de almacenamiento de archivos en la nube (ej., AWS S3 o almacenamiento de Base64 optimizado) para el manejo de evidencias fotográficas capturadas desde campo.

### Fase 2: Backend y Lógica RESTful (Microservicios)
- [ ] **Tarea 2.1**: Desarrollar la autenticación de usuarios y login único corporativo con Azure Active Directory u OAuth corporativo de Office 365 de Mafort.
- [ ] **Tarea 2.2**: Desarrollar los endpoints GET/POST `/api/clientes` y `/api/contratos` para la gestión de clientes en el panel de Ventas.
- [ ] **Tarea 2.3**: Desarrollar el endpoint POST `/api/ordenes` que precargue de forma inteligente los parámetros locales del cliente y asigne personal de campo.
- [ ] **Tarea 2.4**: Desarrollar el endpoint GET `/api/tecnicos/{id}/ordenes` para devolver la lista optimizada de tareas programadas según prioridad del técnico solicitante.
- [ ] **Tarea 2.5**: Desarrollar el endpoint POST `/api/informes` para procesar y consolidar la ficha técnica final cargada desde el cliente móvil, incluyendo firma digital en base64 y URLs de las fotos.
- [ ] **Tarea 2.6**: Desarrollar la lógica condicional en el backend que valide que un informe técnico tenga un mínimo de fotos obligatorias (según la potencia ingresada en la OT) antes de cambiar al estado "Por Aprobar".
- [ ] **Tarea 2.7**: Programar el motor de generación dinámico de documentos de Word (`.docx`) que recubra un formato de diseño oficial de Mafort integrando los metadatos y fotografías en alta definición.
- [ ] **Tarea 2.8**: Programar el servicio de conversión Word-a-PDF y envío automático vía email (`/api/informes/{id}/enviar-cliente`).

### Fase 3: Frontend e Interfaz Responsiva (Visualización)
- [ ] **Tarea 3.1**: Implementar el Layout Base Responsivo del sistema con menús laterales ocultables (drawer) para resoluciones móviles ordinarias e interfaces de visualización unificada en escritorio.
- [ ] **Tarea 3.2**: Desarrollar la Pantalla de Login responsiva con enlaces rápidos e integración de autenticación SSO Office 365, con targets de botón mayores a 44px.
- [ ] **Tarea 3.3**: Diseñar el Dashboard del Área de Ventas mostrando estadísticas rápidas de OTs programadas contra visitas no iniciadas y estatus de facturación de reportes.
- [ ] **Tarea 3.4**: Desarrollar la interfaz móvil del técnico de campo que muestre la bandeja de OTs asignadas priorizadas según color de criticidad comercial.
- [ ] **Tarea 3.5**: Diseñar el Formulario Responsivo Form-Ficha-Técnica para técnicos, integrando controles optimizados (toggle buttons, selectors numéricos, radios) para baterías, UPS y unidades de climatización.
- [ ] **Tarea 3.6**: Implementar funcionalidad de captura y subida responsiva de fotos de campo arrastrándolas con un contenedor drag-and-drop o abriendo directamente la cámara nativa en móviles/tablets.
- [ ] **Tarea 3.7**: Desarrollar los algoritmos locales en Service Workers o IndexedDB en el front-end para guardar borradores de informes y habilitar persistencia técnica offline segura.
- [ ] **Tarea 3.8**: Desarrollar la Pantalla de Revisión de Proyectos (Supervisor) que permita descargar borradores Word o marcar secciones específicas del informe con notas de corrección para el técnico.
- [ ] **Tarea 3.9**: Desarrollar la ventana o portal web responsivo de cara al usuario final para que el Cliente pueda firmar su conformidad de visita técnica directamente con el dedo o puntero táctil de un móvil.
