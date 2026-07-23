import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
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

async function run() {
  const ots = await prisma.oT.findMany({
    orderBy: { id: 'desc' },
    take: 10
  });
  console.log('--- ALL RECENT OTS ---');
  console.log(JSON.stringify(ots, null, 2));

  const lineas = await prisma.ordenTrabajoLinea.findMany({
    orderBy: { id: 'desc' },
    take: 10
  });
  console.log('--- ALL RECENT OT LINEAS ---');
  console.log(JSON.stringify(lineas, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

run();
