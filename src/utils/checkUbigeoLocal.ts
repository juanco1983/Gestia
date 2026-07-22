import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function main() {
  let connectionString = `${process.env.DATABASE_URL}`;
  console.log("DATABASE_URL:", connectionString ? connectionString.substring(0, 30) + '...' : 'undefined');

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

  try {
    const paisesCount = await prisma.pais.count();
    const provinciasCount = await prisma.provincia.count();
    const distritosCount = await prisma.distrito.count();

    console.log(`Counts -> Paises: ${paisesCount}, Provincias: ${provinciasCount}, Distritos: ${distritosCount}`);

    const samplePaises = await prisma.pais.findMany({ take: 5 });
    console.log("Sample Paises:", samplePaises);
  } catch (err) {
    console.error("Error checking DB:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
