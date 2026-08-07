# DICCIONARIO DE DATOS MAESTRO — PROYECTO GESTIA

> [!IMPORTANT]
> La **única fuente de verdad (Single Source of Truth)** del modelo de datos
> es el archivo `prisma/schema.prisma`. Cualquier campo presente en la base de
> datos, las interfaces TypeScript (`src/types.ts`) o los payloads de la API
> (server.ts) **debe existir, con el mismo nombre, en el schema Prisma**. Los
> tipos TS en `src/types.ts` son un reflejo verbatim del schema y se mantienen
> sincronizados en cada modificación.
>
> **POLÍTICA DE NO VOLÁTILES**: ningún campo que necesite sobrevivir a una
> recarga del navegador o sincronización offline puede mantenerse solo en el
> frontend. Si un dato es relevante para el negocio, vive en el schema; si solo
> es efímero/computable, no debe almacenarse en ningún tipo ni formulario.
>
> **Aliases `@map`**: el schema usa `snake_case` para los nombres de columna DB
> y ocasionalmente expone un alias legacy mediante `@map(...)`. El frontend NO
> usa los aliases: siempre se refiere a los campos por su nombre canónico en el
> schema (sin `@map`). Ejemplo:
> - Schema: `n_factura String? @map("factura")` → TS/API/UI usan `n_factura`.
> - Schema: `fecha_factura String? @map("fecha_facturacion")` → TS/API/UI
>   usan `fecha_factura`.

---

## 1. `User` — Usuarios del sistema

Fuente: `prisma/schema.prisma` → `model User`.

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String | string | Sí | UUID |
| `username` | String | string | Sí | Nombre completo |
| `email` | String @unique | string | Sí | Correo único |
| `password` | String | string | Sí | Hash bcrypt (solo backend) |
| `role` | String | union literal | Sí | `Administrador` \| `Ventas` \| `Tecnico` \| `Supervisor` \| `Cliente` |
| `estado` | String | union literal | Sí | `Activo` \| `Suspendido` |
| `area` | String | string | Sí | Área |
| `ultimoIngreso` | String? | string? | No | Último login |
| `creadoEn` | String | string | Sí | Fecha creación |
| `clientId` | String? | string? | No | FK a `Client.id` (rol Cliente) |
| `allowedModules` | Json? | string[]? | No | Módulos accesibles |

## 2. `Client` — Clientes / Empresas

Fuente: `prisma/schema.prisma` → `model Client`.

| Campo | Tipo | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String | string | Sí | UUID |
| `razonSocial` | String | string | Sí | Razón social |
| `ruc` | String | string | Sí | RUC (11 dígitos) |
| `direccionSede` | String | string | Sí | Sede principal |
| `distrito` | String | string | Sí | Distrito |
| `contactoNombre` | String | string | Sí | Contacto principal (SLA) |
| `contactoEmail` | String | string | Sí | Email del contacto |
| `contactoTelefono` | String | string | Sí | Teléfono |
| `pais` | String? | string? | No | País |
| `provincia` | String? | string? | No | Provincia |
| `contactos` | Json? | contacto[]? | No | Array `{nombre,email,telefono}` |

## 3. `Contract` — Contratos técnicos anuales heredados

Fuente: `prisma/schema.prisma` → `model Contract`.

| Campo | Tipo | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String | string | Sí | UUID |
| `clientId` | String | string | Sí | FK `Client.id` |
| `tipoEquipo` | String | EquipmentType | Sí | UPS, Climatización, etc. |
| `visitasAnuales` | Int | number | Sí | Preventivos por año |
| `fechaInicio` | String | string | Sí | Inicio vigencia |
| `fechaFin` | String | string | Sí | Fin vigencia |

## 4. `OT` — Órdenes de Trabajo técnicas

Fuente: `prisma/schema.prisma` → `model OT`.

