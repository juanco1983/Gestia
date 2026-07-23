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

export const INITIAL_CONTRATOS_NUEVOS: any[] = [
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

export const INITIAL_ORDENES_TRABAJO: OrdenTrabajoLinea[] = [];

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
  'PENDIENTE_VISITA',
  'PENDIENTE_INFORME',
  'PENDIENTE_FACTURACION',
  'POR FACTURAR',
  'FACTURADO',
  'ANULADO'
];

export const TIPO_CONTRATACION_VALUES = [
  'CONTRATO',
  'OC',
  'OS',
  'CORREO'
];

/**
 * Returns dynamic status metadata for an OT Financiera (OrdenTrabajoLinea)
 * synced with the operational state of the linked technical OT.
 */
export function getFinancialStatusInfo(
  linea: { estado?: string; n_factura?: string; fecha_factura?: string },
  matchingOt?: any
) {
  const rawState = (linea.estado || '').toUpperCase();

  // If already billed with invoice number and date saved
  if (rawState === 'FACTURADO' || rawState === 'COMPLETADO') {
    return {
      key: 'FACTURADO',
      label: 'Facturado',
      badgeClass: 'bg-[#E6F7F4] text-[#00B594] border border-emerald-200/80 font-mono font-black',
      icon: '🔒'
    };
  }

  if (rawState === 'ANULADO') {
    return {
      key: 'ANULADO',
      label: 'Anulado',
      badgeClass: 'bg-rose-100 text-rose-700 border border-rose-200 font-mono font-bold',
      icon: '🚫'
    };
  }

  // Derive dynamic status from linked technical OT state if available
  if (matchingOt) {
    const otState = (matchingOt.estado || '').toUpperCase();

    // Approved by supervisor -> Ready for Billing
    if (
      otState === 'APROBADA' ||
      otState === 'FIRMADA' ||
      otState === 'FACTURADA' ||
      otState === 'CERRADA'
    ) {
      return {
        key: 'PENDIENTE_FACTURACION',
        label: 'Pendiente de Facturación',
        badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200 font-mono font-extrabold',
        icon: '💳'
      };
    }

    // Technical visit done -> Report pending creation/review
    if (
      otState === 'INFORME_PENDIENTE' ||
      otState === 'EN_REVISION' ||
      otState === 'OBSERVADA'
    ) {
      return {
        key: 'PENDIENTE_INFORME',
        label: 'Pendiente de Informe',
        badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200 font-mono font-bold',
        icon: '⏳'
      };
    }

    // Technical visit not executed yet
    if (
      otState === 'PROGRAMADA' ||
      otState === 'ASIGNADA' ||
      otState === 'EN_CAMINO' ||
      otState === 'EN_SITIO' ||
      otState === 'TRABAJO_EN_EJECUCION' ||
      otState === 'PENDIENTE_PROGRAMACION'
    ) {
      return {
        key: 'PENDIENTE_VISITA',
        label: 'Pendiente de Visita',
        badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold',
        icon: '📅'
      };
    }
  }

  // Explicit key fallbacks if set directly on financial line
  if (rawState === 'PENDIENTE_VISITA') {
    return {
      key: 'PENDIENTE_VISITA',
      label: 'Pendiente de Visita',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold',
      icon: '📅'
    };
  }

  if (rawState === 'PENDIENTE_INFORME') {
    return {
      key: 'PENDIENTE_INFORME',
      label: 'Pendiente de Informe',
      badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200 font-mono font-bold',
      icon: '⏳'
    };
  }

  if (rawState === 'PENDIENTE_FACTURACION' || rawState === 'POR FACTURAR') {
    return {
      key: 'PENDIENTE_FACTURACION',
      label: 'Pendiente de Facturación',
      badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200 font-mono font-extrabold',
      icon: '💳'
    };
  }

  return {
    key: 'PENDIENTE_FACTURACION',
    label: 'Pendiente de Facturación',
    badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200 font-mono font-extrabold',
    icon: '💳'
  };
}
