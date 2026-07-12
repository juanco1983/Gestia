export enum ServiceType {
  PREVENTIVO = 'Preventivo',
  CORRECTIVO = 'Correctivo',
  EMERGENCIA = 'Emergencia'
}

export enum EquipmentType {
  UPS = 'UPS',
  CLIMATIZACION = 'Climatización de Precisión',
  TRANSFORMADOR = 'Transformador',
  RECTIFICADOR = 'Rectificador Industrial'
}

export enum OTStatus {
  CREADA = 'Creada',
  PENDIENTE_PROGRAMACION = 'Pendiente de Programación',
  ASIGNADA = 'Asignada',
  PROGRAMADA = 'Programada',
  EN_CAMINO = 'En Camino',
  EN_SITIO = 'En Sitio',
  TRABAJO_EN_EJECUCION = 'Trabajo en Ejecución',
  INFORME_PENDIENTE = 'Informe Pendiente',
  INFORME_ENVIADO = 'Informe Enviado',
  EN_REVISION = 'En Revisión',
  OBSERVADA = 'Observada',
  CORREGIDA = 'Corregida',
  APROBADA = 'Aprobada',
  FIRMADA = 'Firmada',
  FACTURADA = 'Facturada',
  CERRADA = 'Cerrada'
}

export type OTOrigin = 'Venta' | 'Contrato' | 'Emergencia' | 'Correctiva' | 'Interna';

export interface Client {
  id: string;
  razonSocial: string;
  ruc: string;
  direccionSede: string;
  distrito: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  pais?: string;
  provincia?: string;
  contactos?: Array<{ nombre: string; email: string; telefono: string }>;
}

export interface Contract {
  id: string;
  clientId: string;
  tipoEquipo: EquipmentType;
  visitasAnuales: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface OT {
  id: string;
  clientId: string;
  contratoId?: string;
  costo_estimado_usd?: number;
  tipoMantenimiento: ServiceType;
  tipoEquipo: EquipmentType;
  potenciaKva: number; // For determining photocount limit
  fechaProgramada: string;
  horaProgramada?: string; // Phase 1: Hora programada para la visita
  horaFinProgramada?: string; // Scheduled end time
  horaInicioServicio?: string; // Time when status changes to EN_PROCESO
  horaFinServicio?: string; // Time when technical work ends
  tecnicoTitularId?: string; // Phase 2: references User.id (role Tecnico)
  tecnicoApoyoId?: string; // Phase 2: references User.id (role Tecnico)
  tecnicoTitular: string; // fallback string
  tecnicoApoyo?: string; // fallback string
  tecnicosAdicionalesIds?: string[]; // Multiple technicians
  tecnicosAdicionalesNombres?: string[]; // Multiple technicians names
  estado: OTStatus;
  origen?: OTOrigin;
  otFinancieraId?: string; // Phase 1: Link to OrdenTrabajoLinea.id
}

export interface TechnicalReport {
  id: string;
  otId: string;
  voltajeEntrada: number;
  voltajeSalida: number;
  indicadoresBateria: {
    nivelCarga: number;
    temperaturaC: number;
    estadoCeldas: 'Optimo' | 'Regular' | 'Critico';
    bypassActivo: boolean;
  };
  observacionesDiagnostico: string;
  comentariosAdicionales: string;
  fotos: string[]; // Base64 or local blob URLs
  firmaCliente?: string; // Base64 signature stroke
  correccionesSupervisor?: string;
  creadoEn: string;
  modificadoEn: string;
  offlineDirty?: boolean; // Offline sync flag

