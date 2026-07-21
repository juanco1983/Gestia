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
  // 1. Create client 'Clínica Internacional' if not exists
  const clientId = 'client_clinica_internacional';
  const existingClient = await prisma.client.findUnique({ where: { id: clientId } });
  
  if (!existingClient) {
    await prisma.client.create({
      data: {
        id: clientId,
        razonSocial: 'Clínica Internacional',
        ruc: '20100234567',
        direccionSede: 'Av. Guardia Civil 385',
        distrito: 'San Borja',
        contactoNombre: 'Dr. Alejandro Silva',
        contactoEmail: 'asilva@clinica-internacional.com.pe',
        contactoTelefono: '987654321',
        pais: 'Perú',
        provincia: 'Lima'
      }
    });
    console.log("Client created: Clínica Internacional");
  }

  // 2. Update contract cont_251 to point to client_clinica_internacional
  await prisma.contratoNuevo.update({
    where: { id: 'cont_251' },
    data: {
      clientId: clientId
    }
  });
  console.log("Contract cont_251 updated to point to client_clinica_internacional");

  // 3. Update existing OTs for cont_251 to use client_clinica_internacional
  await prisma.oT.updateMany({
    where: { contratoId: 'cont_251' },
    data: {
      clientId: clientId
    }
  });
  console.log("Existing OTs for cont_251 updated to point to client_clinica_internacional");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
