import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = "postgresql://gestia_admin:GestiaDevPass2026!@gestia-dev-postgres.cmrsac8isuqs.us-east-1.rds.amazonaws.com:5432/gestia?schema=public&sslmode=require";

async function main() {
  console.log('🧹 Eliminando todas las OTs y datos relacionados de AWS RDS...\n');

  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
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

    console.log('\n✅ Base de datos RDS limpia.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
