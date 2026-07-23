import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

let connectionString = `${process.env.DATABASE_URL}`;
const isAWS = connectionString.includes("amazonaws.com");
if (isAWS) {
  connectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, "");
}
const pool = new Pool({ 
  connectionString,
  ssl: isAWS ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function wipeDatabase() {
  console.log("🧹 Iniciando limpieza completa de Clientes, Contratos, Adendas, Equipos y OTs...");

  try {
    // Delete in reverse dependency order
    const deletedReports = await prisma.technicalReport.deleteMany();
    console.log(`- Informes técnicos eliminados: ${deletedReports.count}`);

    const deletedAsignaciones = await prisma.otEquipoAsignacion.deleteMany();
    console.log(`- Programaciones/Asignaciones de equipos eliminadas: ${deletedAsignaciones.count}`);

    const deletedServicios = await prisma.servicioEquipo.deleteMany();
    console.log(`- Historial de servicios de equipos eliminado: ${deletedServicios.count}`);

    const deletedOts = await prisma.oT.deleteMany();
    console.log(`- OTs técnicas eliminadas: ${deletedOts.count}`);

    const deletedOtLineas = await prisma.ordenTrabajoLinea.deleteMany();
    console.log(`- OTs financieras (cuotas) eliminadas: ${deletedOtLineas.count}`);

    const deletedEquipoAmpliaciones = await prisma.equipoAmpliacion.deleteMany();
    console.log(`- Equipos de adendas eliminados: ${deletedEquipoAmpliaciones.count}`);

    const deletedEquipos = await prisma.equipo.deleteMany();
    console.log(`- Equipos máster eliminados: ${deletedEquipos.count}`);

    const deletedAdendas = await prisma.contratoAmpliacion.deleteMany();
    console.log(`- Adendas de contratos eliminadas: ${deletedAdendas.count}`);

    const deletedContratos = await prisma.contratoNuevo.deleteMany();
    console.log(`- Contratos comerciales eliminados: ${deletedContratos.count}`);

    const deletedClients = await prisma.client.deleteMany();
    console.log(`- Clientes eliminados: ${deletedClients.count}`);

    // Update db.json local fallback file to match clean state
    const dbPath = path.join(process.cwd(), 'db.json');
    if (fs.existsSync(dbPath)) {
      const rawData = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(rawData);
      db.clients = [];
      db.contracts = [];
      db.equipments = [];
      db.ots = [];
      db.ordenesTrabajo = [];
      db.otEquipoAsignaciones = [];
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
      console.log("- Archivo db.json reseteado limpiamente a 0 registros.");
    }

    console.log("✅ Base de datos reseteada con éxito. Listo para empezar las pruebas desde 0.");
  } catch (err) {
    console.error("❌ Error al limpiar la base de datos:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

wipeDatabase();
