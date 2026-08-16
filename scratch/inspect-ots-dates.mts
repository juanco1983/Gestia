import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const utcDateStr = (d: Date) => d.toISOString().split('T')[0];

async function main() {
  const ots = await prisma.oT.findMany({
    orderBy: { id: 'desc' },
    take: 20,
    select: { id: true, fechaProgramada: true, estado: true },
  });
  const today = new Date();
  console.log('Hoy local:', localDateStr(today), '| Hoy UTC:', utcDateStr(today));

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    last7.push({ local: localDateStr(d), utc: utcDateStr(d) });
  }
  console.log('Ventana 7 dias (local | utc):');
  last7.forEach(x => console.log('  ', x.local, '|', x.utc));

  console.log('\n=== ULTIMAS 20 OTs ===');
  ots.forEach((o: any) => {
    console.log(`  id=${o.id} | fechaProgramada=${o.fechaProgramada} | estado=${o.estado}`);
  });

  const localSet = new Set(last7.map(x => x.local));
  const utcSet = new Set(last7.map(x => x.utc));
  const all = await prisma.oT.findMany({ select: { fechaProgramada: true, estado: true } });
  const inLocal = all.filter((o: any) => localSet.has(o.fechaProgramada)).length;
  const inUtc = all.filter((o: any) => utcSet.has(o.fechaProgramada)).length;
  console.log(`\nOTs totales=${all.length} | en ventana LOCAL=${inLocal} | en ventana UTC=${inUtc}`);
}

main().catch((e) => {
  console.error('ERROR:', e?.message);
}).finally(() => prisma.$disconnect());
