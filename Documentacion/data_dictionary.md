# DICCIONARIO DE DATOS MAESTRO — PROYECTO GESTIA

> [!IMPORTANT]  
> Este documento representa la **Fuente Única de Verdad (Single Source of Truth)** para el modelo de datos del sistema Gestia. Cualquier modificación en la base de datos (Prisma), las interfaces del Frontend (TypeScript) o los endpoints del Backend (API) debe regirse **estrictamente** por las definiciones detalladas aquí.

## Convenciones de Nomenclatura (Estándar)
Para garantizar la consistencia entre el código JavaScript/TypeScript (Frontend y Node.js) y la Base de Datos, se establece como regla general el uso de **`camelCase`** para todos los nombres de campos y atributos.
- ❌ Incorrecto: `tipo_contrato`, `n_factura`, `monto_inc_igv`
- ✅ Correcto: `tipoContrato`, `numeroFactura`, `montoIncIgv`

---

## 1. ENTIDAD: `User` (Usuarios del Sistema)
Gestiona el acceso y los roles dentro de la plataforma.

| Campo | Tipo | Requerido | Descripción |
|:---|:---|:---:|:---|
| `id` | String | Sí | Identificador único (UUID) |
| `username` | String | Sí | Nombre completo del usuario |
| `email` | String | Sí | Correo electrónico (Debe ser único) |
| `password` | String | Sí | Hash bcrypt de la contraseña |
| `role` | Enum | Sí | Rol: `Administrador`, `Ventas`, `Tecnico`, `Supervisor`, `Cliente` |
| `estado` | Enum | Sí | Estado de la cuenta: `Activo`, `Suspendido` |
| `area` | String | Sí | Área o departamento al que pertenece |
| `ultimoIngreso` | DateTime | No | Fecha y hora del último login exitoso |
| `creadoEn` | DateTime | Sí | Fecha de creación del registro |
| `clientId` | String | No | FK a `Client.id` (Solo si el rol es `Cliente`) |
| `allowedModules` | JSON (Array) | No | Lista de módulos a los que tiene acceso en el dashboard |

---

## 2. ENTIDAD: `Client` (Clientes / Empresas)
Empresas a las cuales Gestia les presta servicios.

| Campo | Tipo | Requerido | Descripción |
|:---|:---|:---:|:---|
| `id` | String | Sí | Identificador único (UUID) |
| `razonSocial` | String | Sí | Razón social de la empresa |
| `ruc` | String | Sí | Número de RUC (11 dígitos) |
| `direccionSede` | String | Sí | Dirección física principal o sede del servicio |
| `distrito` | String | Sí | Distrito de ubicación |
| `contactoNombre` | String | Sí | Nombre del contacto principal (SLA) |
| `contactoEmail` | String | Sí | Correo electrónico del contacto |
| `contactoTelefono` | String | Sí | Teléfono o celular del contacto |

---

## 3. ENTIDAD: `Contract` (Contratos de Mantenimiento Anual)
Contratos operativos que dictan las visitas anuales de mantenimiento.

| Campo | Tipo | Requerido | Descripción |
|:---|:---|:---:|:---|
| `id` | String | Sí | Identificador único (UUID) |
| `clientId` | String | Sí | FK a `Client.id` |
| `tipoEquipo` | Enum | Sí | Ej: `UPS`, `Climatización de Precisión`, etc. |
| `visitasAnuales` | Int | Sí | Número de mantenimientos preventivos al año |
| `fechaInicio` | Date | Sí | Fecha de inicio de vigencia |
| `fechaFin` | Date | Sí | Fecha de término de vigencia |

---

## 4. ENTIDAD: `OT` (Órdenes de Trabajo Técnicas)
Representa el trabajo físico que los técnicos realizan en campo.

