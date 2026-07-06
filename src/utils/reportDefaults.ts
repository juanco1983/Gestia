import { OT, Client, TechnicalReport } from '../types';

export const ALL_ACCIONES = [
  "Revisión general del equipo", "Limpieza general del equipo", "Ajuste mecánico del equipo",
  "Ajuste de bornes de conexión", "Revisión del sistema de control", "Baterías",
  "Tarjeta de fuentes de alimentación", "Tarjeta de protección", "Tarjeta de control",
  "Tarjeta de medición y señalización", "Paneles remotos", "Indicadores luminosos",
  "Sensores", "Elementos de medición", "Transformadores", "Relés",
  "Filtros", "Condensadores", "Accesorios", "Arranque de equipo",
  "Prueba en vacío", "Pruebas con carga", "Instalación del equipo", "Instalación eléctrica"
];

export const DEFAULT_RECOMENDACIONES = [
  "Se recomienda Instalar un sistema de Tablero de Transferencia, Micro P.O.D, en caso de mantenimiento o falla del equipo se traslada sin afectar su carga conectada, para que sean realizadas por personal técnico calificado y con experiencia en este tipo de equipos para evitar un mal funcionamiento del equipo UPS.",
  "El equipo está diseñado para trabajar con una tensión alterna de 220 VAC, debidamente conectado al sistema tierra.",
  "Se recomienda el cambio de las baterías por tiempo de vida útil, de 2 a 3 años.",
  "Se recomienda realizar limpiezas periódicas al ambiente donde se encuentra instalado el UPS de esta manera se puede controlar la acumulación y recirculación del polvo en el UPS.",
  "El UPS debe operar en un ambiente libre de polución, humedad y en un área climatizada teniendo una temperatura de 18°C a 21°C, una temperatura mayor a la descrita disminuye y acorta el tiempo de vida útil de las baterías.",
  "Realizar el mantenimiento preventivo anual al sistema de puesta a tierra del sistema de potencia, para asegurar la protección personal, de equipos y procesos del Cliente; como también para asegurar la referencia equipotencial entre sistemas.",
  "No conectar cargas indebidas, como son impresoras láser de mediana y gran capacidad, cafeteras, cargadores de baterías de celulares, taladros, motores universales, motobombas, etc. Sin antes haber evaluado la sumatoria de todas sus corrientes de arranque y haber dimensionado debidamente la capacidad del Equipo."
];

