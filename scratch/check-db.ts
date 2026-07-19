import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log("Using DATABASE_URL:", connectionString);
  const isAWS = connectionString!.includes("amazonaws.com");
  const pool = new Pool({ 
    connectionString,
    ssl: isAWS ? { rejectUnauthorized: false } : undefined
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const otCount = await prisma.oT.count();
  const lineCount = await prisma.ordenTrabajoLinea.count();
  const repCount = await prisma.technicalReport.count();

  console.log('OT count:', otCount);
  console.log('OrdenTrabajoLinea count:', lineCount);
  console.log('TechnicalReport count:', repCount);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
