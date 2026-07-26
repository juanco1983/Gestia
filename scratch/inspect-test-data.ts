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

async function inspectData() {
  const ots = await prisma.oT.findMany();
  console.log("=== ALL OTs IN DB ===");
  ots.forEach(o => {
    console.log(`OT ID: ${o.id} | estado: "${o.estado}" | equipoId: "${o.equipoId}" | clientId: "${o.clientId}"`);
  });

  const reports = await prisma.technicalReport.findMany();
  console.log("\n=== ALL REPORTS IN DB ===");
  console.log("Count:", reports.length);

  await pool.end();
  await prisma.$disconnect();
}

inspectData().catch(console.error);
