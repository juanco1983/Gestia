import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import ubigeos from 'ubigeo-peru';
import 'dotenv/config';

async function main() {
  let connectionString = `${process.env.DATABASE_URL}`;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in the environment variables.');
  }

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

  // Evitar volver a sembrar si ya existen datos en la base de datos
  const distritosCount = await prisma.distrito.count();
  if (distritosCount > 0) {
    console.log(`Database already has ${distritosCount} districts. Skipping seed.`);
    await prisma.$disconnect();
    return;
  }

  console.log('Seeding ALL Ubigeo data from ubigeo-peru package...');

  const data = ubigeos.inei;

  console.log('Clearing old ubigeo data...');
  await prisma.distrito.deleteMany({});
  await prisma.provincia.deleteMany({});
  await prisma.pais.deleteMany({});

  const pais = await prisma.pais.upsert({
    where: { id: 'PER' },
    update: { nombre: 'Perú' },
    create: { id: 'PER', nombre: 'Perú' }
  });

  const departamentos = data.filter((u: any) => u.provincia === '00' && u.distrito === '00');
  const provincias = data.filter((u: any) => u.provincia !== '00' && u.distrito === '00');
  const distritos = data.filter((u: any) => u.provincia !== '00' && u.distrito !== '00');

  console.log(`Found ${departamentos.length} departamentos/provincias, ${provincias.length} provincias, ${distritos.length} distritos`);

  let totalProvincias = 0;
  for (const prov of provincias) {
    const provId = `${prov.departamento}${prov.provincia}`;
    const dep = departamentos.find((d: any) => d.departamento === prov.departamento);
    const nombreStr = dep ? `${prov.nombre} (${dep.nombre})` : prov.nombre;
    
    try {
      await prisma.provincia.upsert({
        where: { id: provId },
        update: { nombre: nombreStr },
        create: { id: provId, nombre: nombreStr, paisId: pais.id }
      });
      totalProvincias++;
    } catch (e) {
      console.error(`Error inserting province ${nombreStr} (ID: ${provId}):`, e);
    }
  }
  console.log(`Inserted ${totalProvincias} provinces`);

  let totalDistritos = 0;
  for (const dist of distritos) {
    const provId = `${dist.departamento}${dist.provincia}`;
    const distId = `${dist.departamento}${dist.provincia}${dist.distrito}`;

    try {
      await prisma.distrito.upsert({
        where: { id: distId },
        update: { nombre: dist.nombre },
        create: { id: distId, nombre: dist.nombre, provinciaId: provId }
      });
      totalDistritos++;
    } catch (e) {
      console.error(`Error inserting district ${dist.nombre} (ID: ${distId}). Missing province ID: ${provId}`);
    }
  }
  console.log(`Inserted ${totalDistritos} districts`);

  console.log('Ubigeo seeding completed successfully.');
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
