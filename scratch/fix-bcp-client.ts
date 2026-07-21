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
  // 1. Create client 'Banco de Crédito del Perú' if not exists
  const clientId = 'client_bcp';
  const existingClient = await prisma.client.findUnique({ where: { id: clientId } });
  
  if (!existingClient) {
    await prisma.client.create({
      data: {
        id: clientId,
        razonSocial: 'Banco de Crédito del Perú',
        ruc: '20100047218',
        direccionSede: 'Calle Centenario 156',
        distrito: 'La Molina',
        contactoNombre: 'Sr. Roberto Torres',
        contactoEmail: 'rtorres@bcp.com.pe',
        contactoTelefono: '912345678',
        pais: 'Perú',
        provincia: 'Lima'
      }
    });
    console.log("Client created: Banco de Crédito del Perú");
  }

  // 2. Update contract cont_250 to point to client_bcp
  await prisma.contratoNuevo.update({
    where: { id: 'cont_250' },
    data: {
      clientId: clientId
    }
  });
  console.log("Contract cont_250 updated to point to client_bcp");

  // 3. Update existing OTs for cont_250 to use client_bcp
  await prisma.oT.updateMany({
    where: { contratoId: 'cont_250' },
    data: {
      clientId: clientId
    }
  });
  console.log("Existing OTs for cont_250 updated to point to client_bcp");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