| Campo | Tipo | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String | string | Sí | Código OT |
| `clientId` | String | string | Sí | FK `Client.id` |
| `tipoMantenimiento` | String | ServiceType | Sí | Preventivo / Correctivo / Emergencia |
| `tipoEquipo` | String | EquipmentType | Sí | Equipo al que aplica |
| `potenciaKva` | Float | number | Sí | Potencia (define nro. de fotos) |
| `equipoId` | String? | string? | No | FK `Equipo.id` |
| `fechaProgramada` | String | string | Sí | Fecha visita |
| `horaProgramada` | String? | string? | No | Hora inicio planificada |
| `horaFinProgramada` | String? | string? | No | Hora fin planificada |
| `horaInicioServicio` | String? | string? | No | Real check-in |
| `horaFinServicio` | String? | string? | No | Real check-out |
| `tecnicoTitularId` | String? | string? | No | FK `User.id` (titular) |
| `tecnicoApoyoId` | String? | string? | No | FK `User.id` (apoyo) |
| `tecnicoTitular` | String | string | Sí | Nombre titular (denorm.) |
| `tecnicoApoyo` | String? | string? | No | Nombre apoyo (denorm.) |
| `tecnicosAdicionalesIds` | Json? | string[]? | No | Array FKs extras |
| `tecnicosAdicionalesNombres` | Json? | string[]? | No | Array nombres extras |
| `estado` | String | OTStatus | Sí | Ver enum OTStatus |
| `origen` | String? | OTOrigin? | No | Venta/Contrato/Emergencia/Correctiva/Interna |
| `otFinancieraId` | String? | string? | No | FK `OrdenTrabajoLinea.id` |
| `costo_estimado_usd` | Float? | number? | No | Costo deducido de la bolsa |
| `contratoId` | String? | string? | No | FK `ContratoNuevo.id` |
| `adendaId` | String? | string? | No | FK `ContratoAmpliacion.id` |

**Nota**: los campos `horaSalida` y `horaLlegadaSitio` que existían en TS como
helpers de UI no están en el schema y por la política de no volátiles se
eliminan de los types. Si se requieren, deben añadirse al schema.

## 5. `TechnicalReport` — Informe técnico

Fuente: `prisma/schema.prisma` → `model TechnicalReport`. El tipo TS aplica
shapes rich para PDF (`pasos`, `medicionesEntrada`, etc.) que en el schema son
`Json?`. Se mantiene el mapeo TS con shapes tipados mientras el schema los
persista como `Json?`.

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id | string | Sí | UUID |
| `otId` | String | string | Sí | FK `OT.id` |
| `equipoId` | String? | string? | No | null = legacy, poblado = per-equipo |
| `voltajeEntrada` | Float | number | Sí | Medición |
| `voltajeSalida` | Float | number | Sí | Medición |
| `indicadoresBateria` | Json | shape | Sí | `{nivelCarga,temperaturaC,estadoCeldas,bypassActivo}` |
| `observacionesDiagnostico` | String | string | Sí | Texto técnico |
| `comentariosAdicionales` | String | string | Sí | Texto libre |
| `firmaCliente` | String? | string? | No | Ruta proxy S3 (`/api/photos/reports/OT-*/...-firma.jpg`) |
| `correccionesSupervisor` | String? | string? | No | Feedback supervisor |
| `creadoEn` | String | string | Sí | Auditoría |
| `modificadoEn` | String | string | Sí | Auditoría |
| `offlineDirty` | Boolean? | boolean? | No | Flag sincronización |
| `fotos` | Json (array) | string[] | Sí | Rutas proxy S3 (`/api/photos/reports/OT-*/...`) |
| `informeN` | String? | string? | No | N° informe (PDF) |
| `hojaServicioN` | String? | string? | No | N° hoja servicio (PDF) |
| `asunto` | String? | string? | No | Asunto (PDF) |
| `fechaServicio` | String? | string? | No | Fecha servicio (PDF) |
| `horaInicio` | String? | string? | No | Hora inicio (PDF) |
| `tecnico1` | String? | string? | No | Técnico 1 (PDF) |
| `tecnico2` | String? | string? | No | Técnico 2 (PDF) |
| `antecedentes` | String? | string? | No | Antecedentes (PDF) |
| `accionesRealizadas` | Json? | string[]? | No | Checklist |
| `pasos` | Json? | shape? | No | Cronograma fases |
| `caracteristicas` | Json? | Record<string,string>? | No | K/V técnico |
| `fotosLabeled` | Json? | array? | No | Fotos etiquetadas |
| `medicionesEntrada` | Json? | shape? | No | V/I/F L-N y L-L |
| `medicionesSalida` | Json? | shape? | No | V/I/F L-N y L-L |
| `diagnosticoGabinete` | Json? | shape? | No | Gabinete |
| `revisionNormas` | Json? | shape? | No | Normas |
| `recomendaciones` | Json? | string[]? | No | Recomendaciones |
| `tipoServicio` | String? | string? | No | Tipo de servicio formateado (PDF) |
| `horaFin` | String? | string? | No | Hora fin del servicio (PDF) |
| `panoramaFoto` | String? | string? | No | Foto panorámica principal |
| `pasosLista` | Json? | array? | No | Lista de pasos con estado |

