import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Describe columnas de TechnicalReport
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'TechnicalReport'
    ORDER BY ordinal_position;
  `;
  console.log('\n=== COLUMNAS TechnicalReport ===');
  (cols as any[]).forEach((c: any) => {
    console.log(`  ${c.column_name.padEnd(28)} ${c.data_type.padEnd(10)} null=${c.is_nullable}  default=${c.column_default ?? '-'}`);
  });

  // 2. Reportes existentes
  const reports = await prisma.technicalReport.findMany({
    orderBy: { creadoEn: 'desc' },
    take: 10,
    select: {
      id: true,
      otId: true,
      equipoId: true,
      tipoServicio: true,
      creadoEn: true,
      modificadoEn: true,
      offlineDirty: true,
    },
  });
  console.log('\n=== ÚltIMOS 10 REPORTES ===');
  reports.forEach((r: any) => {
    console.log(`  id=${r.id} | otId=${r.otId} | equipoId=${r.equipoId ?? 'null'} | tipo=${r.tipoServicio ?? '-'} | dirty=${r.offlineDirty}`);
  });

  // 3. Mostrar todos los reportes para OT-OM-CO-001 con detalle
  const allForOt = await prisma.technicalReport.findMany({
    where: { otId: { startsWith: 'OT-OM-CO-001' } },
    orderBy: { creadoEn: 'desc' },
  });
  console.log(`\n=== TODOS LOS REPORTES PARA OT-OM-CO-001 (${allForOt.length} total) ===`);
  allForOt.forEach((r: any, i: number) => {
    console.log(`\n--- Reporte ${i + 1} ---`);
    console.log('id:', r.id);
    console.log('otId:', r.otId);
    console.log('equipoId:', r.equipoId);
    console.log('tipoServicio:', r.tipoServicio);
    console.log('creadoEn:', r.creadoEn);
    console.log('modificadoEn:', r.modificadoEn);
    console.log('offlineDirty:', r.offlineDirty);
    const fl = (r as any).fotosLabeled;
    console.log('fotosLabeled length:', Array.isArray(fl) ? fl.length : (fl ? 'object' : 'null'));
    if (Array.isArray(fl) && fl.length > 0) {
      console.log('  fotosLabeled[0] keys:', Object.keys(fl[0]));
      console.log('  fotosLabeled[0].slotName:', fl[0].slotName);
      console.log('  fotosLabeled[0].base64 type:', typeof fl[0].base64);
      console.log('  fotosLabeled[0].base64 startsWith:', typeof fl[0].base64 === 'string' ? fl[0].base64.slice(0, 60) : fl[0].base64);
    }
    const f = (r as any).fotos;
    console.log('fotos length:', Array.isArray(f) ? f.length : (f ? 'object' : 'null'));
    if (Array.isArray(f) && f.length > 0) {
      console.log('  fotos[0] type:', typeof f[0]);
      console.log('  fotos[0] starts:', typeof f[0] === 'string' ? f[0].slice(0, 60) : f[0]);
    }
  });

  // 4. Probar upsert replicando EXACTAMENTE lo que envía el wizard
  console.log('\n=== TEST UPSERT WIZARD-LIKE ===');
  try {
    const wizardLike: any = {
      id: `rep_${Date.now()}`,
      otId: 'TEST-OBS-001',
      equipoId: '75d339a9-7af1-42be-ad03-075d6f193174',
      tipoServicio: 'Revision Y Diagnostico',
      voltajeEntrada: 220,
      voltajeSalida: 220,
      indicadoresBateria: { nivelCarga: 30, temperaturaC: 21, estadoCeldas: 'Optimo', bypassActivo: false },
      observacionesDiagnostico: 'El equipo funciona correctamente',
      comentariosAdicionales: '',
      firmaCliente: null,
      correccionesSupervisor: null,
      creadoEn: new Date().toISOString(),
      modificadoEn: new Date().toISOString(),
      offlineDirty: false,
      fotos: [''],
      fotosLabeled: [{ slotName: '1. Vista Frontal Gabinete', base64: '', description: 'x' }],
      horaFin: '17:00',
      panoramaFoto: null,
      pasosLista: [{ numero: 1, descripcion: 'paso' }],
    };
    const { id: _id, otId: _otId, equipoId: _eq, ...cleanData } = wizardLike;
    console.log('cleanData keys:', Object.keys(cleanData));
    const result = await prisma.technicalReport.upsert({
      where: {
        otId_equipoId: {
          otId: wizardLike.otId,
          equipoId: wizardLike.equipoId,
        }
      },
      update: { ...cleanData, offlineDirty: false },
      create: wizardLike,
    });
    console.log('UPSERT WIZARD-LIKE OK:', result.id);

    await prisma.technicalReport.delete({ where: { id: wizardLike.id } });
    console.log('Borrado test OK');
  } catch (e: any) {
    console.error('UPSERT WIZARD-LIKE FAIL - message:');
    console.error(e?.message);
    console.error('CODE:', e?.code);
  }
}

main().catch((e) => {
  console.error('ERROR:', e?.message);
  console.error('CODE:', e?.code);
}).finally(() => prisma.$disconnect());
