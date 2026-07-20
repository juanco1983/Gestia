import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Eliminando todas las OTs y datos relacionados...\n');

  const reportCount = await prisma.technicalReport.deleteMany();
  console.log(`   TechnicalReport: ${reportCount.count} eliminados`);

  const servicioCount = await prisma.servicioEquipo.deleteMany();
  console.log(`   ServicioEquipo: ${servicioCount.count} eliminados`);

  const asigCount = await prisma.otEquipoAsignacion.deleteMany();
  console.log(`   OtEquipoAsignacion: ${asigCount.count} eliminados`);

  const otCount = await prisma.oT.deleteMany();
  console.log(`   OT: ${otCount.count} eliminados`);

  const lineasCount = await prisma.ordenTrabajoLinea.deleteMany();
  console.log(`   OrdenTrabajoLinea: ${lineasCount.count} eliminados`);

  console.log('\n✅ Base de datos limpia. Listo para empezar de 0.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