## 6. `OrdenTrabajoLinea` — OT Financiera / Cuota comercial

Fuente: `prisma/schema.prisma` → `model OrdenTrabajoLinea`.

> [!WARNING]
> **Campos removidos en homologación**: los siguientes campos existían en
> `types.ts` y se usaban en UI, pero **NO estaban en el schema Prisma**. El
> endpoint `/api/sync` los descartaba silenciosamente, causando datos
> inconsistentes. Por la política de no volátiles se eliminan de TS y UI:
>
> - `nro_guia_informe`, `observacion`, `seguimiento` (texto libre efímero)
> - `tipo_contratacion` (clasificación no persistida)
> - `creadoPor`, `creadoEn`, `modificadoPor`, `modificadoEn` (auditoría efímera)
> - `anio_factura`, `mes_factura` (derivables de `fecha_factura`)
> - `dia_prog_servicio`, `dia_prog_facturacion` (no existentes; causaban
>   rechazo silencioso de Prisma en el sync)
>
> Si se requieren nuevamente, deben **añadirse al schema Prisma** y propagarse
> desde types.ts hasta el UI.

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id | string | Sí | UUID |
| `anio` | Int | number | Sí | Año contable |
| `ot_marco` | Int | number | Sí | Nro. OT marco |
| `ot` | String | string | Sí | Código "{ot_marco}-{correlativo}" |
| `mes` | String | string | Sí | Mes contable |
| `fecha` | String | string | Sí | Fecha registro (YYYY-MM-DD) |
| `nombre_solicitante` | String | string | Sí | Solicitante |
| `clientId` | String? | string? | No | FK `Client.id` |
| `razon_social` | String | string | Sí | Denorm. cliente |
| `empresa` | String | string | Sí | Empresa que factura |
| `descripcion` | String | string | Sí | Resumen servicio |
| `n_cotizacion` | String? | string? | No | Nro. cotización |
| `n_oc_os` | String? | string? | No | OC/OS |
| `simbolo_moneda` | String | string | Sí | `$` o `S/` |
| `monto_marco_sin_igv` | Float | number | Sí | Bolsa sin IGV |
| `monto_marco_inc_igv` | Float | number | Sí | Bolsa con IGV |
| `sub_importe_sin_igv` | Float | number | Sí | Cuota sin IGV |
| `sub_importe_inc_igv` | Float | number | Sí | Cuota con IGV |
| `total_usd` | Float | number | Sí | Conversión USD |
| `anio_prog_facturacion` | Float | number | Sí | Año proy. cobro |
| `mes_prog_servicio` | String | string | Sí | Mes proy. servicio |
| `mes_prog_facturacion` | String | string | Sí | Mes proy. factura |
| `n_factura` | String? @map("factura") | string? | No | **Canónico**: alias DB `factura` |
| `tipo_venta` | String | string | Sí | Tipo de venta |
| `comercial` | String | string | Sí | Vendedor (denorm.) |
| `comercialId` | String? | string? | No | FK `User.id` |
| `area` | String? | string? | No | Área |
| `periodo` | String? | string? | No | Periodo |
| `h2h_bcp` | String? | string? | No | H2H BCP |
| `pendiente` | String | union literal | Sí | `EJECUTADO` \| `POR EJECUTAR` \| `ANULADO` \| `FACTURADO` |
| `oc` | String? | string? | No | OC |
| `estado` | String | union literal | Sí | `FACTURADO` \| `POR FACTURAR` \| `ANULADO` |
| `fecha_factura` | String? @map("fecha_facturacion") | string? | No | **Canónico**: alias DB `fecha_facturacion` |
| `vencimiento_factura` | String? | string? | No | Vencimiento factura |
| `monto_factura_inc_igv` | Float? | number? | No | Monto factura |
| `pagado` | String? | string? | No | Estado pago |
| `fecha_pago` | String? | string? | No | Fecha pago |
| `dias_pago` | Float? | number? | No | Días pago |
| `detraccion` | String? | string? | No | Detracción |
| `fecha_detraccion` | String? | string? | No | Fecha detracción |
| `dias_detraccion` | Float? | number? | No | Días detracción |
| `bcp` | String? | string? | No | BCP |
| `listaParaFacturar` | Boolean? | boolean? | No | Flag OT firmada |
| `otTecnicaId` | String? | string? | No | FK `OT.id` (retorno a campo) |
| `estatus` | Json? | ComentarioEstatus[]? | No | Bitácora efímera (ver política) |
| `contratoId` | String? | string? | No | FK `ContratoNuevo.id` |
| `adendaId` | String? | string? | No | FK `ContratoAmpliacion.id` |
| `equipoId` | String? | string? | No | FK `Equipo.id` |

