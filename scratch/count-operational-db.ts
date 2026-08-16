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
const pool = new Pool({ connectionString, ssl: isAWS ? { rejectUnauthorized: false } : undefined });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const models = [
  'client', 'contract', 'visita', 'oT', 'technicalReport', 'ordenTrabajoLinea',
  'contratoNuevo', 'contratoAmpliacion', 'equipo', 'equipoAmpliacion',
  'servicioEquipo', 'otEquipoAsignacion', 'targetVenta', 'userActivityLog', 'user'
] as const;

async function main() {
  const out: string[] = [];
  for (const m of models) {
    try {
      const count = await (prisma as any)[m].count();
      out.push(`${m}: ${count}`);
    } catch (e) {
      out.push(`${m}: ERROR`);
    }
  }
  console.log("=== CONTEO ===\n" + out.join("\n"));
  await prisma.$disconnect();
  await pool.end();
}

main();