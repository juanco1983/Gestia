import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

let connectionString = `${process.env.DATABASE_URL}`;
const isAWS = connectionString.includes("amazonaws.com");
if (isAWS) {
  connectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, "");
  connectionString += (connectionString.includes("?") ? "&" : "?") + "sslmode=require";
}
const pool = new Pool({
  connectionString,
  ssl: isAWS ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function wipeDatabase() {
  console.log("Limpieza total operativa extendida (conserva usuarios y catalogos)...");
  const t0 = Date.now();
  try {
    const deletedReports = await prisma.technicalReport.deleteMany();
    console.log(`- technicalReport: ${deletedReports.count}`);

    const deletedAsignaciones = await prisma.otEquipoAsignacion.deleteMany();
    console.log(`- otEquipoAsignacion: ${deletedAsignaciones.count}`);

    const deletedServicios = await prisma.servicioEquipo.deleteMany();
    console.log(`- servicioEquipo: ${deletedServicios.count}`);

    const deletedVisitas = await prisma.visita.deleteMany();
    console.log(`- visita: ${deletedVisitas.count}`);

    const deletedOts = await prisma.oT.deleteMany();
    console.log(`- OT: ${deletedOts.count}`);

    const deletedOtLineas = await prisma.ordenTrabajoLinea.deleteMany();
    console.log(`- ordenTrabajoLinea: ${deletedOtLineas.count}`);

    const deletedEquipoAmpliaciones = await prisma.equipoAmpliacion.deleteMany();
    console.log(`- equipoAmpliacion: ${deletedEquipoAmpliaciones.count}`);

    const deletedAdendas = await prisma.contratoAmpliacion.deleteMany();
    console.log(`- contratoAmpliacion: ${deletedAdendas.count}`);

    const deletedEquipos = await prisma.equipo.deleteMany();
    console.log(`- equipo: ${deletedEquipos.count}`);

    const deletedContratos = await prisma.contratoNuevo.deleteMany();
    console.log(`- contratoNuevo: ${deletedContratos.count}`);

    const deletedLegacyContracts = await prisma.contract.deleteMany();
    console.log(`- Contract (legacy): ${deletedLegacyContracts.count}`);

    const deletedTargets = await prisma.targetVenta.deleteMany();
    console.log(`- TargetVenta: ${deletedTargets.count}`);

    const deletedLogs = await prisma.userActivityLog.deleteMany();
    console.log(`- UserActivityLog: ${deletedLogs.count}`);

    const deletedClients = await prisma.client.deleteMany();
    console.log(`- client: ${deletedClients.count}`);

    console.log(`Limpieza completa en ${Date.now() - t0} ms. Catalogo (Pais/Provincia/Distrito/TipoContrato) y usuarios conservados.`);
  } catch (err) {
    console.error("ERROR al limpiar:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

wipeDatabase();