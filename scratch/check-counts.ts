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

async function main() {
  console.log("=== ESTADO DE LA BASE DE DATOS TRAS LIMPIEZA ===");
  console.log("Paises:", await prisma.pais.count());
  console.log("Provincias:", await prisma.provincia.count());
  console.log("Distritos:", await prisma.distrito.count());
  console.log("Clientes:", await prisma.client.count());
  console.log("Contratos:", await prisma.contratoNuevo.count());
  console.log("Adendas:", await prisma.contratoAmpliacion.count());
  console.log("Equipos:", await prisma.equipo.count());
  console.log("OTs Técnicas:", await prisma.oT.count());
  console.log("OT Líneas (Cuotas):", await prisma.ordenTrabajoLinea.count());
  console.log("Informes Técnicos:", await prisma.technicalReport.count());
  console.log("Usuarios:", await prisma.user.count());
}

main().finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
