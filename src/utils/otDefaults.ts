import { OrdenTrabajoLinea, Contrato, TargetVentas } from '../types';

export const INITIAL_TARGET_VENTAS: TargetVentas[] = [
  { id: 't_1', anio: 2026, mes_num: 1, mes: 'ENE', target_ventas_usd: 35000 },
  { id: 't_2', anio: 2026, mes_num: 2, mes: 'FEB', target_ventas_usd: 40000 },
  { id: 't_3', anio: 2026, mes_num: 3, mes: 'MAR', target_ventas_usd: 45000 },
  { id: 't_4', anio: 2026, mes_num: 4, mes: 'ABR', target_ventas_usd: 40000 },
  { id: 't_5', anio: 2026, mes_num: 5, mes: 'MAY', target_ventas_usd: 50000 },
  { id: 't_6', anio: 2026, mes_num: 6, mes: 'JUN', target_ventas_usd: 55000 },
  { id: 't_7', anio: 2026, mes_num: 7, mes: 'JUL', target_ventas_usd: 60000 },
  { id: 't_8', anio: 2026, mes_num: 8, mes: 'AGO', target_ventas_usd: 50000 },
  { id: 't_9', anio: 2026, mes_num: 9, mes: 'SET', target_ventas_usd: 45000 },
  { id: 't_10', anio: 2026, mes_num: 10, mes: 'OCT', target_ventas_usd: 50000 },
  { id: 't_11', anio: 2026, mes_num: 11, mes: 'NOV', target_ventas_usd: 55000 },
  { id: 't_12', anio: 2026, mes_num: 12, mes: 'DIC', target_ventas_usd: 65000 }
];

export const INITIAL_CONTRATOS_NUEVOS: Contrato[] = [
  {
    id: 'cont_001',
    cliente: 'Prosegur Tecnología S.A.',
    ot_marco: 100,
    tipo_contrato: 'Mantenimiento Preventivo UPS 60KVA + 100KVA',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    estado: 'VIGENTE',
    comercial: 'María López',
    comentarios: '4 visitas anuales programadas',
    clientId: 'client_1',
    comercialId: 'user_1'
  },
  {
    id: 'cont_002',
    cliente: 'Clínica San Pablo S.A.C.',
    ot_marco: 200,
    tipo_contrato: 'Mantenimiento Preventivo UPS 40KVA',
    fecha_inicio: '2026-01-15',
    fecha_fin: '2027-01-14',
    estado: 'VIGENTE',
    comercial: 'María López',
    comentarios: '6 visitas anuales, incluye reposición de baterías',
    clientId: 'client_2',
    comercialId: 'user_1'
  },
  {
    id: 'cont_003',
    cliente: 'Banco Interbank S.A.',
    ot_marco: 300,
    tipo_contrato: 'Climatización de Precisión 80HP + Rectificador 120KVA',
    fecha_inicio: '2026-03-01',
    fecha_fin: '2027-02-28',
    estado: 'VIGENTE',
    comercial: 'María López',
    comentarios: 'Mantenimiento mensual, incluye emergencias',
    clientId: 'client_3',
    comercialId: 'user_1'
  }
];

// --------------------------------------------------------------------------
// ÓRDENES DE TRABAJO FINANCIERAS (vinculadas a las 5 OTs técnicas)
// --------------------------------------------------------------------------
// otl_1  →  OT-001 (CERRADA)    →  FACTURADO
// otl_2  →  OT-002 (FIRMADA)    →  POR FACTURAR (lista para facturar)
// otl_3  →  OT-003 (EN_REVISION)→  POR FACTURAR (pendiente de aprobación técnica)
// otl_4  →  OT-004 (PROGRAMADA) →  POR FACTURAR (servicio no ejecutado aún)
// otl_5  →  OT-005 (CREADA)     →  POR FACTURAR (emergencia recién registrada)
// --------------------------------------------------------------------------

