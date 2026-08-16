import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

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

async function linkEquipos() {
  console.log("=== LINK equipos HIST -> cliente Prosegur Test S.A. (cli_hist_1) ===");
  const equipos = await prisma.equipo.findMany({ where: { codigo: { in: ['UPS-HIST-001', 'UPS-HIST-002'] } } });
  for (const e of equipos) {
    await prisma.equipo.update({
      where: { id: e.id },
      data: { clienteId: 'cli_hist_1', estado: 'Operativo' },
    });
    console.log(`  ✓ ${e.codigo} (${e.id}) -> clienteId=cli_hist_1 estado=Operativo`);
  }
  await pool.end();
  await prisma.$disconnect();
}

linkEquipos().catch(console.error);