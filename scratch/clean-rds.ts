import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = "postgresql://gestia_admin:GestiaDevPass2026!@gestia-dev-postgres.cmrsac8isuqs.us-east-1.rds.amazonaws.com:5432/gestia?schema=public&sslmode=require";

async function main() {
  console.log('🧹 Eliminando toda la información operacional de AWS RDS (Clientes, Contratos, Adendas, Equipos y OTs)...\n');

  const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const reportCount = await prisma.technicalReport.deleteMany();
    console.log(`   - TechnicalReport: ${reportCount.count} eliminados`);

    const asigCount = await prisma.otEquipoAsignacion.deleteMany();
    console.log(`   - OtEquipoAsignacion: ${asigCount.count} eliminados`);

    const servicioCount = await prisma.servicioEquipo.deleteMany();
    console.log(`   - ServicioEquipo: ${servicioCount.count} eliminados`);

    const otCount = await prisma.oT.deleteMany();
    console.log(`   - OT técnicas: ${otCount.count} eliminados`);

    const lineasCount = await prisma.ordenTrabajoLinea.deleteMany();
    console.log(`   - OrdenTrabajoLinea (cuotas/financieras): ${lineasCount.count} eliminados`);

    const deletedEquipoAmpliaciones = await prisma.equipoAmpliacion.deleteMany();
    console.log(`   - Equipos de adendas: ${deletedEquipoAmpliaciones.count} eliminados`);

    const deletedEquipos = await prisma.equipo.deleteMany();
    console.log(`   - Equipos máster: ${deletedEquipos.count} eliminados`);

    const deletedAdendas = await prisma.contratoAmpliacion.deleteMany();
    console.log(`   - Adendas de contratos: ${deletedAdendas.count} eliminados`);

    const deletedContratos = await prisma.contratoNuevo.deleteMany();
    console.log(`   - Contratos comerciales: ${deletedContratos.count} eliminados`);

    const deletedClients = await prisma.client.deleteMany();
    console.log(`   - Clientes: ${deletedClients.count} eliminados`);

    console.log('\n✅ Base de datos Cloud AWS RDS reseteada con éxito a 0 registros operacionales.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
