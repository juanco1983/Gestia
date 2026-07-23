import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import ubigeos from 'ubigeo-peru';
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
    const rawData = (ubigeos as any)?.inei || (ubigeos as any)?.default?.inei || (ubigeos as any)?.default || ubigeos;
    console.log("Is rawData array?", Array.isArray(rawData), "Length:", Array.isArray(rawData) ? rawData.length : 'N/A');

    if (!Array.isArray(rawData) || rawData.length === 0) {
      console.error("ubigeo-peru data format error. Raw object keys:", Object.keys(ubigeos || {}));
      return;
    }

    console.log("Clearing old ubigeo tables...");
    await prisma.distrito.deleteMany({});
    await prisma.provincia.deleteMany({});
    await prisma.pais.deleteMany({});

    const pais = await prisma.pais.upsert({
      where: { id: 'PER' },
      update: { nombre: 'Perú' },
      create: { id: 'PER', nombre: 'Perú' }
    });

    await prisma.pais.upsert({ where: { id: 'CHL' }, update: { nombre: 'Chile' }, create: { id: 'CHL', nombre: 'Chile' } });
    await prisma.pais.upsert({ where: { id: 'COL' }, update: { nombre: 'Colombia' }, create: { id: 'COL', nombre: 'Colombia' } });
    await prisma.pais.upsert({ where: { id: 'MEX' }, update: { nombre: 'México' }, create: { id: 'MEX', nombre: 'México' } });

    const departamentos = rawData.filter((u: any) => u.provincia === '00' && u.distrito === '00');
    const provincias = rawData.filter((u: any) => u.provincia !== '00' && u.distrito === '00');
    const distritos = rawData.filter((u: any) => u.provincia !== '00' && u.distrito !== '00');

    console.log(`Found ${departamentos.length} deps, ${provincias.length} provs, ${distritos.length} dists`);

    let provCount = 0;
    for (const prov of provincias) {
      const provId = `${prov.departamento}${prov.provincia}`;
      const dep = departamentos.find((d: any) => d.departamento === prov.departamento);
      const nombreStr = dep ? `${prov.nombre} (${dep.nombre})` : prov.nombre;
      try {
        await prisma.provincia.upsert({
          where: { id: provId },
          update: { nombre: nombreStr, paisId: pais.id },
          create: { id: provId, nombre: nombreStr, paisId: pais.id }
        });
        provCount++;
      } catch (e) {
        console.error("Error upserting prov:", provId, e);
      }
    }

    let distCount = 0;
    for (const dist of distritos) {
      const provId = `${dist.departamento}${dist.provincia}`;
      const distId = `${dist.departamento}${dist.provincia}${dist.distrito}`;
      try {
        await prisma.distrito.upsert({
          where: { id: distId },
          update: { nombre: dist.nombre, provinciaId: provId },
          create: { id: distId, nombre: dist.nombre, provinciaId: provId }
        });
        distCount++;
      } catch (e) {
        // quiet
      }
    }

    console.log(`SUCCESS! Seeded ${provCount} provincias and ${distCount} distritos in local DB!`);
  } catch (err) {
    console.error("Error in main seed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
