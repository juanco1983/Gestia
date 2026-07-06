import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const dbPath = path.join(process.cwd(), 'db.json');
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(rawData);

    console.log('Starting migration...');

    // Clear existing data to allow re-running
    // Order matters because of potential foreign key constraints (though we don't have strict relational FKs defined in schema yet, it's good practice)
    await prisma.userActivityLog.deleteMany();
    await prisma.technicalReport.deleteMany();
    await prisma.oT.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
    await prisma.ordenTrabajoLinea.deleteMany();
    await prisma.contratoNuevo.deleteMany();
    await prisma.targetVenta.deleteMany();
    
    // 1. Users
    if (db.users && db.users.length > 0) {
        // Remove password hashing if it's already hashed in db.json
        await prisma.user.createMany({ data: db.users });
        console.log(`Migrated ${db.users.length} users.`);
    }

    // 2. Clients
    if (db.clients && db.clients.length > 0) {
        await prisma.client.createMany({ data: db.clients });
        console.log(`Migrated ${db.clients.length} clients.`);
    }

    // 3. Contracts
    if (db.contracts && db.contracts.length > 0) {
        await prisma.contract.createMany({ data: db.contracts });
        console.log(`Migrated ${db.contracts.length} contracts.`);
    }

    // 4. OTs
    if (db.ots && db.ots.length > 0) {
        await prisma.oT.createMany({ data: db.ots });
        console.log(`Migrated ${db.ots.length} OTs.`);
    }

    // 5. Reports
    if (db.reports && db.reports.length > 0) {
        await prisma.technicalReport.createMany({ data: db.reports });
        console.log(`Migrated ${db.reports.length} reports.`);
    }

    // 6. Logs (UserActivityLog)
    if (db.logs && db.logs.length > 0) {
        await prisma.userActivityLog.createMany({ data: db.logs });
        console.log(`Migrated ${db.logs.length} logs.`);
    }

    // 7. Ordenes de Trabajo
    if (db.ordenesTrabajo && db.ordenesTrabajo.length > 0) {
        const mappedOTL = db.ordenesTrabajo.map((otl: any) => {
            const { n_factura, nro_guia_informe, observacion, seguimiento, tipo_contratacion, creadoPor, creadoEn, modificadoPor, modificadoEn, ...rest } = otl;
            return {
                ...rest,
                factura: n_factura || null,
            };
        });
        await prisma.ordenTrabajoLinea.createMany({ data: mappedOTL });
        console.log(`Migrated ${db.ordenesTrabajo.length} ordenes de trabajo.`);
    }

    // 8. Contratos Nuevos
    if (db.contratosNuevos && db.contratosNuevos.length > 0) {
        await prisma.contratoNuevo.createMany({ data: db.contratosNuevos });
        console.log(`Migrated ${db.contratosNuevos.length} contratos nuevos.`);
    }

    // 9. Targets Ventas
    if (db.targetsVentas && db.targetsVentas.length > 0) {
        await prisma.targetVenta.createMany({ data: db.targetsVentas });
        console.log(`Migrated ${db.targetsVentas.length} targets de ventas.`);
    }

    console.log('Migration completed successfully.');
}

main()
    .catch((e) => {
        console.error('Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