// Exact photo lists matching PDF requirements
export const PHOTO_SLOTS_BY_POTENCIA: Record<number, string[]> = {
  1: [
    "CARACTERÍSTICAS / SERIE- MODELO DEL UPS",
    "ESTADO INICIAL DEL EQUIPO UPS",
    "SISTEMA DE AIRE ACONDICIONADO",
    "RETIRO DEL EQUIPO PARA SU MANTENIMIENTO",
    "LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO",
    "LIMPIEZA DE LOS VENTILADORES DEL UPS"
  ],
  10: [
    "PLACA CARACTERÍSTICAS DEL UPS",
    "ESTADO INICIAL ENCONTRADO",
    "ESTADO DE POLUCION",
    "LIMPIEZA CON BROCHA",
    "SOPLETEO DE TRANSFORMADOR",
    "ESTADO DE BORNERAS",
    "LIMPIEZA DE BORNERAS",
    "AJUSTE MECANICO"
  ],
  20: [
    "CARACTERISTICAS DEL EQUIPO UPS",
    "ESTADO DEL UPS EN MODO LINEA",
    "LIMPIEZA ETAPA DE POTENCIA (1/2)",
    "LIMPIEZA ETAPA DE POTENCIA (2/2)",
    "LIMPIEZA GENERAL CON SOPLADOR",
    "LIMPIEZA DE LOS VENTILADORES WD40",
    "BATERIAS MODELO: RT1290",
    "BATERIAS AÑO 2018: 12VDC/ 9AH - 120 UNID",
    "MEDIONES DE BATERIAS POR UNIDAD",
    "MEDICIONES DE BATERIAS POR PAQUETE",
    "CUADRO DE VOLTAJE RED COMERCIAL",
    "CUADRO DE VOLTAJE DE SALIDA",
    "UPS EN MODO LINEA (ACTIVO)",
    "UBICACIÓN DE LOS EQUIPOS"
  ],
  40: [
    "PLACA CARACTERÍSTICAS DEL UPS",
    "ESTADO INICIAL DEL EQUIPO UPS",
    "CARACTERÍSTICAS DEL TRANSFORMADOR",
    "ESTADO INICIAL DEL TRANSFORMADOR",
    "TABLERO BYPASS",
    "ITM DE MANTENIMIENTO",
    "MANTENIMIENTO DE LA ETAPA DE POTENCIA",
    "MANTENIMIENTO Y LIMPIEZA DE BATERIAS",
    "CARACTERÍSTICAS DE LAS BATERIAS",
    "FECHA DE FABRICACIÓN DE BATERIAS",
    "MEDICIÓN DEL BANCO DE BATERÍAS",
    "MEDICIÓN DE LAS BATERISA",
    "PARÁMETROS DE SALIDA DEL UPS",
    "PARÁMETROS DE ENTRADA DEL UPS",
    "UPS FUNCIONANDO EN CARGA SIN ALERTAS",
    "UBICACIÓN DE LOS EQUIPOS"
  ],
  80: [
    "CARACTERISTICAS DEL EQUIPO UPS -Tensión/Modelo/Serie",
    "ESTADO DEL UPS CARGA ACTUAL-29%",
    "TARJETA DE MONITOREO SNMP",
    "SISTEMA DE TRANSFERENCIA BYPASS MANUAL",
    "LIMPIEZA DE LOS VENTILADORES INTERNOS",
    "LIMPIEZA DE LA ETAPA DE CONTROL",
    "LIMPIEZA DE LOS COMPONENTES ELECTRONICOS",
    "EQUIPO UPS MODO LINEA / BANCO EXTERNO",
    "FOTOGRAFIA DE LAS MEDICIONES DEL BANCO- UPS",
    "BATERIAS MODELO: 12VDC/55AH",
    "BATERIAS AÑO: 2020 – 34 UNID",
    "CUADRO DE MEDICIONES DE BATERIA",
    "BANCO DE BATERIAS EXTERNAS",
    "MEDICIONES TOTAL DE VOLTAJE DE BATERIA",
    "MEDICIONES DE VOLTAJE DC- BATERIAS",
    "MEDICIONES EN DESCARGA DE CADA BATERIAS",
    "FOTOGRAFIA DE LA UBICACIÓN DEL UPS 80KVA"
  ],
  160: [
    "CARACTERÍSTICAS DEL UPS",
    "05 MODULOS DE POTENCIA",
    "RETIRO DE MÓDULO DE POTENCIA",
    "REVISION DE MODULO DE POTENCIA",
    "DESMONTAJE DE VENTILADORE Y LIMPIEZA",
    "REVISION DE LA PARTE POSTERIOR",
    "MANTENIMIENTO DEL MODULO",
    "MEDICION DE FUSIBLES",
    "UPS CON TARJETA DE RED",
    "TEMPERATURA DE LA SALA",
    "TRANSFORMADOR DE AISLAMIENTO",
    "CARACTERISTICAS DE LAS BATERIAS",
    "MEDICION DE BATERIAS EN FLOTACION",
    "MEDICION DE RESISTENCIA INTERNA DE BATERIAS",
    "MEDICION DEL VOLTAJE TOTAL DEL PACKS",
    "MEDICION DE FUSIBLES AUXILIARES",
    "CARACTERISTICAS BANCO BATERIAS",
    "BANCO BATERIAS",
    "PARAMETROS DE ENTRADA Y SALIDA EN DISPLAY",
    "PARAMETROS DEL UPS EN DISPLAY"
  ]
};