  // Rich official PDF fields
  informeN?: string;
  hojaServicioN?: string;
  asunto?: string;
  fechaServicio?: string;
  horaInicio?: string;
  tecnico1?: string;
  tecnico2?: string;
  antecedentes?: string;
  accionesRealizadas?: string[]; // keys of selected actions
  pasos?: {
    paso1?: string;
    paso1_si_no?: 'si' | 'no';
    paso1_funcionamiento?: 'modo inversor' | 'bypass' | 'apagado';
    paso1_bypass?: 'interno' | 'externo' | 'no';
    paso2?: string;
    paso3?: string;
    paso4?: string;
    paso5?: string;
    paso6?: string;
    paso6_concluido?: 'si' | 'no';
    paso6_observaciones?: string;
  };
  caracteristicas?: Record<string, string>; // UBICACION, EQUIPO, POTENCIA, MARCA, etc.
  fotosLabeled?: Array<{ slotName: string; base64: string; description?: string }>;
  medicionesEntrada?: {
    lnVoltaje: [string, string, string]; // R, S, T
    lnIntensidad: [string, string, string];
    frecuencia: [string, string, string];
    llVoltaje: [string, string, string];
  };
  medicionesSalida?: {
    lnVoltaje: [string, string, string]; // R, S, T
    lnIntensidad: [string, string, string];
    frecuencia: [string, string, string];
    llVoltaje: [string, string, string];
  };
  diagnosticoGabinete?: {
    cuentaConGabinete?: 'si' | 'no';
    tipoEstructura?: 'modo Rack' | 'Torre' | 'no';
    equipoEnBypass?: 'si' | 'no' | 'apagado';
  };
  revisionNormas?: {
    mantenimientoRealizado?: boolean;
    anioBaterias?: number;
    ambienteHermetico?: boolean;
    temperaturaSala?: number;
    estadoOperativo?: boolean;
    inversorOperandoPorcentaje?: number;
  };
  recomendaciones?: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Administrador' | 'Ventas' | 'Tecnico' | 'Supervisor' | 'Cliente';
  estado: 'Activo' | 'Suspendido';
  area: string;
  ultimoIngreso?: string;
  creadoEn: string;
  password?: string;
  clientId?: string; // Phase 5: Link external Client role to a Client.id
  allowedModules?: string[]; // Allowed modules/tabs the user has access to
}

export interface UserActivityLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface ComentarioEstatus {
  fecha: string;
  autor: string;
  texto: string;
}

export interface OrdenTrabajoLinea {
  id: string; // unique internal ID
  anio: number;
  ot_marco: number;
  ot: string; // "{ot_marco}-{correlativo}"
  mes: string; // ENE, FEB, etc.
  fecha: string; // YYYY-MM-DD
  nombre_solicitante: string;
  clientId?: string; // Phase 4: reference to Client.id
  razon_social: string; // Replaced by clientId, kept for compatibility
  empresa: string;
  descripcion: string;
  n_cotizacion: string;
  n_oc_os: string;
  simbolo_moneda: '$' | 'S/';
  monto_marco_sin_igv: number;
  monto_marco_inc_igv: number;
  sub_importe_sin_igv: number;
  sub_importe_inc_igv: number;
  total_usd: number;
  anio_prog_facturacion: number;
  mes_prog_servicio: string;
  dia_prog_servicio?: number;
  mes_prog_facturacion: string;
  dia_prog_facturacion?: number;
  tipo_venta: 'ALQUILER' | 'MANTENIMIENTO' | 'SERVICIO' | 'SUMINISTRO' | 'EMERGENCIA' | 'INSTALACION' | 'REPARACION' | 'PROYECTO' | 'ANULADO';
  pendiente: 'EJECUTADO' | 'POR EJECUTAR' | 'ANULADO';
  estado: 'FACTURADO' | 'POR FACTURAR' | 'ANULADO';
  n_factura: string;
  anio_factura?: number;
  mes_factura?: string;
  fecha_factura?: string;
  nro_guia_informe: string;
  observacion: string;
  seguimiento: string;
  tipo_contratacion: 'CONTRATO' | 'OC' | 'OS' | 'CORREO';
  estatus: ComentarioEstatus[];
  comercialId?: string; // Phase 4: references User.id (Ventas)
  comercial: string; // Replaced by comercialId, kept for compatibility
  creadoPor: string;
  creadoEn: string;
  modificadoPor?: string;
  modificadoEn?: string;
  otTecnicaId?: string; // Phase 1: Vínculo con OT técnica
  listaParaFacturar?: boolean; // Phase 6: Indica si la OT ya fue firmada
}

export interface Contrato {
  id: string;
  clientId?: string; // Phase 4: References Client.id
  cliente: string; // Replaced by clientId, kept for compatibility
  tipo_servicio: string;
  tipo_contrato: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'VIGENTE' | 'TERMINADO' | 'ANULADO';
  comercialId?: string; // Phase 4: References User.id (Ventas)
  comercial: string; // Replaced by comercialId, kept for compatibility
  comentarios: string;
  // Phase 3: Merged technical contract fields
  tipoEquipo?: EquipmentType;
  visitasAnuales?: number;
  presupuesto_total_usd?: number;
  saldo_disponible_usd?: number;
}

export interface TargetVentas {
  id: string;
  anio: number;
  mes_num: number;
  mes: string;
  target_ventas_usd: number;
}

