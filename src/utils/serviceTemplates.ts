import { ServiceType } from '../types';

export interface ServiceTemplate {
  key: ServiceType;
  display: string;
  pasos: string[];
  accionesPreset: string[];
  tieneBaterias: boolean;
  tieneHistorialAlarmas: boolean;
  tieneGraficosSVG: boolean;
  requiereVistaPanoramica: boolean;
  fotosMin: number;
}

export const SERVICE_TEMPLATES: Record<ServiceType, ServiceTemplate> = {
  [ServiceType.PREVENTIVO]: {
    key: ServiceType.PREVENTIVO,
    display: 'Mantenimiento Preventivo',
    pasos: [
      'Revision de componentes internos y externos del equipo UPS.',
      'Limpieza de tarjetas electronicas y filtros de aire.',
      'Verificacion y ajuste de bornes de conexion.',
      'Medicion de parametros electricos de entrada y salida.',
      'Prueba de funcionamiento en modo normal y bypass.',
      'Verificacion del estado de baterias.'
    ],
    accionesPreset: [
      'Revisión general del equipo',
      'Limpieza general del equipo',
      'Ajuste mecánico del equipo',
      'Ajuste de bornes de conexión',
      'Baterías',
      'Arranque de equipo',
      'Prueba en vacío',
      'Pruebas con carga'
    ],
    tieneBaterias: false,
    tieneHistorialAlarmas: false,
    tieneGraficosSVG: false,
    requiereVistaPanoramica: true,
    fotosMin: 8
  },
  [ServiceType.PREDICTIVO]: {
    key: ServiceType.PREDICTIVO,
    display: 'Mantenimiento Predictivo',
    pasos: [
      'Revision de componentes internos y externos del equipo UPS.',
      'Limpieza de tarjetas electronicas y filtros de aire.',
      'Verificacion y ajuste de bornes de conexion.',
      'Medicion de parametros electricos de entrada (R/S/T).',
      'Medicion de parametros electricos de salida (R/S/T).',
      'Medicion de parametros en bypass.',
      'Medicion de carga por fase (KVA, KW, %).',
      'Medicion de voltaje de baterias por unidad.',
      'Medicion de resistencia interna de baterias.',
      'Calculo de SOH (Estado de Salud) de baterias.',
      'Analisis de graficos de tendencia.',
      'Verificacion de sistema de ventilacion.',
      'Prueba de funcionamiento en modo normal.',
      'Prueba de transferencia a bypass.'
    ],
    accionesPreset: [
      'Revisión general del equipo',
      'Limpieza general del equipo',
      'Ajuste mecánico del equipo',
      'Ajuste de bornes de conexión',
      'Baterías',
      'Elementos de medición',
      'Transformadores',
      'Filtros',
      'Arranque de equipo',
      'Prueba en vacío',
      'Pruebas con carga'
    ],
    tieneBaterias: true,
    tieneHistorialAlarmas: false,
    tieneGraficosSVG: true,
    requiereVistaPanoramica: true,
    fotosMin: 16
  },
  [ServiceType.CORRECTIVO]: {
    key: ServiceType.CORRECTIVO,
    display: 'Mantenimiento Correctivo',
    pasos: [
      'Identificacion y diagnostico de la falla reportada.',
      'Ejecucion de acciones correctivas segun diagnostico.',
      'Prueba de funcionamiento posterior a la correccion.',
      'Verificacion de parametros electricos post-servicio.',
      'Limpieza general del area intervenida.'
    ],
    accionesPreset: [
      'Revisión general del equipo',
      'Ajuste mecánico del equipo',
      'Ajuste de bornes de conexión',
      'Revisión del sistema de control',
      'Baterías',
      'Tarjeta de fuentes de alimentación',
      'Tarjeta de protección',
      'Arranque de equipo',
      'Prueba en vacío',
      'Pruebas con carga'
    ],
    tieneBaterias: false,
    tieneHistorialAlarmas: false,
    tieneGraficosSVG: false,
    requiereVistaPanoramica: true,
    fotosMin: 4
  },
  [ServiceType.INSTALACION]: {
    key: ServiceType.INSTALACION,
    display: 'Instalacion de Equipo',
    pasos: [
      'Verificacion del lugar de instalacion (dimensiones, piso, ventilacion).',
      'Posicionamiento y fijacion del equipo UPS.',
      'Conexion electrica de entrada, salida y bypass.',
      'Conexion de baterias y tarjeta SNMP (si aplica).',
      'Configuracion inicial y puesta en marcha.'
    ],
    accionesPreset: [
      'Arranque de equipo',
      'Prueba en vacío',
      'Pruebas con carga',
      'Instalación del equipo',
      'Instalación eléctrica'
    ],
    tieneBaterias: false,
    tieneHistorialAlarmas: false,
    tieneGraficosSVG: false,
    requiereVistaPanoramica: true,
    fotosMin: 16
  },
  [ServiceType.VISITA_TECNICA]: {
    key: ServiceType.VISITA_TECNICA,
    display: 'Visita Tecnica',
    pasos: [
      'Inspeccion visual del equipo y del area.',
      'Lectura de parametros en display y registro de alarmas.',
      'Verificacion de estado de baterias y mediciones basicas.'
    ],
    accionesPreset: [
      'Revisión general del equipo',
      'Revisión del sistema de control',
      'Baterías',
      'Sensores'
    ],
    tieneBaterias: true,
    tieneHistorialAlarmas: true,
    tieneGraficosSVG: false,
    requiereVistaPanoramica: true,
    fotosMin: 8
  },
  [ServiceType.CAMBIO_BATERIAS]: {
    key: ServiceType.CAMBIO_BATERIAS,
    display: 'Cambio de Baterias',
    pasos: [
      'Apertura del equipo y acceso al banco de baterias.',
      'Retiro de baterias antiguas y limpieza de compartimiento.',
      'Instalacion de baterias nuevas y conexionado.',
      'Medicion de voltaje flotacion y resistencia interna post-cambio.'
    ],
    accionesPreset: [
      'Revisión general del equipo',
      'Ajuste de bornes de conexión',
      'Baterías',
      'Arranque de equipo',
      'Prueba en vacío',
      'Pruebas con carga'
    ],
    tieneBaterias: true,
    tieneHistorialAlarmas: false,
    tieneGraficosSVG: false,
    requiereVistaPanoramica: true,
    fotosMin: 16
  },
  [ServiceType.PRUEBAS_FAULT_OVER]: {
    key: ServiceType.PRUEBAS_FAULT_OVER,
    display: 'Pruebas Fault Over',
    pasos: [
      'Verificacion de parametros pre-prueba.',
      'Prueba de transferencia a bypass interno.',
      'Prueba de transferencia a bypass externo.',
      'Simulacion de falla de red electrica (prueba baterias).',
      'Retorno a modo normal y verificacion post-prueba.'
    ],
    accionesPreset: [
      'Revisión general del equipo',
      'Baterías',
      'Filtros',
      'Tablero Bypass',
      'Arranque de equipo',
      'Prueba en vacío',
      'Pruebas con carga'
    ],
    tieneBaterias: true,
    tieneHistorialAlarmas: false,
    tieneGraficosSVG: false,
    requiereVistaPanoramica: true,
    fotosMin: 8
  },
  [ServiceType.APAGADO_ENCENDIDO]: {
    key: ServiceType.APAGADO_ENCENDIDO,
    display: 'Apagado y Encendido',
    pasos: [
      'Notificacion a usuarios y preparacion para apagado.',
      'Transferencia a bypass y apagado del UPS.',
      'Verificacion de parametros con equipo apagado.',
      'Encendido del UPS y transferencia a modo normal.',
      'Verificacion de parametros post-encendido.'
    ],
    accionesPreset: [
      'Arranque de equipo',
      'Prueba en vacío',
      'Pruebas con carga'
    ],
    tieneBaterias: false,
    tieneHistorialAlarmas: false,
    tieneGraficosSVG: false,
    requiereVistaPanoramica: true,
    fotosMin: 8
  },
  [ServiceType.REVISION_DIAGNOSTICO]: {
    key: ServiceType.REVISION_DIAGNOSTICO,
    display: 'Revision y Diagnostico',
    pasos: [
      'Inspeccion visual y revision de historial de eventos.',
      'Medicion de parametros electricos basicos.',
      'Emision de diagnostico y recomendaciones.'
    ],
    accionesPreset: [
      'Revisión general del equipo',
      'Revisión del sistema de control',
      'Sensores',
      'Elementos de medición'
    ],
    tieneBaterias: false,
    tieneHistorialAlarmas: false,
    tieneGraficosSVG: false,
    requiereVistaPanoramica: true,
    fotosMin: 4
  },
  [ServiceType.EMERGENCIA]: {
    key: ServiceType.EMERGENCIA,
    display: 'Emergencia',
    pasos: [
      'Identificacion de la falla o condicion de emergencia.',
      'Ejecucion de acciones inmediatas para proteccion del equipo.',
      'Verificacion de funcionamiento post-emergencia.'
    ],
    accionesPreset: [
      'Revisión general del equipo',
      'Revisión del sistema de control',
      'Baterías'
    ],
    tieneBaterias: false,
    tieneHistorialAlarmas: false,
    tieneGraficosSVG: false,
    requiereVistaPanoramica: false,
    fotosMin: 4
  }
};

export function getTemplate(tipo: ServiceType): ServiceTemplate {
  return SERVICE_TEMPLATES[tipo] ?? SERVICE_TEMPLATES[ServiceType.PREVENTIVO];
}

export function getPhotoSlotsForTipo(tipo: ServiceType, potenciaKva: number): number {
  const base = getTemplate(tipo).fotosMin;
  const kvaBonus =
    potenciaKva <= 10 ? 2 :
    potenciaKva <= 40 ? 6 :
    potenciaKva <= 80 ? 10 : 14;
  return base + kvaBonus;
}
