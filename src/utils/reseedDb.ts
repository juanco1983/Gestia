import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Limpiando TODAS las tablas...');
  await prisma.userActivityLog.deleteMany();
  await prisma.technicalReport.deleteMany();
  await prisma.oT.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.ordenTrabajoLinea.deleteMany();
  await prisma.contratoNuevo.deleteMany();
  await prisma.targetVenta.deleteMany();
  console.log('✅ Tablas vaciadas.');

  const bcrypt = await import('bcryptjs');
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('mafort', salt);

  const users = [
    { id: 'user_0', username: 'Administrador General', email: 'admin@mafort.pe', password: hash, role: 'Administrador', estado: 'Activo', area: 'Administración General', ultimoIngreso: '2026-06-29 08:00', creadoEn: '2026-01-01', allowedModules: ['Dashboard','Monitoreo','GestionOTs','ClientesContratos','Ventas','Tecnico','Supervisor','Cliente','Usuarios','InventarioEquipos'] },
    { id: 'user_1', username: 'María López', email: 'ventas@mafort.pe', password: hash, role: 'Ventas', estado: 'Activo', area: 'Planeamiento Comercial', ultimoIngreso: '2026-06-29 08:15', creadoEn: '2026-01-10', allowedModules: ['Dashboard','Monitoreo','GestionOTs','ClientesContratos','Ventas','InventarioEquipos'] },
    { id: 'user_2', username: 'Carlos Ocsa', email: 'carlos.ocsa@mafort.pe', password: hash, role: 'Tecnico', estado: 'Activo', area: 'Mantenimiento de Campo', ultimoIngreso: '2026-06-29 07:30', creadoEn: '2026-01-12', allowedModules: ['Dashboard','Monitoreo','Tecnico','InventarioEquipos'] },
    { id: 'user_3', username: 'Ing. Roberto Salas', email: 'supervisor@mafort.pe', password: hash, role: 'Supervisor', estado: 'Activo', area: 'Control de Calidad (SLA)', ultimoIngreso: '2026-06-29 08:05', creadoEn: '2026-01-15', allowedModules: ['Dashboard','Monitoreo','Supervisor','InventarioEquipos'] },
    { id: 'user_4', username: 'Ana Gutiérrez', email: 'ana.gutierrez@prosegur.pe', password: hash, role: 'Cliente', estado: 'Activo', area: 'Infraestructura TI - Prosegur', ultimoIngreso: '2026-06-28 16:30', creadoEn: '2026-02-01', clientId: 'client_1', allowedModules: ['Dashboard','Monitoreo','Cliente'] },
    { id: 'user_5', username: 'Juan Córdova', email: 'juan.cordova@materiagris.pe', password: hash, role: 'Tecnico', estado: 'Activo', area: 'Seguridad Eléctrica & Supervisor', ultimoIngreso: '2026-06-29 07:45', creadoEn: '2026-01-20', allowedModules: ['Dashboard','Monitoreo','Tecnico','InventarioEquipos'] },
    { id: 'user_6', username: 'Gino Murillo', email: 'gino.murillo@mafort.pe', password: hash, role: 'Tecnico', estado: 'Activo', area: 'Climatización & Control', ultimoIngreso: '2026-06-29 08:30', creadoEn: '2026-01-20', allowedModules: ['Dashboard','Monitoreo','Tecnico'] },
  ];
  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log(`✅ ${users.length} usuarios creados.`);

  // ─── CLIENTES ───────────────────────────────────────────────────────────
  const clients = [
    { id: 'client_1', razonSocial: 'Prosegur Tecnología S.A.', ruc: '20506830209', direccionSede: 'Av. Separadora Industrial 349, Ate', distrito: 'Ate', contactoNombre: 'Ana Gutiérrez', contactoEmail: 'ana.gutierrez@prosegur.pe', contactoTelefono: '946782301' },
    { id: 'client_2', razonSocial: 'Clínica San Pablo S.A.C.', ruc: '20503689023', direccionSede: 'Av. El Polo 789, Surco', distrito: 'Santiago de Surco', contactoNombre: 'Ing. Pedro Vásquez', contactoEmail: 'pedro.vasquez@sanpablo.pe', contactoTelefono: '987654321' },
    { id: 'client_3', razonSocial: 'Banco Interbank S.A.', ruc: '20100053455', direccionSede: 'Av. Carlos Villarán 140, La Victoria', distrito: 'La Victoria', contactoNombre: 'Luis Fernández', contactoEmail: 'luis.fernandez@interbank.pe', contactoTelefono: '912345678' },
  ];
  for (const c of clients) {
    await prisma.client.create({ data: c });
  }
  console.log(`✅ ${clients.length} clientes creados.`);

  // ─── CONTRATOS (técnicos) ───────────────────────────────────────────────
  const contracts = [
    { id: 'contra_1', clientId: 'client_1', tipoEquipo: 'UPS', visitasAnuales: 4, fechaInicio: '2026-01-01', fechaFin: '2026-12-31' },
    { id: 'contra_2', clientId: 'client_2', tipoEquipo: 'UPS', visitasAnuales: 6, fechaInicio: '2026-01-15', fechaFin: '2027-01-14' },
    { id: 'contra_3', clientId: 'client_3', tipoEquipo: 'Climatización de Precisión', visitasAnuales: 12, fechaInicio: '2026-03-01', fechaFin: '2027-02-28' },
  ];
  for (const c of contracts) {
    await prisma.contract.create({ data: c });
  }
  console.log(`✅ ${contracts.length} contratos técnicos creados.`);

  // ─── 5 OTs QUE CUBREN TODO EL FLUJO ────────────────────────────────────
  const ots = [
    { id: 'OT-001', clientId: 'client_1', tipoMantenimiento: 'Preventivo', tipoEquipo: 'UPS', potenciaKva: 60, fechaProgramada: '2026-06-10', horaProgramada: '09:00', horaFinProgramada: '12:00', horaInicioServicio: '09:15', horaFinServicio: '11:45', tecnicoTitularId: 'user_2', tecnicoTitular: 'Carlos Ocsa', tecnicoApoyoId: 'user_6', tecnicoApoyo: 'Gino Murillo', estado: 'Cerrada', origen: 'Contrato', otFinancieraId: 'otl_1' },
    { id: 'OT-002', clientId: 'client_2', tipoMantenimiento: 'Preventivo', tipoEquipo: 'UPS', potenciaKva: 40, fechaProgramada: '2026-06-20', horaProgramada: '10:00', horaFinProgramada: '13:00', horaInicioServicio: '10:10', horaFinServicio: '12:50', tecnicoTitularId: 'user_5', tecnicoTitular: 'Juan Córdova', estado: 'Firmada', origen: 'Contrato', otFinancieraId: 'otl_2' },
    { id: 'OT-004', clientId: 'client_1', tipoMantenimiento: 'Preventivo', tipoEquipo: 'UPS', potenciaKva: 100, fechaProgramada: '2026-06-30', horaProgramada: '14:00', horaFinProgramada: '17:00', tecnicoTitularId: 'user_5', tecnicoTitular: 'Juan Córdova', tecnicoApoyoId: 'user_6', tecnicoApoyo: 'Gino Murillo', estado: 'Programada', origen: 'Contrato' },
    { id: 'OT-005', clientId: 'client_3', tipoMantenimiento: 'Emergencia', tipoEquipo: 'Rectificador Industrial', potenciaKva: 120, fechaProgramada: '2026-07-05', tecnicoTitularId: '', tecnicoTitular: '', estado: 'Creada', origen: 'Emergencia' },
  ];
  for (const ot of ots) {
    await prisma.oT.create({ data: ot as any });
  }
  console.log(`✅ ${ots.length} OTs creadas.`);

  // ─── INFORMES TÉCNICOS (para OTs que ya fueron ejecutadas) ──────────────
  const reports = [
    // OT-001 (CERRADA) - informe completo
    { id: 'rpt_001', otId: 'OT-001', voltajeEntrada: 220, voltajeSalida: 220, indicadoresBateria: { nivelCarga: 98, temperaturaC: 22, estadoCeldas: 'Optimo', bypassActivo: false }, observacionesDiagnostico: 'UPS operando dentro de parámetros normales. Baterías con vida útil de 2 años restantes.', comentariosAdicionales: 'Se realizó limpieza de filtros y ajuste de bornes.', fotos: [], firmaCliente: 'data:image/png;base64,firma_prosegur', creadoEn: '2026-06-10T11:45:00Z', modificadoEn: '2026-06-10T11:45:00Z' },
    // OT-002 (FIRMADA) - informe completo con firma
    { id: 'rpt_002', otId: 'OT-002', voltajeEntrada: 218, voltajeSalida: 220, indicadoresBateria: { nivelCarga: 85, temperaturaC: 24, estadoCeldas: 'Regular', bypassActivo: false }, observacionesDiagnostico: 'Se reemplazaron 4 baterías preventivamente. Voltaje de salida estabilizado.', comentariosAdicionales: 'Cliente solicita revisión trimestral adicional.', fotos: [], firmaCliente: 'data:image/png;base64,firma_sanpablo', creadoEn: '2026-06-20T12:50:00Z', modificadoEn: '2026-06-20T12:50:00Z' },

  ];
  for (const r of reports) {
    await prisma.technicalReport.create({ data: r as any });
  }
  console.log(`✅ ${reports.length} informes técnicos creados.`);

  // ─── CONTRATOS NUEVOS (financieros) ─────────────────────────────────────
  const contratosNuevos = [
    { id: 'cont_001', cliente: 'Prosegur Tecnología S.A.', tipo_contrato: 'Mantenimiento Preventivo UPS 60KVA + 100KVA', fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31', estado: 'VIGENTE', comercial: 'María López', comentarios: '4 visitas anuales programadas', clientId: 'client_1', comercialId: 'user_1' },
    { id: 'cont_002', cliente: 'Clínica San Pablo S.A.C.', tipo_contrato: 'Mantenimiento Preventivo UPS 40KVA', fecha_inicio: '2026-01-15', fecha_fin: '2027-01-14', estado: 'VIGENTE', comercial: 'María López', comentarios: '6 visitas anuales', clientId: 'client_2', comercialId: 'user_1' },
    { id: 'cont_003', cliente: 'Banco Interbank S.A.', tipo_contrato: 'Climatización 80HP + Rectificador 120KVA', fecha_inicio: '2026-03-01', fecha_fin: '2027-02-28', estado: 'VIGENTE', comercial: 'María López', comentarios: 'Mantenimiento mensual', clientId: 'client_3', comercialId: 'user_1' },
  ];
  for (const cn of contratosNuevos) {
    await prisma.contratoNuevo.create({ data: cn as any });
  }
  console.log(`✅ ${contratosNuevos.length} contratos financieros creados.`);

  // ─── ÓRDENES DE TRABAJO FINANCIERAS ─────────────────────────────────────
  const ordenes = [
    { id: 'otl_1', anio: 2026, ot_marco: 100, ot: '100-1', mes: 'JUN', fecha: '2026-06-10', nombre_solicitante: 'María López', clientId: 'client_1', razon_social: 'Prosegur Tecnología S.A.', empresa: 'PROSEGUR', descripcion: 'Mant. Preventivo UPS 60KVA - Sala Servidores', n_cotizacion: 'COT-2026-041', n_oc_os: 'OC-3890', simbolo_moneda: '$', monto_marco_sin_igv: 4200, monto_marco_inc_igv: 4956, sub_importe_sin_igv: 4200, sub_importe_inc_igv: 4956, total_usd: 4200, anio_prog_facturacion: 2026, mes_prog_servicio: 'JUN', mes_prog_facturacion: 'JUN', tipo_venta: 'MANTENIMIENTO', pendiente: 'EJECUTADO', estado: 'FACTURADO', factura: 'F001-004521', comercialId: 'user_1', comercial: 'María López', estatus: [{ fecha: '2026-06-01', autor: 'María López', texto: 'OT generada' }, { fecha: '2026-06-15', autor: 'María López', texto: 'Facturado' }], otTecnicaId: 'OT-001', listaParaFacturar: true },
    { id: 'otl_2', anio: 2026, ot_marco: 200, ot: '200-1', mes: 'JUN', fecha: '2026-06-20', nombre_solicitante: 'María López', clientId: 'client_2', razon_social: 'Clínica San Pablo S.A.C.', empresa: 'SAN PABLO', descripcion: 'Mant. Preventivo UPS 40KVA - Centro Datos', n_cotizacion: 'COT-2026-058', n_oc_os: 'OC-3925', simbolo_moneda: '$', monto_marco_sin_igv: 3500, monto_marco_inc_igv: 4130, sub_importe_sin_igv: 3500, sub_importe_inc_igv: 4130, total_usd: 3500, anio_prog_facturacion: 2026, mes_prog_servicio: 'JUN', mes_prog_facturacion: 'JUN', tipo_venta: 'MANTENIMIENTO', pendiente: 'EJECUTADO', estado: 'POR FACTURAR', factura: '', comercialId: 'user_1', comercial: 'María López', estatus: [{ fecha: '2026-06-12', autor: 'María López', texto: 'OT generada' }], otTecnicaId: 'OT-002', listaParaFacturar: true },

    { id: 'otl_4', anio: 2026, ot_marco: 100, ot: '100-2', mes: 'JUN', fecha: '2026-06-30', nombre_solicitante: 'María López', clientId: 'client_1', razon_social: 'Prosegur Tecnología S.A.', empresa: 'PROSEGUR', descripcion: 'Mant. Preventivo UPS 100KVA - Sala Energía', n_cotizacion: 'COT-2026-085', n_oc_os: 'OC-3978', simbolo_moneda: '$', monto_marco_sin_igv: 7500, monto_marco_inc_igv: 8850, sub_importe_sin_igv: 7500, sub_importe_inc_igv: 8850, total_usd: 7500, anio_prog_facturacion: 2026, mes_prog_servicio: 'JUN', mes_prog_facturacion: 'JUL', tipo_venta: 'MANTENIMIENTO', pendiente: 'POR EJECUTAR', estado: 'POR FACTURAR', factura: '', comercialId: 'user_1', comercial: 'María López', estatus: [{ fecha: '2026-06-22', autor: 'María López', texto: 'OT creada' }], otTecnicaId: 'OT-004', listaParaFacturar: false },
    { id: 'otl_5', anio: 2026, ot_marco: 300, ot: '300-2', mes: 'JUL', fecha: '2026-07-05', nombre_solicitante: 'María López', clientId: 'client_3', razon_social: 'Banco Interbank S.A.', empresa: 'INTERBANK', descripcion: 'Emergencia Rectificador 120KVA - Subestación', n_cotizacion: 'COT-2026-091', n_oc_os: '', simbolo_moneda: '$', monto_marco_sin_igv: 9200, monto_marco_inc_igv: 10856, sub_importe_sin_igv: 9200, sub_importe_inc_igv: 10856, total_usd: 9200, anio_prog_facturacion: 2026, mes_prog_servicio: 'JUL', mes_prog_facturacion: 'JUL', tipo_venta: 'EMERGENCIA', pendiente: 'POR EJECUTAR', estado: 'POR FACTURAR', factura: '', comercialId: 'user_1', comercial: 'María López', estatus: [{ fecha: '2026-06-29', autor: 'Luis Fernández', texto: 'Solicitud emergencia' }], otTecnicaId: 'OT-005', listaParaFacturar: false },
  ];
  for (const o of ordenes) {
    await prisma.ordenTrabajoLinea.create({ data: o as any });
  }
  console.log(`✅ ${ordenes.length} líneas financieras creadas.`);

  // ─── TARGET VENTAS ──────────────────────────────────────────────────────
  const targets = [
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
    { id: 't_12', anio: 2026, mes_num: 12, mes: 'DIC', target_ventas_usd: 65000 },
  ];
  for (const t of targets) {
    await prisma.targetVenta.create({ data: t });
  }
  console.log(`✅ ${targets.length} targets de ventas creados.`);

  // ─── LOGS ───────────────────────────────────────────────────────────────
  const logs = [
    { id: 'log_1', timestamp: '2026-06-29 07:30:12', userEmail: 'carlos.ocsa@mafort.pe', action: 'INICIO_SESION', details: 'Acceso móvil de campo', ipAddress: '192.168.10.35' },
    { id: 'log_2', timestamp: '2026-06-29 08:00:04', userEmail: 'admin@mafort.pe', action: 'INICIO_SESION', details: 'Inicio de jornada', ipAddress: '192.168.10.10' },
    { id: 'log_3', timestamp: '2026-06-29 08:05:22', userEmail: 'supervisor@mafort.pe', action: 'INICIO_SESION', details: 'Revisión de informes', ipAddress: '192.168.10.12' },
  ];
  for (const l of logs) {
    await prisma.userActivityLog.create({ data: l });
  }
  console.log(`✅ ${logs.length} logs de actividad creados.`);

  console.log('\\n🎉 ¡Datos reseteados exitosamente con 5 OTs de flujo completo!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