export function getTechnicalSvg(slotName: string, index: number, otId: string = 'SLA'): string {
  const colors = [
    { primary: '#0ea5e9', secondary: '#38bdf8', bg: '#0f172a', accent: '#0284c7' }, // Slate Blue
    { primary: '#10b981', secondary: '#34d399', bg: '#022c22', accent: '#059669' }, // Emerald Dark
    { primary: '#f59e0b', secondary: '#fbbf24', bg: '#1c1917', accent: '#d97706' }, // Amber Stone
    { primary: '#6366f1', stroke: '#818cf8', secondary: '#818cf8', bg: '#1e1b4b', accent: '#4f46e5' }, // Indigo Deep
  ];
  const theme = colors[index % colors.length];
  
  let iconGraphic = '';
  const lower = slotName.toLowerCase();
  
  if (lower.includes('placa') || lower.includes('caracteristica')) {
    iconGraphic = `
      <rect x="130" y="80" width="140" height="100" rx="4" fill="none" stroke="${theme.secondary}" stroke-width="2"/>
      <path d="M 150 100 L 250 100" stroke="${theme.primary}" stroke-width="1.5" stroke-dasharray="2 2"/>
      <path d="M 150 120 L 210 120" stroke="${theme.primary}" stroke-width="1.5"/>
      <path d="M 150 140 L 230 140" stroke="${theme.primary}" stroke-width="1.5"/>
      <circle cx="240" cy="125" r="10" fill="none" stroke="${theme.secondary}" stroke-width="1.5"/>
      <path d="M 240 115 L 240 135" stroke="${theme.secondary}" stroke-width="1"/>
    `;
  } else if (lower.includes('bateria') || lower.includes('banco')) {
    iconGraphic = `
      <rect x="110" y="90" width="50" height="70" rx="3" fill="none" stroke="${theme.secondary}" stroke-width="2"/>
      <rect x="175" y="90" width="50" height="70" rx="3" fill="none" stroke="${theme.secondary}" stroke-width="2"/>
      <rect x="240" y="90" width="50" height="70" rx="3" fill="none" stroke="${theme.secondary}" stroke-width="2"/>
      <path d="M 135 80 L 135 90 M 200 80 L 200 90 M 265 80 L 265 90" stroke="${theme.primary}" stroke-width="2"/>
      <path d="M 160 125 L 175 125 M 225 125 L 240 125" stroke="${theme.primary}" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M 130 110 L 140 110 M 135 105 L 135 115" stroke="${theme.secondary}" stroke-width="1.5"/>
      <path d="M 195 110 L 205 110" stroke="${theme.secondary}" stroke-width="1.5"/>
      <path d="M 260 110 L 270 110 M 265 105 L 265 115" stroke="${theme.secondary}" stroke-width="1.5"/>
    `;
  } else if (lower.includes('bypass') || lower.includes('tablero') || lower.includes('itm') || lower.includes('fusible')) {
    iconGraphic = `
      <rect x="120" y="70" width="160" height="120" rx="6" fill="none" stroke="${theme.secondary}" stroke-width="2"/>
      <path d="M 150 130 L 170 130" stroke="${theme.secondary}" stroke-width="3"/>
      <circle cx="150" cy="130" r="4" fill="${theme.secondary}"/>
      <circle cx="170" cy="130" r="4" fill="${theme.secondary}"/>
      <path d="M 230 110 L 250 140" stroke="#ef4444" stroke-width="3"/>
      <circle cx="230" cy="110" r="4" fill="#ef4444"/>
      <circle cx="250" cy="140" r="4" fill="#ef4444"/>
      <path d="M 200 90 L 200 170" stroke="${theme.primary}" stroke-dasharray="4 4"/>
    `;
  } else if (lower.includes('limpieza') || lower.includes('ventilador') || lower.includes('sopleteo') || lower.includes('mantenimiento')) {
    iconGraphic = `
      <circle cx="200" cy="130" r="50" fill="none" stroke="${theme.secondary}" stroke-width="2"/>
      <circle cx="200" cy="130" r="10" fill="${theme.secondary}"/>
      <path d="M 200 120 C 180 100, 180 80, 200 80 C 220 80, 220 100, 200 120 Z" fill="${theme.primary}" opacity="0.6"/>
      <path d="M 200 140 C 180 160, 180 180, 200 180 C 220 180, 220 160, 200 140 Z" fill="${theme.primary}" opacity="0.6"/>
      <path d="M 190 130 C 170 110, 150 110, 150 130 C 150 150, 170 150, 190 130 Z" fill="${theme.primary}" opacity="0.6"/>
      <path d="M 210 130 C 230 110, 250 110, 250 130 C 250 150, 230 150, 210 130 Z" fill="${theme.primary}" opacity="0.6"/>
    `;
  } else if (lower.includes('transformador')) {
    iconGraphic = `
      <circle cx="170" cy="130" r="40" fill="none" stroke="${theme.secondary}" stroke-width="3"/>
      <circle cx="230" cy="130" r="40" fill="none" stroke="${theme.primary}" stroke-width="3"/>
      <path d="M 130 130 L 150 130 M 250 130 L 270 130" stroke="${theme.secondary}" stroke-width="2"/>
      <path d="M 185 105 A 25 25 0 0 1 215 105" stroke="${theme.secondary}" stroke-width="1" stroke-dasharray="2 2"/>
      <path d="M 185 155 A 25 25 0 0 0 215 155" stroke="${theme.secondary}" stroke-width="1" stroke-dasharray="2 2"/>
    `;
  } else {
    iconGraphic = `
      <path d="M 100 130 L 150 130 L 170 80 L 190 180 L 210 120 L 230 140 L 250 130 L 300 130" 
            stroke="${theme.secondary}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="190" cy="180" r="5" fill="#ef4444"/>
      <circle cx="170" cy="80" r="5" fill="#10b981"/>
    `;
  }
  
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect width="100%" height="100%" fill="${theme.bg}"/>
  <defs>
    <pattern id="grid-${index}" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.07"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid-${index})"/>
  <rect x="15" y="15" width="370" height="270" fill="none" stroke="${theme.primary}" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
  <g>${iconGraphic}</g>
  <rect x="15" y="245" width="370" height="40" fill="#020617" opacity="0.8"/>
  <text x="200" y="262" fill="#94a3b8" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle">
    REGISTRO TÉCNICO OFICIAL MAFORT
  </text>
  <text x="200" y="276" fill="${theme.secondary}" font-family="monospace" font-size="8.5" font-weight="bold" text-anchor="middle">
    ${slotName.toUpperCase()}
  </text>
  <rect x="25" y="25" width="90" height="18" rx="4" fill="#020617" opacity="0.75"/>
  <text x="32" y="37" fill="${theme.secondary}" font-family="monospace" font-size="7.5" font-weight="bold">
    ${otId} #0${index + 1}
  </text>
</svg>
  `.trim();

  try {
    const bytes = new TextEncoder().encode(svg);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return `data:image/svg+xml;base64,${base64}`;
  } catch (e) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

// Retrieve nearest capacity list
export function getPhotoSlotsForKva(kva: number): string[] {
  const capacities = [1, 10, 20, 40, 80, 160];
  // find closest less or equal, defaults to least
  let matched = 1;
  for (const cap of capacities) {
    if (kva >= cap) {
      matched = cap;
    }
  }
  return PHOTO_SLOTS_BY_POTENCIA[matched] || PHOTO_SLOTS_BY_POTENCIA[1];
}

export function generateDefaultReport(ot: OT, client: Client): TechnicalReport {
  const matchedSlots = getPhotoSlotsForKva(ot.potenciaKva);
  
  // Seed realistic photos
  const fotosLabeled = matchedSlots.map((slot, index) => {
    return {
      slotName: slot,
      base64: getTechnicalSvg(slot, index, ot.id),
      description: `Verificación técnica de: ${slot}`
    };
  });

  // Default UPS Characteristics grid
  const isHighPower = ot.potenciaKva >= 40;
  const caracteristicas: Record<string, string> = {
    "UBICACIÓN": `CENTRO DE COMPUTO - SALA DE SERVIDORES PRINCIPAL (${client.distrito})`,
    "EQUIPO": `${ot.tipoEquipo} - MODELO INDUSTRIAL CRÍTICO`,
    "POTENCIA": `${ot.potenciaKva} KVA`,
    "MARCA": isHighPower ? "EMERSON LIEBERT" : "APC Smart-UPS",
    "SERIE": `MF-${ot.id.replace('OT-','')}-${isHighPower ? '9880' : '5442'}`,
    "MODELO": isHighPower ? "EXM 3 Phase Series" : "RT-X Dual Conversion",
    "TENSIÓN ENTRADA": isHighPower ? "380 VAC 3PH + N + G" : "220VAC 1PH + G",
    "TENSIÓN SALIDA": isHighPower ? "380 VAC 3PH + N + G" : "220VAC 1PH + G",
    "FASES": isHighPower ? "TRIFASICO 3PH" : "MONOFASICO 1F",
    "NIVEL DE CARGA": "29%",
    "AÑO DE FABRICACIÓN": isHighPower ? "2020" : "2022",
    "ESTADO": "OPERATIVO",
    "BANCO INTERNO": isHighPower ? "NO" : "SI",
    "# BATERÍAS BANCO INTERNO": isHighPower ? "NO" : "16 UNIDADES",
    "AMPERAJE DE BATERÍAS": isHighPower ? "NO" : "9 AH",
    "AÑO DE FABRICACIÓN: BATERIAS INTERNAS": isHighPower ? "NO" : "2022",
    "BANCO EXTERNO": isHighPower ? "SI" : "NO",
    "# BATERÍAS BANCO EXTERNO": isHighPower ? "34 UNIDADES" : "NO",
    "AMPERAJE DE BATERÍAS Banco Externo": isHighPower ? "55 AH" : "NO",
    "AÑO DE FABRICACIÓN BATERÍAS EXTERNAS": isHighPower ? "2020" : "NO",
    "TARJETA SNMP": "SI",
    "PUNTO RED": "SI",
    "BYPASS INTERNO": "SI",
    "TABLERO BYPASS EXTERNO": "SI - SIN CORTE / ADOSABLE",
    "TVSS": "SI",
    "AIRE ACONDICIONADO": "SI",
    "EQUIPO DE ENTRADA": "SI",
    "EQUIPO ENTRADA": "TRANSFORMADOR DE AISLAMIENTO",
    "POTENCIA (Equip. Entrada)": `${isHighPower ? ot.potenciaKva + 10 : 15} KVA`,
    "MARCA (Equip. Entrada)": "DELTEC S.A.C",
    "SERIE (Equip. Entrada)": `TX-${ot.id.replace('OT-','')}-ISOL`,
    "MODELO (Equip. Entrada)": "ISO-K13 Dry Star Line",
    "TENSIÓN DE ENTRADA (Equip. Entrada)": isHighPower ? "480 VAC" : "380 VAC",
    "TENSIÓN DE SALIDA (Equip. Entrada)": "220 VAC",
    "FASES (Equip. Entrada)": isHighPower ? "TRIFASICO 3PH" : "MONOFASICO 1F",
    "ESTADO (Equip. Entrada)": "OPERATIVO"
  };

  return {
    id: `rep_${Date.now()}`,
    otId: ot.id,
    voltajeEntrada: isHighPower ? 380 : 220,
    voltajeSalida: isHighPower ? 380 : 220,
    indicadoresBateria: {
      nivelCarga: 94,
      temperaturaC: 21,
      estadoCeldas: 'Optimo',
      bypassActivo: false
    },
    observacionesDiagnostico: "El equipo UPS se encontró en óptimo estado de operación. Se realizó limpieza con brocha de polvo acumulado y sopleteo del transformador de aislamiento sin corte en la sala de servidores.",
    comentariosAdicionales: "Las baterías se encuentran cargadas al 94%. Se recomienda mantener la sala hermética y con aire acondicionado térmico a 21°C constantes para resguardar la vida de las celdas.",
    fotos: fotosLabeled.map(f => f.base64),
    creadoEn: new Date().toISOString(),
    modificadoEn: new Date().toISOString(),

    // Labeled fields
    informeN: `INF-2026-${ot.id.replace('OT-','')}`,
    hojaServicioN: `HJ-544-${ot.id.replace('OT-','')}`,
    asunto: `MANTENIMIENTO PREVENTIVO DE ${ot.tipoEquipo} DE ${ot.potenciaKva} KVA`,
    fechaServicio: ot.fechaProgramada || new Date().toISOString().split('T')[0],
    horaInicio: ot.horaInicioServicio || "09:00",
    tecnico1: ot.tecnicoTitular,
    tecnico2: ot.tecnicoApoyo || "Ninguno",
    antecedentes: `El siguiente informe Técnico se presenta a solicitud de la empresa: "${client.razonSocial}" de acuerdo con la programación y coordinación con el responsable por parte del Cliente, el "${client.contactoNombre}". El servicio se efectuó el día: ${ot.fechaProgramada || new Date().toLocaleDateString()} a las ${ot.horaInicioServicio || "09:00"}. Este equipo se encuentra ubicado en ${client.direccionSede}, ${client.distrito}. El equipo intervenido es el identificado como el UPS de potencia: ${ot.potenciaKva} KVA, marca: "${caracteristicas["MARCA"]}", modelo: "${caracteristicas["MODELO"]}" y con número de serie: "${caracteristicas["SERIE"]}". Se encontró el equipo cargando adecuadamente protegiendo las cargas del cliente sin alarmas residuales. El sistema cuenta con bypass activo interno/externo con tablero de maniobra sin corte de alimentación crítica.`,
    accionesRealizadas: ALL_ACCIONES,
    pasos: {
      paso1: "Se procedió a visualizar el estado actual del UPS, encontrando el equipo completamente operativo en modo inversor protegiendo las cargas informáticas de TI.",
      paso1_si_no: "si",
      paso1_funcionamiento: "modo inversor",
      paso1_bypass: isHighPower ? 'externo' : 'interno',
      paso2: "Se procedió a abrir la carcasa del equipo, tomando todas las medidas de seguridad reglamentarias que se tiene que realizar aun trabajando con tensión residual cero en condensadores.",
      paso3: "Se realizó la adecuada limpieza de polvo de las tarjetas principales y ajuste milimétrico de los bornes de cables y conductores en la zona de conexión de energía de potencia.",
      paso4: "Se procedió a hacer mediciones físicas individuales en las baterías en estado de flotación, registrando su resistencia interna promedio de 11.2 mOhm.",
      paso5: "Después del mantenimiento se procede a volver a instalar las cubiertas protectoras, encender el sistema para probarlo en vacío y posteriormente con carga nominal para validar estabilidad.",
      paso6: "El UPS queda completamente operativo, encendido en Modo Inversor y suministrando energía pura filtrada a su carga sin alarmas activas.",
      paso6_concluido: "si",
      paso6_observaciones: "Ninguna anomalía detectada, operatividad garantizada al 100%."
    },
    caracteristicas,
    fotosLabeled,
    medicionesEntrada: {
      lnVoltaje: isHighPower ? ["219", "220", "219"] : ["220", "0", "0"],
      lnIntensidad: isHighPower ? ["45", "44", "46"] : ["12", "0", "0"],
      frecuencia: ["60.0", "60.0", "60.0"],
      llVoltaje: isHighPower ? ["380", "381", "380"] : ["0", "0", "0"]
    },
    medicionesSalida: {
      lnVoltaje: isHighPower ? ["220", "220", "221"] : ["220", "0", "0"],
      lnIntensidad: isHighPower ? ["44", "43", "45"] : ["11", "0", "0"],
      frecuencia: ["60.0", "60.0", "60.0"],
      llVoltaje: isHighPower ? ["380", "380", "381"] : ["0", "0", "0"]
    },
    diagnosticoGabinete: {
      cuentaConGabinete: isHighPower ? "no" : "si",
      tipoEstructura: isHighPower ? "no" : "modo Rack",
      equipoEnBypass: "no"
    },
    revisionNormas: {
      mantenimientoRealizado: true,
      anioBaterias: 2022,
      ambienteHermetico: true,
      temperaturaSala: 21,
      estadoOperativo: true,
      inversorOperandoPorcentaje: 30
    },
    recomendaciones: DEFAULT_RECOMENDACIONES
  };
}