export const INITIAL_ORDENES_TRABAJO: OrdenTrabajoLinea[] = [
  // ── otl_1: OT-001 → FACTURADO (completamente cerrada) ──────────────────
  {
    id: 'otl_1',
    anio: 2026,
    ot_marco: 100,
    ot: '100-1',
    mes: 'JUN',
    fecha: '2026-06-10',
    nombre_solicitante: 'María López',
    clientId: 'client_1',
    razon_social: 'Prosegur Tecnología S.A.',
    empresa: 'PROSEGUR',
    descripcion: 'Mantenimiento Preventivo UPS Trifásico 60KVA - Sala de Servidores Principal',
    n_cotizacion: 'COT-2026-041',
    n_oc_os: 'OC-3890',
    simbolo_moneda: '$',
    monto_marco_sin_igv: 4200,
    monto_marco_inc_igv: 4956,
    sub_importe_sin_igv: 4200,
    sub_importe_inc_igv: 4956,
    total_usd: 4200,
    anio_prog_facturacion: 2026,
    mes_prog_servicio: 'JUN',
    mes_prog_facturacion: 'JUN',
    tipo_venta: 'MANTENIMIENTO',
    pendiente: 'EJECUTADO',
    estado: 'FACTURADO',
    n_factura: 'F001-004521',
    anio_factura: 2026,
    mes_factura: 'JUN',
    fecha_factura: '2026-06-15',
    nro_guia_informe: 'INF-2026-041',
    observacion: 'Servicio ejecutado sin incidencias. Baterías en óptimo estado.',
    seguimiento: 'Factura cobrada.',
    tipo_contratacion: 'CONTRATO',
    estatus: [
      { fecha: '2026-06-01', autor: 'María López', texto: 'OT generada desde contrato anual' },
      { fecha: '2026-06-10', autor: 'Carlos Ocsa', texto: 'Servicio completado. UPS operando al 85% de carga.' },
      { fecha: '2026-06-12', autor: 'Ing. Roberto Salas', texto: 'Informe aprobado. Sin observaciones.' },
      { fecha: '2026-06-15', autor: 'María López', texto: 'Facturado exitosamente.' }
    ],
    comercialId: 'user_1',
    comercial: 'María López',
    creadoPor: 'ventas@mafort.pe',
    creadoEn: '2026-06-01',
    modificadoPor: 'ventas@mafort.pe',
    modificadoEn: '2026-06-15',
    otTecnicaId: 'OT-001',
    listaParaFacturar: true
  },

  // ── otl_2: OT-002 → POR FACTURAR (firmada, lista) ──────────────────────
  {
    id: 'otl_2',
    anio: 2026,
    ot_marco: 200,
    ot: '200-1',
    mes: 'JUN',
    fecha: '2026-06-20',
    nombre_solicitante: 'María López',
    clientId: 'client_2',
    razon_social: 'Clínica San Pablo S.A.C.',
    empresa: 'SAN PABLO',
    descripcion: 'Mantenimiento Preventivo UPS Monofásico 40KVA - Centro de Datos Clínico',
    n_cotizacion: 'COT-2026-058',
    n_oc_os: 'OC-3925',
    simbolo_moneda: '$',
    monto_marco_sin_igv: 3500,
    monto_marco_inc_igv: 4130,
    sub_importe_sin_igv: 3500,
    sub_importe_inc_igv: 4130,
    total_usd: 3500,
    anio_prog_facturacion: 2026,
    mes_prog_servicio: 'JUN',
    mes_prog_facturacion: 'JUN',
    tipo_venta: 'MANTENIMIENTO',
    pendiente: 'EJECUTADO',
    estado: 'POR FACTURAR',
    n_factura: '',
    nro_guia_informe: 'INF-2026-058',
    observacion: 'Conformidad firmada por el cliente. Pendiente emisión de factura.',
    seguimiento: 'Esperando proceso de facturación.',
    tipo_contratacion: 'CONTRATO',
    estatus: [
      { fecha: '2026-06-12', autor: 'María López', texto: 'OT generada para visita Q2' },
      { fecha: '2026-06-20', autor: 'Juan Córdova', texto: 'Servicio completado. Cambio preventivo de 4 baterías.' },
      { fecha: '2026-06-22', autor: 'Ing. Roberto Salas', texto: 'Informe aprobado.' },
      { fecha: '2026-06-23', autor: 'Ing. Pedro Vásquez', texto: 'Conformidad firmada digitalmente.' }
    ],
    comercialId: 'user_1',
    comercial: 'María López',
    creadoPor: 'ventas@mafort.pe',
    creadoEn: '2026-06-12',
    modificadoPor: 'supervisor@mafort.pe',
    modificadoEn: '2026-06-23',
    otTecnicaId: 'OT-002',
    listaParaFacturar: true
  },

  // ── otl_3: OT-003 → POR FACTURAR (en revisión técnica) ─────────────────
  {
    id: 'otl_3',
    anio: 2026,
    ot_marco: 300,
    ot: '300-1',
    mes: 'JUN',
    fecha: '2026-06-25',
    nombre_solicitante: 'María López',
    clientId: 'client_3',
    razon_social: 'Banco Interbank S.A.',
    empresa: 'INTERBANK',
    descripcion: 'Servicio Correctivo Climatización de Precisión 80HP - Data Center La Victoria',
    n_cotizacion: 'COT-2026-072',
    n_oc_os: 'OC-3950',
    simbolo_moneda: '$',
    monto_marco_sin_igv: 6800,
    monto_marco_inc_igv: 8024,
    sub_importe_sin_igv: 6800,
    sub_importe_inc_igv: 8024,
    total_usd: 6800,
    anio_prog_facturacion: 2026,
    mes_prog_servicio: 'JUN',
    mes_prog_facturacion: 'JUL',
    tipo_venta: 'MANTENIMIENTO',
    pendiente: 'EJECUTADO',
    estado: 'POR FACTURAR',
    n_factura: '',
    nro_guia_informe: '',
    observacion: 'Servicio ejecutado. Informe en revisión por supervisor.',
    seguimiento: 'Pendiente aprobación de informe técnico.',
    tipo_contratacion: 'CONTRATO',
    estatus: [
      { fecha: '2026-06-18', autor: 'María López', texto: 'Correctivo solicitado por falla en compresor' },
      { fecha: '2026-06-25', autor: 'Carlos Ocsa', texto: 'Reparación completada. Compresor reemplazado.' }
    ],
    comercialId: 'user_1',
    comercial: 'María López',
    creadoPor: 'ventas@mafort.pe',
    creadoEn: '2026-06-18',
    otTecnicaId: 'OT-003',
    listaParaFacturar: false
  },

  // ── otl_4: OT-004 → POR FACTURAR (programada para hoy) ─────────────────
  {
    id: 'otl_4',
    anio: 2026,
    ot_marco: 100,
    ot: '100-2',
    mes: 'JUN',
    fecha: '2026-06-30',
    nombre_solicitante: 'María López',
    clientId: 'client_1',
    razon_social: 'Prosegur Tecnología S.A.',
    empresa: 'PROSEGUR',
    descripcion: 'Mantenimiento Preventivo UPS Trifásico 100KVA - Sala de Energía',
    n_cotizacion: 'COT-2026-085',
    n_oc_os: 'OC-3978',
    simbolo_moneda: '$',
    monto_marco_sin_igv: 7500,
    monto_marco_inc_igv: 8850,
    sub_importe_sin_igv: 7500,
    sub_importe_inc_igv: 8850,
    total_usd: 7500,
    anio_prog_facturacion: 2026,
    mes_prog_servicio: 'JUN',
    mes_prog_facturacion: 'JUL',
    tipo_venta: 'MANTENIMIENTO',
    pendiente: 'POR EJECUTAR',
    estado: 'POR FACTURAR',
    n_factura: '',
    nro_guia_informe: '',
    observacion: 'Visita programada para esta tarde.',
    seguimiento: 'Técnico y apoyo confirmados.',
    tipo_contratacion: 'CONTRATO',
    estatus: [
      { fecha: '2026-06-22', autor: 'María López', texto: 'OT creada para segunda visita del contrato anual Prosegur' }
    ],
    comercialId: 'user_1',
    comercial: 'María López',
    creadoPor: 'ventas@mafort.pe',
    creadoEn: '2026-06-22',
    otTecnicaId: 'OT-004',
    listaParaFacturar: false
  },

  // ── otl_5: OT-005 → POR FACTURAR (emergencia nueva) ────────────────────
  {
    id: 'otl_5',
    anio: 2026,
    ot_marco: 300,
    ot: '300-2',
    mes: 'JUL',
    fecha: '2026-07-05',
    nombre_solicitante: 'María López',
    clientId: 'client_3',
    razon_social: 'Banco Interbank S.A.',
    empresa: 'INTERBANK',
    descripcion: 'Atención de Emergencia Rectificador Industrial 120KVA - Subestación Eléctrica',
    n_cotizacion: 'COT-2026-091',
    n_oc_os: '',
    simbolo_moneda: '$',
    monto_marco_sin_igv: 9200,
    monto_marco_inc_igv: 10856,
    sub_importe_sin_igv: 9200,
    sub_importe_inc_igv: 10856,
    total_usd: 9200,
    anio_prog_facturacion: 2026,
    mes_prog_servicio: 'JUL',
    mes_prog_facturacion: 'JUL',
    tipo_venta: 'EMERGENCIA',
    pendiente: 'POR EJECUTAR',
    estado: 'POR FACTURAR',
    n_factura: '',
    nro_guia_informe: '',
    observacion: 'Emergencia reportada por caída de tensión en subestación.',
    seguimiento: 'Pendiente asignación de técnico.',
    tipo_contratacion: 'CONTRATO',
    estatus: [
      { fecha: '2026-06-29', autor: 'Luis Fernández', texto: 'Solicitud de emergencia por falla en rectificador principal' }
    ],
    comercialId: 'user_1',
    comercial: 'María López',
    creadoPor: 'ventas@mafort.pe',
    creadoEn: '2026-06-29',
    otTecnicaId: 'OT-005',
    listaParaFacturar: false
  }
];

export const MESES_ESPANOL = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];

export const TIPO_VENTA_VALUES = [
  'ALQUILER',
  'MANTENIMIENTO',
  'SERVICIO',
  'SUMINISTRO',
  'EMERGENCIA',
  'INSTALACION',
  'REPARACION',
  'PROYECTO',
  'ANULADO'
];

export const PENDIENTE_VALUES = [
  'EJECUTADO',
  'POR EJECUTAR',
  'ANULADO'
];

export const ESTADO_VALUES = [
  'FACTURADO',
  'POR FACTURAR',
  'ANULADO'
];

export const TIPO_CONTRATACION_VALUES = [
  'CONTRATO',
  'OC',
  'OS',
  'CORREO'
];