> [!NOTE]
> `estatus` está en el schema como `Json?` y por tanto se persiste. Sí se
> permite en TS.

## 7. `ContratoNuevo` — Contrato comercial (bolsa de dinero)

Fuente: `prisma/schema.prisma` → `model ContratoNuevo`. El tipo TS `Contrato`
es el reflejo de este modelo.

| Campo | Tipo | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id | string | Sí | UUID |
| `anio` | Int? | number? | No | Año |
| `n_contrato` | String? | string? | No | Nro. contrato |
| `comercial` | String? | string? | No | Vendedor |
| `comercialId` | String? | string? | No | FK `User.id` |
| `cliente` | String? | string? | No | Nombre cliente (denorm.) |
| `clientId` | String? | string? | No | FK `Client.id` |
| `detalle` | String? | string? | No | Detalle servicio |
| `monto_sin_igv` | Float? | number? | No | Total sin IGV |
| `monto_inc_igv` | Float? | number? | No | Total con IGV |
| `monto_facturar_sin_igv` | Float? | number? | No | Pendiente facturar sin IGV |
| `monto_facturar_inc_igv` | Float? | number? | No | Pendiente facturar con IGV |
| `monto_facturado_sin_igv` | Float? | number? | No | Facturado sin IGV (recalculado) |
| `monto_facturado_inc_igv` | Float? | number? | No | Facturado con IGV (recalculado) |
| `por_facturar_sin_igv` | Float? | number? | No | Por facturar sin IGV |
| `por_facturar_inc_igv` | Float? | number? | No | Por facturar con IGV |
| `monto_pagado_sin_igv` | Float? | number? | No | Pagado sin IGV |
| `monto_pagado_inc_igv` | Float? | number? | No | Pagado con IGV |
| `pendiente_pago_sin_igv` | Float? | number? | No | Pendiente pago sin IGV |
| `pendiente_pago_inc_igv` | Float? | number? | No | Pendiente pago con IGV |
| `vence` | String? | string? | No | Vencimiento |
| `oc` | String? | string? | No | OC |
| `h2h_bcp` | String? | string? | No | H2H BCP |
| `estado` | String? | string? | No | `VIGENTE` \| `TERMINADO` \| `ANULADO` |
| `tipo_contract` | String? | string? | No | Tipo contract (legacy) |
| `tipo_contrato` | String? | string? | No | Tipo contrato |
| `fecha_inicio` | String? | string? | No | Vigencia desde |
| `fecha_fin` | String? | string? | No | Vigencia hasta |
| `fecha_fin_original` | String? | string? | No | Fin original (pre-adenda) |
| `comentarios` | String? | string? | No | Comentarios |
| `presupuesto_total_usd` | Float? | number? | No | Bolsa USD |
| `saldo_disponible_usd` | Float? | number? | No | Saldo USD (recalculado) |
| `monto_original` | Float? | number? | No | Monto original |
| `moneda` | String? | string? | No | Moneda |
| `pdf_url` | String? | string? | No | PDF firmado (S3) |
| `ampliaciones` | ContratoAmpliacion[] | ContratoAmpliacion[]? | No | Adendas |
| `equipos` | Equipo[] | Equipo[]? | No | Equipos del contrato |

## 8. `ContratoAmpliacion` — Adendas

Fuente: `prisma/schema.prisma` → `model ContratoAmpliacion`.

| Campo | Tipo | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @default(uuid()) | string | Sí | UUID |
| `codigo` | String | string | Sí | Código adenda |
| `contratoId` | String | string | Sí | FK `ContratoNuevo.id` |
| `monto` | Float | number | Sí | Monto adenda |
| `fecha_inicio` | String | string | Sí | Inicio vigencia |
| `fecha_fin` | String | string | Sí | Fin vigencia |
| `adenda_pdf_url` | String? | string? | No | PDF (S3) |
| `comentarios` | String? | string? | No | Comentarios |
| `creadoEn` | DateTime @default(now()) | string? | Sí | Auditoría |
| `equiposAdenda` | EquipoAmpliacion[] | EquipoAmpliacion[]? | No | Equipos |

