import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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

async function seedDiagnostico() {
  console.log("=== SEED Diagnóstico en informes de prueba HIST ===");

  const porInformeN: Record<string, { estadoOperativo?: boolean; equipoEnBypass?: string; recomendaciones?: string[] }> = {
    'INF-2026-001': { estadoOperativo: true, equipoEnBypass: 'no', recomendaciones: [] },
    'INF-2026-002': { estadoOperativo: true, equipoEnBypass: 'no', recomendaciones: [] },
    'INF-2025-088': { estadoOperativo: false, equipoEnBypass: 'si', recomendaciones: ['Reponer banco de baterías.'] },
  };

  const reports = await prisma.technicalReport.findMany({
    where: { informeN: { in: Object.keys(porInformeN) } },
  });

  for (const r of reports) {
    const cfg = porInformeN[r.informeN || ''];
    if (!cfg) continue;
    const diagnosticoGabinete = {
      cuentaConGabinete: 'si',
      tipoEstructura: 'modo Rack',
      equipoEnBypass: cfg.equipoEnBypass || 'no',
    };
    const recomendacionesJson = cfg.recomendaciones && cfg.recomendaciones.length > 0 ? cfg.recomendaciones : [];
    await prisma.technicalReport.update({
      where: { id: r.id },
      data: {
        diagnosticoGabinete: diagnosticoGabinete as any,
        revisionNormas: {
          mantenimientoRealizado: cfg.estadoOperativo ?? true,
          anioBaterias: 2022,
          ambienteHermetico: true,
          temperaturaSala: 21,
          estadoOperativo: cfg.estadoOperativo ?? true,
          inversorOperandoPorcentaje: 30,
        } as any,
        recomendaciones: recomendacionesJson as any,
      },
    });
    console.log(`  ✓ ${r.informeN} (${r.otId}) -> estOp=${cfg.estadoOperativo} bypass=${cfg.equipoEnBypass} recs=${recomendacionesJson.length}`);
  }

  await pool.end();
  await prisma.$disconnect();
}

seedDiagnostico().catch(console.error);