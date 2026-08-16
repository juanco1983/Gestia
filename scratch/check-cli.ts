import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
let cs = process.env.DATABASE_URL || '';
const aws = cs.includes('amazonaws.com');
if (aws) cs = cs.replace(/[?&]sslmode=[^&]+/g, '');
const pool = new Pool({ connectionString: cs, ssl: aws ? { rejectUnauthorized: false } : undefined });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
(async () => {
  const e = await prisma.equipo.findMany({ where: { codigo: { in: ['UPS-HIST-001', 'UPS-HIST-002'] } } });
  for (const x of e) console.log(x.codigo, 'clienteId=', x.clienteId, 'contratoId=', x.contratoId);
  const c = await prisma.client.findUnique({ where: { id: 'cli_hist_1' } });
  console.log('client:', c?.id, c?.razonSocial);
  await prisma.$disconnect();
})();