## 9. `Equipo`, `EquipoAmpliacion`, `ServicioEquipo`, `OtEquipoAsignacion`

Fuente: `prisma/schema.prisma`. Los tipos TS en `src/types.ts` son verbatim.

### 9.1 `Equipo` — Inventario de equipos

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id @default(uuid()) | string | Sí | UUID |
| `codigo` | String @unique | string | Sí | Código único |
| `tipo` | String | string | Sí | Tipo de equipo |
| `marca` | String? | string? | No | Marca |
| `modelo` | String? | string? | No | Modelo |
| `serie` | String? | string? | No | N° serie |
| `potenciaKva` | Float? | number? | No | Potencia |
| `ubicacion` | String? | string? | No | Ubicación |
| `clienteId` | String? | string? | No | FK `Client.id` (soft) |
| `contratoId` | String? | string? | No | FK `ContratoNuevo.id` |
| `contrato` | ContratoNuevo? | Contrato? | No | Relación (onDelete: SetNull) |
| `estado` | String @default("Operativo") | string | Sí | Estado operativo |
| `fotos` | Json? | string[]? | No | Fotos (Base64) |
| `especificaciones` | Json? | Record<string,string>? | No | K/V técnico |
| `creadoEn` | DateTime @default(now()) | string | Sí | Auditoría |
| `actualizadoEn` | DateTime @updatedAt | string | Sí | Auditoría |
| `adensasOrigen` | EquipoAmpliacion[] | EquipoAmpliacion[]? | No | Adendas que incluyen este equipo |
| `servicios` | ServicioEquipo[] | ServicioEquipo[]? | No | Servicios asociados |

> [!WARNING]
> **Typo conocido**: el campo `adensasOrigen` debiera ser `adendasOrigen` (falta una
> "d"). El typo es **consistente** en schema, `src/types.ts`, `server.ts` (includes
> Prisma) y componentes (`ModalCrearOtMarco.tsx`, `VentasView.tsx`). No rompe
> runtime. Renombrarlo requiere migración DB + actualizar 5-6 archivos; se deja
> pendiente por riesgo/beneficio.

### 9.2 `EquipoAmpliacion` — Pivote adenda ↔ equipo

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id @default(uuid()) | string | Sí | UUID |
| `adendaId` | String | string | Sí | FK `ContratoAmpliacion.id` |
| `adenda` | ContratoAmpliacion | ContratoAmpliacion | Sí | Relación (onDelete: Cascade) |
| `equipoId` | String | string | Sí | FK `Equipo.id` |
| `equipo` | Equipo | Equipo | Sí | Relación (onDelete: Cascade) |
| `creadoEn` | DateTime @default(now()) | string | Sí | Auditoría |

Restricciones: `@@unique([adendaId, equipoId])`.

### 9.3 `ServicioEquipo` — Servicios efectuados a un equipo

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id @default(uuid()) | string | Sí | UUID |
| `equipoId` | String | string | Sí | FK `Equipo.id` |
| `equipo` | Equipo | Equipo | Sí | Relación (onDelete: Cascade) |
| `otId` | String | string | Sí | FK `OT.id` (soft) |
| `fecha` | String | string | Sí | Fecha servicio |
| `tipo` | String | string | Sí | Tipo servicio |
| `estado_post` | String | string | Sí | Estado posterior |
| `tecnicoTitular` | String | string | Sí | Técnico titular |
| `hallazgos` | String? | string? | No | Hallazgos |
| `recomendaciones` | String? | string? | No | Recomendaciones |
| `fotos` | Json? | string[]? | No | Fotos (Base64) |
| `creadoEn` | DateTime @default(now()) | string | Sí | Auditoría |

Restricciones: `@@index([equipoId])`.

### 9.4 `OtEquipoAsignacion` — Asignación OT ↔ equipo (multi-equipo)

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id @default(cuid()) | string | Sí | CUID |
| `otId` | String | string | Sí | FK `OT.id` (soft) |
| `equipoId` | String | string | Sí | FK `Equipo.id` (soft) |
| `tecnicoTitularId` | String? | string? | No | FK `User.id` (titular) |
| `tecnicoTitular` | String? | string? | No | Nombre titular (denorm.) |
| `tecnicoApoyoId` | String? | string? | No | FK `User.id` (apoyo) |
| `tecnicoApoyo` | String? | string? | No | Nombre apoyo (denorm.) |
| `fecha` | String? | string? | No | Fecha |
| `hora` | String? | string? | No | Inicio |
| `horaFin` | String? | string? | No | Fin |
| `creadoEn` | DateTime @default(now()) | string | Sí | Auditoría |

