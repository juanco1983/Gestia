import { Client, Contract, OT, ServiceType, EquipmentType, OTStatus, User, UserActivityLog } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_0',
    username: 'Administrador General',
    email: 'admin@mafort.pe',
    role: 'Administrador',
    estado: 'Activo',
    area: 'Administración General',
    ultimoIngreso: '2026-06-29 08:00',
    creadoEn: '2026-01-01',
    allowedModules: ['Dashboard', 'Monitoreo', 'GestionOTs', 'ClientesContratos', 'Ventas', 'Tecnico', 'Supervisor', 'Cliente', 'Usuarios']
  },
  {
    id: 'user_1',
    username: 'María López',
    email: 'ventas@mafort.pe',
    role: 'Ventas',
    estado: 'Activo',
    area: 'Planeamiento Comercial',
    ultimoIngreso: '2026-06-29 08:15',
    creadoEn: '2026-01-10',
    allowedModules: ['Dashboard', 'Monitoreo', 'GestionOTs', 'ClientesContratos', 'Ventas']
  },
  {
    id: 'user_2',
    username: 'Carlos Ocsa',
    email: 'carlos.ocsa@mafort.pe',
    role: 'Tecnico',
    estado: 'Activo',
    area: 'Mantenimiento de Campo',
    ultimoIngreso: '2026-06-29 07:30',
    creadoEn: '2026-01-12',
    allowedModules: ['Dashboard', 'Monitoreo', 'Tecnico']
  },
  {
    id: 'user_3',
    username: 'Ing. Roberto Salas',
    email: 'supervisor@mafort.pe',
    role: 'Supervisor',
    estado: 'Activo',
    area: 'Control de Calidad (SLA)',
    ultimoIngreso: '2026-06-29 08:05',
    creadoEn: '2026-01-15',
    allowedModules: ['Dashboard', 'Monitoreo', 'Supervisor']
  },
  {
    id: 'user_4',
    username: 'Ana Gutiérrez',
    email: 'ana.gutierrez@prosegur.pe',
    role: 'Cliente',
    estado: 'Activo',
    area: 'Infraestructura TI - Prosegur',
    ultimoIngreso: '2026-06-28 16:30',
    creadoEn: '2026-02-01',
    clientId: 'client_1',
    allowedModules: ['Dashboard', 'Monitoreo', 'Cliente']
  },
  {
    id: 'user_5',
    username: 'Juan Córdova',
    email: 'juan.cordova@materiagris.pe',
    role: 'Tecnico',
    estado: 'Activo',
    area: 'Seguridad Eléctrica & Supervisor',
    ultimoIngreso: '2026-06-29 07:45',
    creadoEn: '2026-01-20',
    allowedModules: ['Dashboard', 'Monitoreo', 'Tecnico']
  },
  {
    id: 'user_6',
    username: 'Gino Murillo',
    email: 'gino.murillo@mafort.pe',
    role: 'Tecnico',
    estado: 'Activo',
    area: 'Climatización & Control',
    ultimoIngreso: '2026-06-29 08:30',
    creadoEn: '2026-01-20',
    allowedModules: ['Dashboard', 'Monitoreo', 'Tecnico']
  }
];

export const INITIAL_LOGS: UserActivityLog[] = [
  {
    id: 'log_1',
    timestamp: '2026-06-29 07:30:12',
    userEmail: 'carlos.ocsa@mafort.pe',
    action: 'INICIO_SESION',
    details: 'Acceso móvil de campo',
    ipAddress: '192.168.10.35'
  },
  {
    id: 'log_2',
    timestamp: '2026-06-29 08:00:04',
    userEmail: 'admin@mafort.pe',
    action: 'INICIO_SESION',
    details: 'Inicio de jornada administrativa',
    ipAddress: '192.168.10.10'
  },
  {
    id: 'log_3',
    timestamp: '2026-06-29 08:05:22',
    userEmail: 'supervisor@mafort.pe',
    action: 'INICIO_SESION',
    details: 'Revisión de informes pendientes',
    ipAddress: '192.168.10.12'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client_1',
    razonSocial: 'Prosegur Tecnología S.A.',
    ruc: '20506830209',
    direccionSede: 'Av. Separadora Industrial 349, Ate',
    distrito: 'Ate',
    contactoNombre: 'Ana Gutiérrez',
    contactoEmail: 'ana.gutierrez@prosegur.pe',
    contactoTelefono: '946782301'
  },
  {
    id: 'client_2',
    razonSocial: 'Clínica San Pablo S.A.C.',
    ruc: '20503689023',
    direccionSede: 'Av. El Polo 789, Surco',
    distrito: 'Santiago de Surco',
    contactoNombre: 'Ing. Pedro Vásquez',
    contactoEmail: 'pedro.vasquez@sanpablo.pe',
    contactoTelefono: '987654321'
  },
  {
    id: 'client_3',
    razonSocial: 'Banco Interbank S.A.',
    ruc: '20100053455',
    direccionSede: 'Av. Carlos Villarán 140, La Victoria',
    distrito: 'La Victoria',
    contactoNombre: 'Luis Fernández',
    contactoEmail: 'luis.fernandez@interbank.pe',
    contactoTelefono: '912345678'
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'contra_1',
    clientId: 'client_1',
    tipoEquipo: EquipmentType.UPS,
    visitasAnuales: 4,
    fechaInicio: '2026-01-01',
    fechaFin: '2026-12-31'
  },
  {
    id: 'contra_2',
    clientId: 'client_2',
    tipoEquipo: EquipmentType.UPS,
    visitasAnuales: 6,
    fechaInicio: '2026-01-15',
    fechaFin: '2027-01-14'
  },
  {
    id: 'contra_3',
    clientId: 'client_3',
    tipoEquipo: EquipmentType.CLIMATIZACION,
    visitasAnuales: 12,
    fechaInicio: '2026-03-01',
    fechaFin: '2027-02-28'
  }
];

// --------------------------------------------------------------------------
// 5 OTs QUE CUBREN TODO EL FLUJO DE VIDA
// --------------------------------------------------------------------------
// OT-001  →  CERRADA       (flujo completo terminado: facturado y cerrado)
// OT-002  →  FIRMADA       (conformidad del cliente, lista para facturar)
// OT-003  →  EN_REVISION   (informe enviado, siendo revisado por supervisor)
// OT-004  →  PROGRAMADA    (asignada y programada para hoy)
// OT-005  →  CREADA        (recién generada, sin técnico ni programación)
// --------------------------------------------------------------------------

export const INITIAL_OTS: OT[] = [];
