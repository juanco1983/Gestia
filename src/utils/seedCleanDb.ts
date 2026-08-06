import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { INITIAL_USERS } from '../mockData';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

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
    console.log('🧹 Starting clean reset of operational test data in database...');

    // Clear all existing operational tables
    await prisma.userActivityLog.deleteMany();
    await prisma.technicalReport.deleteMany();
    await prisma.servicioEquipo.deleteMany();
    await prisma.otEquipoAsignacion.deleteMany();
    await prisma.oT.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.ordenTrabajoLinea.deleteMany();
    await prisma.equipoAmpliacion.deleteMany();
    await prisma.equipo.deleteMany();
    await prisma.contratoAmpliacion.deleteMany();
    await prisma.contratoNuevo.deleteMany();
    await prisma.client.deleteMany();
    await prisma.targetVenta.deleteMany();

    // Preserve existing users or re-create default admin users if DB has none
    const userCount = await prisma.user.count();
    if (userCount === 0 && INITIAL_USERS.length > 0) {
        const bcrypt = await import('bcryptjs');
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('mafort', salt);
        const usersWithPassword = INITIAL_USERS.map((u: any) => ({ ...u, password: hash }));
        await prisma.user.createMany({ data: usersWithPassword as any });
        console.log(`👤 Seeded ${INITIAL_USERS.length} default admin users.`);
    }

    console.log('✨ Clean reset completed successfully! Operational tables are at 0 records.');
}

main()
    .catch((e) => {
        console.error('❌ Clean reset failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
