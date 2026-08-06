export enum ServiceType {
  PREVENTIVO = 'Preventivo',
  PREDICTIVO = 'Predictivo',
  CORRECTIVO = 'Correctivo',
  INSTALACION = 'Instalacion',
  VISITA_TECNICA = 'Visita Tecnica',
  CAMBIO_BATERIAS = 'Cambio Baterias',
  PRUEBAS_FAULT_OVER = 'Pruebas Fault Over',
  APAGADO_ENCENDIDO = 'Apagado Y Encendido',
  REVISION_DIAGNOSTICO = 'Revision Y Diagnostico',
  EMERGENCIA = 'Emergencia'
}

export type ServiceTypeKey = Exclude<`${ServiceType}`, ''>;

export enum EquipmentType {
  UPS = 'UPS',
  CLIMATIZACION = 'Climatización de Precisión',
  TRANSFORMADOR = 'Transformador',
  RECTIFICADOR = 'Rectificador Industrial'
}

export enum VisitaStatus {
  PROGRAMADA = 'Programada',
  EN_CAMINO = 'En Camino',
  EN_SITIO = 'En Sitio',
  EN_EJECUCION = 'En Ejecución',
  COMPLETADA = 'Completada'
}

export enum OTStatus {
  CREADA = 'Creada',
  PENDIENTE_PROGRAMACION = 'Pendiente de Programación',
  ASIGNADA = 'Asignada',
  PROGRAMADA = 'Programada',
  EN_CAMINO = 'En Camino',
  EN_SITIO = 'En Sitio',
  TRABAJO_EN_EJECUCION = 'Trabajo en Ejecución',
  NO_EJECUTADA = 'No Ejecutada',
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

export interface Visita {
  id: string;
  codigo: string;
  clientId: string;
  ubicacion?: string;
  fechaProgramada: string;
  horaProgramada?: string;
  horaFinProgramada?: string;
  tecnicoTitularId: string;
  tecnicoTitular: string;
  tecnicoApoyoId?: string;
  tecnicoApoyo?: string;
  tecnicosAdicionalesIds?: string[];
  tecnicosAdicionalesNombres?: string[];
  estado: VisitaStatus | string;
  horaSalida?: string;
  horaLlegada?: string;
  horaInicioServicio?: string;
  horaFinServicio?: string;
  notas?: string;
  contratoId?: string;
  adendaId?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

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
  visitaId?: string;
  contratoId?: string;
  adendaId?: string;
  costo_estimado_usd?: number;
  equipoId?: string;
  tipoMantenimiento: ServiceType;
  tipoEquipo: EquipmentType;
  potenciaKva: number; // For determining photocount limit
  fechaProgramada: string;
  horaProgramada?: string; // Phase 1: Hora programada para la visita
  horaFinProgramada?: string; // Scheduled end time
  horaInicioServicio?: string; // Time when status changes to EN_PROCESO
  horaFinServicio?: string; // Time when technical work ends
  horaSalida?: string; // Time when status changes to EN_CAMINO
  horaLlegadaSitio?: string; // Time when status changes to EN_SITIO
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
  equipoId?: string;
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
  horaFin?: string; // Hora de finalizacion del trabajo en sitio
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
  // Nuevos campos adaptativos (todos opcionales para backward compat)
  tipoServicio?: ServiceType;
  panoramaFoto?: string; // Base64 VISTA PANORAMICA
  pasosLista?: Array<{ numero: number; titulo?: string; descripcion: string }>;
  medicionesBypass?: {
    lnVoltaje: [string, string, string];
    frecuencia: [string, string, string];
    llVoltaje: [string, string, string];
  };
  medicionesBaterias?: {
    banco1?: Array<{ numero: number; voltajeFlotacion: string; resistenciaInterna?: string; soh?: number }>;
    banco2?: Array<{ numero: number; voltajeFlotacion: string; resistenciaInterna?: string; soh?: number }>;
    notas?: string;
  };
  parametrosCarga?: {
    kva: [string, string, string];
    kw: [string, string, string];
    kvar?: [string, string, string];
    porcentaje: [string, string, string];
    factorCresta?: [string, string, string];
  };
  historialAlarmas?: Array<{
    numero: number;
    evento: string;
    fecha: string;
    hora: string;
    codigo: string;
    descripcion: string;
  }>;
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
  // Fuente de verdad: prisma/schema.prisma → model OrdenTrabajoLinea.
  // Los campos se nombran EXACTAMENTE como en el schema; cualquier alias
  // legacy (p.ej. "factura" para n_factura, "fecha_facturacion" para
  // fecha_factura) se gestiona SOLO en el backend con @map del schema, y el
  // frontend siempre usa los nombres canónicos.
  id: string;
  anio: number;
  ot_marco: number;
  ot: string;
  mes: string;
  fecha: string;
  nombre_solicitante: string;
  clientId?: string;
  razon_social: string;
  empresa: string;
  descripcion: string;
  n_cotizacion?: string;
  n_oc_os?: string;
  simbolo_moneda: string;
  monto_marco_sin_igv: number;
  monto_marco_inc_igv: number;
  sub_importe_sin_igv: number;
  sub_importe_inc_igv: number;
  total_usd: number;
  anio_prog_facturacion: number;
  mes_prog_servicio: string;
  mes_prog_facturacion: string;
  n_factura?: string;
  tipo_venta: string;
  comercial: string;
  comercialId?: string;
  area?: string;
  periodo?: string;
  h2h_bcp?: string;
  pendiente: 'EJECUTADO' | 'POR EJECUTAR' | 'ANULADO' | 'FACTURADO';
  oc?: string;
  estado: 'FACTURADO' | 'POR FACTURAR' | 'ANULADO';
  fecha_factura?: string;
  vencimiento_factura?: string;
  monto_factura_inc_igv?: number;
  pagado?: string;
  fecha_pago?: string;
  dias_pago?: number;
  detraccion?: string;
  fecha_detraccion?: string;
  dias_detraccion?: number;
  bcp?: string;
  listaParaFacturar?: boolean;
  otTecnicaId?: string;
  estatus?: ComentarioEstatus[];
  contratoId?: string;
  adendaId?: string;
  equipoId?: string;
}

export interface ContratoAmpliacion {
  id: string;
  codigo: string;
  contratoId: string;
  monto: number;
  fecha_inicio: string;
  fecha_fin: string;
  adenda_pdf_url?: string;
  comentarios?: string;
  creadoEn: string;
  equiposAdenda?: EquipoAmpliacion[];
}

export interface Contrato {
  // Fuente de verdad: prisma/schema.prisma → model ContratoNuevo.
  // nozzle: en frontend usamos Contrato (este) como tipo equivalente al
  // ContratoNuevo del backend. Cualquier campo del schema se refle aquí.
  id: string;
  anio?: number;
  n_contrato?: string;
  comercial?: string;
  comercialId?: string;
  cliente?: string;
  clientId?: string;
  detalle?: string;
  monto_sin_igv?: number;
  monto_inc_igv?: number;
  monto_facturar_sin_igv?: number;
  monto_facturar_inc_igv?: number;
  monto_facturado_sin_igv?: number;
  monto_facturado_inc_igv?: number;
  por_facturar_sin_igv?: number;
  por_facturar_inc_igv?: number;
  monto_pagado_sin_igv?: number;
  monto_pagado_inc_igv?: number;
  pendiente_pago_sin_igv?: number;
  pendiente_pago_inc_igv?: number;
  vence?: string;
  oc?: string;
  h2h_bcp?: string;
  estado?: string;
  tipo_contract?: string;
  tipo_contrato?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_fin_original?: string;
  comentarios?: string;
  presupuesto_total_usd?: number;
  saldo_disponible_usd?: number;
  monto_original?: number;
  moneda?: string;
  pdf_url?: string;
  ampliaciones?: ContratoAmpliacion[];
  equipos?: Equipo[];
}

export interface TargetVentas {
  id: string;
  anio: number;
  mes_num: number;
  mes: string;
  target_ventas_usd: number;
}

export type EquipoEstado = 'Operativo' | 'En reparación' | 'En observación' | 'Baja' | 'En almacén';

export interface Equipo {
  id: string;
  codigo: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  potenciaKva?: number;
  ubicacion?: string;
  clienteId?: string;
  contratoId?: string;
  estado: EquipoEstado;
  fotos?: string[];
  especificaciones?: Record<string, any>;
  creadoEn?: string;
  actualizadoEn?: string;
  adensasOrigen?: EquipoAmpliacion[];
  servicios?: ServicioEquipo[];
}

export interface EquipoAmpliacion {
  id: string;
  adendaId: string;
  equipoId: string;
  creadoEn?: string;
  equipo?: Equipo;
}

export interface ServicioEquipo {
  id: string;
  equipoId: string;
  otId: string;
  fecha: string;
  tipo: string;
  estado_post: string;
  tecnicoTitular: string;
  hallazgos?: string;
  recomendaciones?: string;
  fotos?: any;
  creadoEn?: string;
}

export interface OtEquipoAsignacion {
  id: string;
  otId: string;
  equipoId: string;
  tecnicoTitularId?: string | null;
  tecnicoTitular?: string | null;
  tecnicoApoyoId?: string | null;
  tecnicoApoyo?: string | null;
  fecha?: string | null;
  hora?: string | null;
  horaFin?: string | null;
  creadoEn?: string;
}