| Campo | Tipo | Requerido | Descripción |
|:---|:---|:---:|:---|
| `id` | String | Sí | Código de la OT (Ej: OT-001) |
| `clientId` | String | Sí | FK a `Client.id` |
| `contratoId` | String | No | FK a `Contract.id` (Si aplica) |
| `tipoMantenimiento` | Enum | Sí | `Preventivo`, `Correctivo`, `Emergencia` |
| `tipoEquipo` | Enum | Sí | Congruente con el contrato |
| `potenciaKva` | Float | Sí | Potencia del equipo en KVA (determina nro. de fotos) |
| `fechaProgramada` | Date | Sí | Fecha agendada para la visita |
| `horaProgramada` | Time | No | Hora de inicio planificada |
| `horaFinProgramada` | Time | No | Hora de término planificada |
| `horaInicioServicio` | Time | No | Hora real en que el técnico inició (Check-in) |
| `horaFinServicio` | Time | No | Hora real en que el técnico terminó (Check-out) |
| `tecnicoTitularId` | String | No | FK a `User.id` del técnico principal |
| `tecnicoTitular` | String | Sí | Nombre del técnico principal (Denormalizado para velocidad) |
| `tecnicoApoyoId` | String | No | FK a `User.id` del técnico de apoyo |
| `tecnicoApoyo` | String | No | Nombre del técnico de apoyo |
| `tecnicosAdicionalesIds` | JSON (Array)| No | Array de FKs de técnicos extra |
| `tecnicosAdicionalesNombres`| JSON (Array)| No | Array de nombres de técnicos extra |
| `estado` | Enum | Sí | `Creada`, `Programada`, `Trabajo en Ejecución`, `En Revisión`, `Aprobada`, `Firmada`, `Cerrada` |
| `origen` | Enum | No | Origen de la OT: `Venta`, `Contrato`, `Emergencia` |
| `otFinancieraId` | String | No | FK a `OrdenTrabajoLinea.id` (Enlace con finanzas) |
| `costoEstimadoUsd` | Float | No | Costo deducible de la bolsa del contrato comercial |

---

## 5. ENTIDAD: `TechnicalReport` (Informe Técnico / Ficha de Visita)
Datos levantados en campo que alimentan el PDF final. *Relación 1:1 con `OT`*.

| Campo | Tipo | Requerido | Descripción |
|:---|:---|:---:|:---|
| `id` | String | Sí | Identificador único (UUID) |
| `otId` | String | Sí | FK a `OT.id` (Unique) |
| `voltajeEntrada` | Float | Sí | Medición eléctrica general |
| `voltajeSalida` | Float | Sí | Medición eléctrica general |
| `indicadoresBateria` | JSON | Sí | Estructura: nivelCarga, temperaturaC, estadoCeldas, bypassActivo |
| `observacionesDiagnostico`| String | Sí | Texto libre del técnico |
| `comentariosAdicionales` | String | Sí | Texto libre del técnico |
| `firmaCliente` | String | No | Base64 de la firma en canvas HTML5 |
| `correccionesSupervisor` | String | No | Feedback del supervisor si rechaza el informe |
| `offlineDirty` | Boolean | No | Flag de sincronización offline |
| `fotos` | JSON (Array)| Sí | Array de Base64 o URLs de evidencia en campo |
| *(Campos Formato PDF)* | | | |
| `accionesRealizadas` | JSON (Array)| No | Lista de checklist de actividades hechas |
| `pasos` | JSON | No | Cronograma y estado del equipo por fases |
| `caracteristicas` | JSON | No | Diccionario clave-valor técnico del equipo |
| `medicionesEntrada` | JSON | No | Voltaje/Frecuencia L-N, L-L detallado |
| `medicionesSalida` | JSON | No | Voltaje/Frecuencia L-N, L-L detallado |
| `recomendaciones` | JSON (Array)| No | Sugerencias finales para el cliente |
| `creadoEn` | DateTime | Sí | Auditoría |
| `modificadoEn` | DateTime | Sí | Auditoría |

---

## 6. ENTIDAD: `OrdenTrabajoLinea` (OT Financiera / Seguimiento Comercial)
> [!TIP]  
> **RESOLUCIÓN DE CONFLICTO**: Se ha unificado `n_factura` y `factura` bajo el nombre `numeroFactura`. Se han incorporado los 11 campos "perdidos" y todo se ha pasado a `camelCase`.

Seguimiento financiero, facturación y estados de cobro.

