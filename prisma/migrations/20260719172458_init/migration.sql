-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "ultimoIngreso" TEXT,
    "creadoEn" TEXT NOT NULL,
    "clientId" TEXT,
    "allowedModules" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "direccionSede" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "contactoNombre" TEXT NOT NULL,
    "contactoEmail" TEXT NOT NULL,
    "contactoTelefono" TEXT NOT NULL,
    "pais" TEXT,
    "provincia" TEXT,
    "contactos" JSONB,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tipoEquipo" TEXT NOT NULL,
    "visitasAnuales" INTEGER NOT NULL,
    "fechaInicio" TEXT NOT NULL,
    "fechaFin" TEXT NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OT" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tipoMantenimiento" TEXT NOT NULL,
    "tipoEquipo" TEXT NOT NULL,
    "potenciaKva" DOUBLE PRECISION NOT NULL,
    "equipoId" TEXT,
    "fechaProgramada" TEXT NOT NULL,
    "horaProgramada" TEXT,
    "horaFinProgramada" TEXT,
    "horaInicioServicio" TEXT,
    "horaFinServicio" TEXT,
    "tecnicoTitularId" TEXT,
    "tecnicoApoyoId" TEXT,
    "tecnicoTitular" TEXT NOT NULL,
    "tecnicoApoyo" TEXT,
    "tecnicosAdicionalesIds" JSONB,
    "tecnicosAdicionalesNombres" JSONB,
    "estado" TEXT NOT NULL,
    "origen" TEXT,
    "otFinancieraId" TEXT,
    "costo_estimado_usd" DOUBLE PRECISION,
    "contratoId" TEXT,
    "adendaId" TEXT,

    CONSTRAINT "OT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalReport" (
    "id" TEXT NOT NULL,
    "otId" TEXT NOT NULL,
    "equipoId" TEXT,
    "voltajeEntrada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "voltajeSalida" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "indicadoresBateria" JSONB NOT NULL DEFAULT '{}',
    "observacionesDiagnostico" TEXT NOT NULL DEFAULT '',
    "comentariosAdicionales" TEXT NOT NULL DEFAULT '',
    "firmaCliente" TEXT,
    "correccionesSupervisor" TEXT,
    "creadoEn" TEXT NOT NULL,
    "modificadoEn" TEXT NOT NULL,
    "offlineDirty" BOOLEAN,
    "fotos" JSONB NOT NULL DEFAULT '[]',
    "informeN" TEXT,
    "hojaServicioN" TEXT,
    "asunto" TEXT,
    "fechaServicio" TEXT,
    "horaInicio" TEXT,
    "tecnico1" TEXT,
    "tecnico2" TEXT,
    "antecedentes" TEXT,
    "accionesRealizadas" JSONB,
    "pasos" JSONB,
    "caracteristicas" JSONB,
    "fotosLabeled" JSONB,
    "medicionesEntrada" JSONB,
    "medicionesSalida" JSONB,
    "diagnosticoGabinete" JSONB,
    "revisionNormas" JSONB,
    "recomendaciones" JSONB,

    CONSTRAINT "TechnicalReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenTrabajoLinea" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "ot_marco" INTEGER NOT NULL,
    "ot" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "nombre_solicitante" TEXT NOT NULL,
    "clientId" TEXT,
    "razon_social" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "n_cotizacion" TEXT,
    "n_oc_os" TEXT,
    "simbolo_moneda" TEXT NOT NULL,
    "monto_marco_sin_igv" DOUBLE PRECISION NOT NULL,
    "monto_marco_inc_igv" DOUBLE PRECISION NOT NULL,
    "sub_importe_sin_igv" DOUBLE PRECISION NOT NULL,
    "sub_importe_inc_igv" DOUBLE PRECISION NOT NULL,
    "total_usd" DOUBLE PRECISION NOT NULL,
    "anio_prog_facturacion" DOUBLE PRECISION NOT NULL,
    "mes_prog_servicio" TEXT NOT NULL,
    "mes_prog_facturacion" TEXT NOT NULL,
    "factura" TEXT,
    "tipo_venta" TEXT NOT NULL,
    "comercial" TEXT NOT NULL,
    "comercialId" TEXT,
    "area" TEXT,
    "periodo" TEXT,
    "h2h_bcp" TEXT,
    "pendiente" TEXT NOT NULL,
    "oc" TEXT,
    "estado" TEXT NOT NULL,
    "fecha_facturacion" TEXT,
    "vencimiento_factura" TEXT,
    "monto_factura_inc_igv" DOUBLE PRECISION,
    "pagado" TEXT,
    "fecha_pago" TEXT,
    "dias_pago" DOUBLE PRECISION,
    "detraccion" TEXT,
    "fecha_detraccion" TEXT,
    "dias_detraccion" DOUBLE PRECISION,
    "bcp" TEXT,
    "listaParaFacturar" BOOLEAN,
    "otTecnicaId" TEXT,
    "estatus" JSONB,
    "contratoId" TEXT,
    "adendaId" TEXT,
    "equipoId" TEXT,

    CONSTRAINT "OrdenTrabajoLinea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoNuevo" (
    "id" TEXT NOT NULL,
    "anio" INTEGER,
    "n_contrato" TEXT,
    "comercial" TEXT,
    "comercialId" TEXT,
    "cliente" TEXT,
    "clientId" TEXT,
    "detalle" TEXT,
    "monto_sin_igv" DOUBLE PRECISION,
    "monto_inc_igv" DOUBLE PRECISION,
    "monto_facturar_sin_igv" DOUBLE PRECISION,
    "monto_facturar_inc_igv" DOUBLE PRECISION,
    "monto_facturado_sin_igv" DOUBLE PRECISION,
    "monto_facturado_inc_igv" DOUBLE PRECISION,
    "por_facturar_sin_igv" DOUBLE PRECISION,
    "por_facturar_inc_igv" DOUBLE PRECISION,
    "monto_pagado_sin_igv" DOUBLE PRECISION,
    "monto_pagado_inc_igv" DOUBLE PRECISION,
    "pendiente_pago_sin_igv" DOUBLE PRECISION,
    "pendiente_pago_inc_igv" DOUBLE PRECISION,
    "vence" TEXT,
    "oc" TEXT,
    "h2h_bcp" TEXT,
    "estado" TEXT,
    "tipo_contract" TEXT,
    "tipo_contrato" TEXT,
    "fecha_inicio" TEXT,
    "fecha_fin" TEXT,
    "fecha_fin_original" TEXT,
    "comentarios" TEXT,
    "presupuesto_total_usd" DOUBLE PRECISION,
    "saldo_disponible_usd" DOUBLE PRECISION,
    "monto_original" DOUBLE PRECISION,
    "moneda" TEXT,
    "pdf_url" TEXT,

    CONSTRAINT "ContratoNuevo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetVenta" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes_num" INTEGER NOT NULL,
    "mes" TEXT NOT NULL,
    "target_ventas_usd" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TargetVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pais" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Pais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provincia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "paisId" TEXT NOT NULL,

    CONSTRAINT "Provincia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distrito" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "provinciaId" TEXT NOT NULL,

    CONSTRAINT "Distrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoContrato" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TipoContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoAmpliacion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL DEFAULT '',
    "contratoId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha_inicio" TEXT NOT NULL,
    "fecha_fin" TEXT NOT NULL,
    "adenda_pdf_url" TEXT,
    "comentarios" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContratoAmpliacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "serie" TEXT,
    "potenciaKva" DOUBLE PRECISION,
    "ubicacion" TEXT,
    "clienteId" TEXT,
    "contratoId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Operativo',
    "fotos" JSONB,
    "especificaciones" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipoAmpliacion" (
    "id" TEXT NOT NULL,
    "adendaId" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipoAmpliacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicioEquipo" (
    "id" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "otId" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado_post" TEXT NOT NULL,
    "tecnicoTitular" TEXT NOT NULL,
    "hallazgos" TEXT,
    "recomendaciones" TEXT,
    "fotos" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicioEquipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtEquipoAsignacion" (
    "id" TEXT NOT NULL,
    "otId" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,
    "tecnicoTitularId" TEXT,
    "tecnicoTitular" TEXT,
    "tecnicoApoyoId" TEXT,
    "tecnicoApoyo" TEXT,
    "fecha" TEXT,
    "hora" TEXT,
    "horaFin" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtEquipoAsignacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TechnicalReport_otId_idx" ON "TechnicalReport"("otId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalReport_otId_equipoId_key" ON "TechnicalReport"("otId", "equipoId");

-- CreateIndex
CREATE UNIQUE INDEX "TipoContrato_name_key" ON "TipoContrato"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Equipo_codigo_key" ON "Equipo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "EquipoAmpliacion_adendaId_equipoId_key" ON "EquipoAmpliacion"("adendaId", "equipoId");

-- CreateIndex
CREATE INDEX "ServicioEquipo_equipoId_idx" ON "ServicioEquipo"("equipoId");

-- CreateIndex
CREATE INDEX "OtEquipoAsignacion_otId_idx" ON "OtEquipoAsignacion"("otId");

-- CreateIndex
CREATE UNIQUE INDEX "OtEquipoAsignacion_otId_equipoId_key" ON "OtEquipoAsignacion"("otId", "equipoId");

-- AddForeignKey
ALTER TABLE "Provincia" ADD CONSTRAINT "Provincia_paisId_fkey" FOREIGN KEY ("paisId") REFERENCES "Pais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distrito" ADD CONSTRAINT "Distrito_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES "Provincia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoAmpliacion" ADD CONSTRAINT "ContratoAmpliacion_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "ContratoNuevo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "ContratoNuevo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoAmpliacion" ADD CONSTRAINT "EquipoAmpliacion_adendaId_fkey" FOREIGN KEY ("adendaId") REFERENCES "ContratoAmpliacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipoAmpliacion" ADD CONSTRAINT "EquipoAmpliacion_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioEquipo" ADD CONSTRAINT "ServicioEquipo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