Restricciones: `@@unique([otId, equipoId])`, `@@index([otId])`.

## 10. Auxiliares: `TipoContrato`, `TargetVenta`, `UserActivityLog`, ubigeo

Fuente: `prisma/schema.prisma`. Sin discrepancias con TS.

### 10.1 `TipoContrato` — Catálogo de tipos de contrato

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id @default(uuid()) | string | Sí | UUID |
| `name` | String @unique | string | Sí | Nombre del tipo (único) |

> [!NOTE]
> `TipoContrato` es un catálogo simple (id + name). No tiene relaciones
> declaradas; `ContratoNuevo.tipo_contrato` stores el nombre como `String?` (soft
> FK al `name`). No aparece referenciado desde `ContratoNuevo` via `@relation`.

### 10.2 `TargetVenta` — Metas comerciales

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id | string | Sí | ID |
| `anio` | Int | number | Sí | Año |
| `mes_num` | Int | number | Sí | N° mes (1-12) |
| `mes` | String | string | Sí | Nombre mes |
| `target_ventas_usd` | Float | number | Sí | Meta USD |

### 10.3 `UserActivityLog` — Auditoría de acciones de usuario

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id | string | Sí | ID |
| `timestamp` | String | string | Sí | Marca temporal |
| `userEmail` | String | string | Sí | Email usuario |
| `action` | String | string | Sí | Acción realizada |
| `details` | String | string | Sí | Detalles |
| `ipAddress` | String | string | Sí | IP origen |

### 10.4 Ubigeo Perú: `Pais` / `Provincia` / `Distrito`

Catálogo geográfico en cascada. Relaciones con `onDelete: Cascade`.

**`Pais`**

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id | string | Sí | ID |
| `nombre` | String | string | Sí | Nombre país |
| `provincias` | Provincia[] | Provincia[]? | No | Relación 1:N |

**`Provincia`**

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id | string | Sí | ID |
| `nombre` | String | string | Sí | Nombre provincia |
| `paisId` | String | string | Sí | FK `Pais.id` |
| `pais` | Pais | Pais | Sí | Relación (onDelete: Cascade) |
| `distritos` | Distrito[] | Distrito[]? | No | Relación 1:N |

**`Distrito`**

| Campo | Tipo Prisma | TS | Req. | Descripción |
|:---|:---|:---|:---:|:---|
| `id` | String @id | string | Sí | ID |
| `nombre` | String | string | Sí | Nombre distrito |
| `provinciaId` | String | string | Sí | FK `Provincia.id` |
| `provincia` | Provincia | Provincia | Sí | Relación (onDelete: Cascade) |

---

## Lineamientos principales

1. **Schema primero**. Toda nueva columna o cambio de tipo se inicia en
   `prisma/schema.prisma`. Después se refleja en `src/types.ts` con el mismo
   nombre y tipo equivalente.
2. **Sin aliases en el frontend**. Las columnas con `@map("...")` son un alias
   de migración legacy a nivel DB. La API los expone con su nombre canónico
   (sin `@map`), y el TS/UI los consumen así. Ejemplo: front usa `n_factura`,
   jamás `factura`.
3. **Nada efímero en TS/UI**. Si un dato no está en el schema, no debe vivir
   en types.ts ni en formularios. Cualquier dato audible/computable debe
   derivarse al vuelo desde campos persistidos (ej. año/mes derivados de
   `fecha_factura`).
4. **Uniones literales sincronizadas con realidad**. Los unions TS de
   `estado`, `pendiente`, etc. deben incluir todos los valores que la API y
   reglas de negocio escriban (incluido `'FACTURADO'` en `pendiente`).
5. **Identidad de nombres**. Si la columna DB es `snake_case`, TS también lo
   es. NO se convierte a `camelCase` en tipos (rompería la identidad verbatim
   con el schema y generaría mapeos manuales propensos a error).
6. **Cualquier modificación al modelo** se documenta aquí en la misma PR que
   modifica el schema, actualizando las tablas correspondientes.
