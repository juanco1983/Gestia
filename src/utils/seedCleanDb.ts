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

    // Safety check: Skip seeding if users are already present
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        console.log('👥 Users already exist in the database. Skipping clean seeding to prevent data loss.');
        return;
    }

    console.log('🧹 Starting clean seeding of master data...');

    // Clear all existing tables to avoid constraint issues and start fresh
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
    await prisma.user.deleteMany();
    await prisma.targetVenta.deleteMany();

    // 1. Seed Users (Master)
    if (db.users && db.users.length > 0) {
        await prisma.user.createMany({ data: db.users });
        console.log(`👤 Seeded ${db.users.length} users.`);
    }

    // 2. Seed Clients (Master)
    if (db.clients && db.clients.length > 0) {
        await prisma.client.createMany({ data: db.clients });
        console.log(`🏢 Seeded ${db.clients.length} clients.`);
    }

    // 3. Seed Contratos Nuevos (Master)
    if (db.contratosNuevos && db.contratosNuevos.length > 0) {
        const allowedKeys = [
            'id', 'anio', 'n_contrato', 'comercial', 'comercialId', 'cliente', 'clientId',
            'detalle', 'monto_sin_igv', 'monto_inc_igv', 'monto_facturar_sin_igv',
            'monto_facturar_inc_igv', 'monto_facturado_sin_igv', 'monto_facturado_inc_igv',
            'por_facturar_sin_igv', 'por_facturar_inc_igv', 'monto_pagado_sin_igv',
            'monto_pagado_inc_igv', 'pendiente_pago_sin_igv', 'pendiente_pago_inc_igv',
            'vence', 'oc', 'h2h_bcp', 'estado', 'tipo_contract', 'tipo_contrato',
            'fecha_inicio', 'fecha_fin', 'fecha_fin_original', 'comentarios',
            'presupuesto_total_usd', 'saldo_disponible_usd', 'monto_original',
            'moneda', 'pdf_url'
        ];
        const sanitizedContracts = db.contratosNuevos.map((c: any) => {
            const sanitized: any = {};
            allowedKeys.forEach(key => {
                if (c[key] !== undefined) {
                    sanitized[key] = c[key];
                }
            });
            return sanitized;
        });
        await prisma.contratoNuevo.createMany({ data: sanitizedContracts });
        console.log(`📋 Seeded ${sanitizedContracts.length} contratos nuevos.`);
    }

    // 4. Seed Target Ventas (Master)
    if (db.targetVentas && db.targetVentas.length > 0) {
        await prisma.targetVenta.createMany({ data: db.targetVentas });
        console.log(`📈 Seeded ${db.targetVentas.length} targets de ventas.`);
    }

    // 5. Seed Clean Test Equipment Catalog (Master)
    console.log('⚙️ Seeding test equipment catalog for active contracts...');
    
    // Clinica Internacional (client_1) - Contract cont_251 (UPS 30KVA)
    const clinicaEquipos = [
        {
            id: 'eq_ci_forza',
            codigo: 'CI-UPS-FORZA',
            tipo: 'UPS',
            marca: 'Forza',
            modelo: 'FDC-15K',
            serie: 'FZ-98234-A',
            potenciaKva: 15,
            ubicacion: 'Sala A - Data Center',
            clienteId: 'client_1',
            contratoId: 'cont_251',
            estado: 'Operativo'
        },
        {
            id: 'eq_ci_apc',
            codigo: 'CI-UPS-APC',
            tipo: 'UPS',
            marca: 'APC',
            modelo: 'Smart-UPS 20K',
            serie: 'APC-78129-B',
            potenciaKva: 20,
            ubicacion: 'Sala B - Servidores',
            clienteId: 'client_1',
            contratoId: 'cont_251',
            estado: 'Operativo'
        },
        {
            id: 'eq_ci_eaton',
            codigo: 'CI-UPS-EATON',
            tipo: 'UPS',
            marca: 'Eaton',
            modelo: '9PX-30K',
            serie: 'ET-34891-C',
            potenciaKva: 30,
            ubicacion: 'Sala C - Centro de Control',
            clienteId: 'client_1',
            contratoId: 'cont_251',
            estado: 'Operativo'
        }
    ];

    // Banco de Crédito del Perú (client_2) - Contract cont_250 (Climatización 50HP)
    const bcpEquipos = [
        {
            id: 'eq_bcp_liebert',
            codigo: 'BCP-AC-LIEBERT',
            tipo: 'Aire Acondicionado',
            marca: 'Liebert',
            modelo: 'PEX-50HP',
            serie: 'LB-19028-X',
            potenciaKva: 50,
            ubicacion: 'Sótano 1 - Chiller principal',
            clienteId: 'client_2',
            contratoId: 'cont_250',
            estado: 'Operativo'
        },
        {
            id: 'eq_bcp_stulz',
            codigo: 'BCP-AC-STULZ',
            tipo: 'Aire Acondicionado',
            marca: 'Stulz',
            modelo: 'CyberAir 40HP',
            serie: 'SZ-89341-Y',
            potenciaKva: 40,
            ubicacion: 'Piso 4 - Rack Room 12',
            clienteId: 'client_2',
            contratoId: 'cont_250',
            estado: 'Operativo'
        }
    ];

    await prisma.equipo.createMany({
        data: [...clinicaEquipos, ...bcpEquipos]
    });
    console.log(`⚙️ Seeded ${clinicaEquipos.length + bcpEquipos.length} test equipment records.`);

    console.log('✨ Clean seed completed successfully! Ready for multi-equipment operations.');
}

main()
    .catch((e) => {
        console.error('❌ Clean seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
