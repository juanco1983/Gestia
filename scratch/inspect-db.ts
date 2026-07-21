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
  const clients = await prisma.client.findMany();
  console.log("=== CLIENTS ===");
  console.log(clients.map(c => ({ id: c.id, razonSocial: c.razonSocial })));

  const contracts = await prisma.contratoNuevo.findMany({
    include: {
      equipos: true
    }
  });
  console.log("=== CONTRACTS ===");
  console.log(contracts.map(c => ({ id: c.id, cliente: c.cliente, clientId: c.clientId, equiposCount: c.equipos.length })));

  const ots = await prisma.oT.findMany();
  console.log("=== OTS ===");
  console.log(ots.map(o => ({ id: o.id, clientId: o.clientId, contratoId: o.contratoId, equipoId: o.equipoId, estado: o.estado })));

  const lines = await prisma.ordenTrabajoLinea.findMany();
  console.log("=== ORDEN TRABAJO LINEAS ===");
  console.log(lines.map(l => ({ id: l.id, ot: l.ot, razon_social: l.razon_social, clientId: l.clientId, contratoId: l.contratoId })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