| Campo | Tipo | Requerido | Descripción |
|:---|:---|:---:|:---|
| `id` | String | Sí | Identificador único |
| `anio` | Int | Sí | Año contable |
| `otMarco` | Int | Sí | Número de OT marco asociada |
| `ot` | String | Sí | Código interno de OT comercial |
| `mes` | String | Sí | Mes contable |
| `fecha` | Date | Sí | Fecha de registro |
| `nombreSolicitante` | String | Sí | Quien solicitó el servicio |
| `clientId` | String | No | FK a `Client.id` |
| `razonSocial` | String | Sí | Denormalizado de Cliente |
| `empresa` | String | Sí | Unidad de negocio que factura |
| `descripcion` | String | Sí | Resumen del servicio vendido |
| `numeroCotizacion` | String | No | Número de cotización comercial (`n_cotizacion`) |
| `numeroOcOs` | String | No | Orden de Compra / Orden de Servicio |
| `simboloMoneda` | String | Sí | `$` o `S/` |
| `montoMarcoSinIgv` | Float | Sí | Importe bolsa total |
| `montoMarcoIncIgv` | Float | Sí | Importe bolsa con impuestos |
| `subImporteSinIgv` | Float | Sí | Costo particular de esta línea (OT) sin IGV |
| `subImporteIncIgv` | Float | Sí | Costo particular de esta línea (OT) con IGV |
| `totalUsd` | Float | Sí | Conversión estandarizada a dólares |
| `anioProgFacturacion` | Int | Sí | Año proyectado para cobro |
| `mesProgServicio` | String | Sí | Mes proyectado de ejecución |
| `diaProgServicio` | Int | No | **(NUEVO)** Día proyectado de ejecución |
| `mesProgFacturacion` | String | Sí | Mes proyectado para emitir factura |
| `diaProgFacturacion`| Int | No | **(NUEVO)** Día proyectado para emitir factura |
| `tipoVenta` | Enum | Sí | `MANTENIMIENTO`, `REPARACION`, `ALQUILER`, etc. |
| `pendiente` | Enum | Sí | Estado de ejecución: `POR EJECUTAR`, `EJECUTADO` |
| `estado` | Enum | Sí | Estado financiero: `POR FACTURAR`, `FACTURADO` |
| `numeroFactura` | String | No | **(UNIFICADO)** Reemplaza `n_factura` y `factura` |
| `anioFactura` | Int | No | **(NUEVO)** Año de la factura física |
| `mesFactura` | String | No | **(NUEVO)** Mes de la factura física |
| `fechaFactura` | Date | No | **(NUEVO)** Fecha exacta de facturación |
| `numeroGuiaInforme` | String | No | **(NUEVO)** Guía de remisión / Nro. de informe |
| `observacion` | String | No | **(NUEVO)** Notas internas de facturación |
| `seguimiento` | String | No | **(NUEVO)** Status de tracking |
| `tipoContratacion` | Enum | No | **(NUEVO)** `CONTRATO`, `OC`, `OS`, `CORREO` |
| `estatus` | JSON | No | Array de ComentarioEstatus `{fecha, autor, texto}` |
| `comercialId` | String | No | FK a `User.id` (Vendedor) |
| `comercial` | String | Sí | Nombre del vendedor |
| `creadoPor` | String | Sí | **(NUEVO)** Usuario que registró la línea |
| `modificadoPor` | String | No | **(NUEVO)** Último usuario en editar |
| `otTecnicaId` | String | No | FK a `OT.id` (Enlace de retorno a campo) |
| `listaParaFacturar` | Boolean| No | Flag automático cuando OT Técnica está "Firmada" |

---

## 7. ENTIDAD: `ContratoNuevo` (Contrato Comercial / Bolsa de Dinero)
> [!TIP]  
> **RESOLUCIÓN DE CONFLICTO**: Se elimina `tipo_contract` completamente. Solo existirá `tipoContrato`.

Gestiona el presupuesto y saldo disponible ("bolsa") del cual consumen las Órdenes de Trabajo.

| Campo | Tipo | Requerido | Descripción |
|:---|:---|:---:|:---|
| `id` | String | Sí | Identificador único |
| `anio` | Int | No | Año del contrato |
| `numeroContrato` | String | No | Código oficial del documento |
| `comercialId` | String | No | FK a `User.id` (Vendedor) |
| `comercial` | String | No | Nombre del vendedor |
| `clientId` | String | No | FK a `Client.id` |
| `cliente` | String | No | Nombre de la empresa |
| `montoSinIgv` | Float | No | Valor total sin impuestos |
| `montoIncIgv` | Float | No | Valor total con impuestos |
| `presupuestoTotalUsd`| Float | No | Bolsa global estandarizada en dólares |
| `saldoDisponibleUsd` | Float | No | Bolsa remanente en dólares (Actualizado por triggers/lógica) |
| `estado` | Enum | No | `VIGENTE`, `TERMINADO`, `ANULADO` |
| `tipoServicio` | String | No | Detalle del servicio amparado |
| `tipoContrato` | String | No | **(UNIFICADO)** Categoría del contrato |
| `fechaInicio` | Date | No | Vigencia desde |
| `fechaFin` | Date | No | Vigencia hasta |

---

## 8. ENTIDADES ADICIONALES (TargetVentas y UserActivityLog)

**`TargetVenta` (Metas Mensuales)**
- `id`, `anio`, `mesNum`, `mes`, `targetVentasUsd`

**`UserActivityLog` (Auditoría de Acciones)**
- `id`, `timestamp`, `userEmail`, `action`, `details`, `ipAddress`
