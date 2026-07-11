import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config'; // Carga las variables de entorno de .env

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:mafort_secure_pass_2026@localhost:5432/mafort_db?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTest() {
  console.log(">>> [STRESS TEST] Iniciando prueba de concurrencia e idempotencia...");

  // 1. Limpieza y preparación de semillas de prueba
  const contratoId = "test_contrato_123";
  const clientId = "test_cliente_123";
  const otId = "test_ot_123";
  const reportId = "test_report_123";

  // Limpiar registros antiguos de prueba si existen
  await prisma.$executeRawUnsafe(`DELETE FROM "RepuestoUtilizado" WHERE "reportId" = $1`, reportId);
  await prisma.$executeRawUnsafe(`DELETE FROM "TechnicalReport" WHERE "id" = $1`, reportId);
  await prisma.$executeRawUnsafe(`DELETE FROM "OT" WHERE "id" = $1`, otId);
  await prisma.$executeRawUnsafe(`DELETE FROM "TarifarioContrato" WHERE "contratoId" = $1`, contratoId);
  await prisma.$executeRawUnsafe(`DELETE FROM "ContratoNuevo" WHERE "id" = $1`, contratoId);
  await prisma.$executeRawUnsafe(`DELETE FROM "Client" WHERE "id" = $1`, clientId);

  // Crear Cliente
  await prisma.client.create({
    data: {
      id: clientId,
      razonSocial: "Cliente de Prueba Concurrente S.A.",
      ruc: "20123456789",
      direccionSede: "Av. Industrial 500",
      distrito: "Ate",
      contactoNombre: "Juan Pérez",
      contactoEmail: "juan.perez@test.com",
      contactoTelefono: "987654321"
    }
  });

  // Crear Contrato Nuevo con un saldo inicial de 1000 USD
  await prisma.contratoNuevo.create({
    data: {
      id: contratoId,
      cliente: "Cliente de Prueba Concurrente S.A.",
      clientId,
      presupuesto_total_usd: 1000.00,
      saldo_disponible_usd: 1000.00,
      saldo_actual_contrato: 1000.00,
      sobregiro: false,
      estado: "Vigente"
    }
  });

  // Registrar tarifas en TarifarioContrato
  await prisma.tarifarioContrato.create({
    data: {
      id: "tar_mo_1",
      contratoId,
      concepto: "Hora Técnico",
      precioUnitario: 50.00 // 50 USD/hora
    }
  });

  // Crear OT con 8 horas de potenciaKva (como placeholder de horas)
  await prisma.oT.create({
    data: {
      id: otId,
      clientId,
      contratoId,
      tipoMantenimiento: "Correctivo",
      tipoEquipo: "UPS",
      potenciaKva: 8.00, // 8 horas estimadas
      fechaProgramada: "2026-07-11",
      tecnicoTitular: "Técnico de Pruebas",
      estado: "Ejecutada"
    }
  });

  // Crear Informe Técnico
  await prisma.technicalReport.create({
    data: {
      id: reportId,
      otId,
      voltajeEntrada: 220,
      voltajeSalida: 220,
      indicadoresBateria: {},
      observacionesDiagnostico: "Revisión realizada con éxito",
      comentariosAdicionales: "Ninguno",
      creadoEn: "2026-07-11",
      modificadoEn: "2026-07-11",
      fotos: []
    }
  });

  // Registrar Repuestos Utilizados (e.g. 2 baterías a 100 USD c/u)
  await prisma.repuestoUtilizado.create({
    data: {
      id: "rep_util_1",
      reportId,
      concepto: "Batería 12V 9Ah",
      cantidad: 2,
      precioUnitarioSnapshot: 100.00 // 200 USD en repuestos
    }
  });

  // Costo total esperado del reporte:
  // Mano de Obra: 8 horas * 50 USD = 400 USD
  // Repuestos: 2 * 100 USD = 200 USD
  // Total = 600 USD
  // Saldo final esperado en el contrato: 1000 - 600 = 400 USD.

  console.log(">>> [STRESS TEST] Semillas preparadas.");
  console.log(">>> [STRESS TEST] Disparando 10 solicitudes de liquidación concurrentes...");

  // Simular la llamada local al backend importando o simulando las peticiones directas de base de datos
  const liquidar = async (i: number) => {
    try {
      const res = await fetch("http://localhost:3000/api/reports/liquidar", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idInforme: reportId })
      });
      const data = await res.json();
      console.log(`Llamada #${i} - Status: ${res.status} - Resp:`, data);
      return data;
    } catch (e: any) {
      console.error(`Llamada #${i} - Error:`, e.message);
    }
  };

  // Lanzar las 10 llamadas simultáneamente
  const promises = [];
  for (let i = 1; i <= 10; i++) {
    promises.push(liquidar(i));
  }

  await Promise.all(promises);

  // 6. Consultar saldo final en el contrato para verificar consistencia
  const finalContract = await prisma.contratoNuevo.findUnique({
    where: { id: contratoId }
  });

  console.log("\n>>> [RESULTADO FINAL DEL CONTRATO]");
  console.log("Saldo Inicial: 1000.00 USD");
  console.log("Costo Total Esperado del Reporte: 600.00 USD (Mano de Obra: 400.00 + Repuestos: 200.00)");
  console.log("Saldo Final Real en DB:", finalContract?.saldo_actual_contrato, "USD");
  console.log("Sobregiro:", finalContract?.sobregiro);

  if (finalContract?.saldo_actual_contrato === 400.00) {
    console.log(">>> [ÉXITO] El test de concurrencia e idempotencia pasó correctamente.");
  } else {
    console.error(">>> [FALLO] Inconsistencia en el saldo final.");
  }

  // Cerrar conexiones
  await prisma.$disconnect();
  await pool.end();
}

runTest();
