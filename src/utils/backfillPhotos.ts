import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'gestia-dev-photos';

async function uploadBase64ToS3(base64Str: string, otId: string, index: string | number): Promise<string> {
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Formato Base64 inválido');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  let extension = 'jpg';
  if (mimeType === 'image/png') extension = 'png';
  else if (mimeType === 'image/webp') extension = 'webp';

  const cleanOtId = otId.replace(/[^a-zA-Z0-9_-]/g, '');
  const timestamp = Date.now();
  const key = `reports/OT-${cleanOtId}/${timestamp}-${index}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `/api/photos/${key}`;
}

async function runBackfill() {
  console.log('>>> [BACKFILL] Iniciando migración de imágenes a AWS S3...');
  const reports = await prisma.technicalReport.findMany();
  console.log(`>>> [BACKFILL] Encontrados ${reports.length} informes en total.`);

  let migratedCount = 0;

  for (const r of reports) {
    let changed = false;
    let clonedFotos: any[] = Array.isArray(r.fotos) ? [...(r.fotos as any[])] : [];
    let clonedFotosLabeled: any[] = Array.isArray(r.fotosLabeled) ? [...(r.fotosLabeled as any[])] : [];
    let clonedFirma = r.firmaCliente;

    console.log(`Analizando reporte para OT: ${r.otId}`);

    // 1. Labeled Photos
    for (let i = 0; i < clonedFotosLabeled.length; i++) {
      const item = clonedFotosLabeled[i];
      if (item && typeof item.base64 === 'string' && item.base64.startsWith('data:image/')) {
        try {
          const s3Url = await uploadBase64ToS3(item.base64, r.otId, `labeled-${i}`);
          item.base64 = s3Url;
          changed = true;
          console.log(`   - Foto etiquetada ${i} subida a S3: ${s3Url}`);
        } catch (e: any) {
          console.error(`   - Error subiendo foto etiquetada ${i}:`, e.message);
        }
      }
    }

    // 2. Flat Photos
    for (let i = 0; i < clonedFotos.length; i++) {
      const img = clonedFotos[i];
      if (typeof img === 'string' && img.startsWith('data:image/')) {
        try {
          if (clonedFotosLabeled[i] && typeof clonedFotosLabeled[i].base64 === 'string' && clonedFotosLabeled[i].base64.startsWith('/api/photos/')) {
            clonedFotos[i] = clonedFotosLabeled[i].base64;
          } else {
            const s3Url = await uploadBase64ToS3(img, r.otId, `flat-${i}`);
            clonedFotos[i] = s3Url;
          }
          changed = true;
          console.log(`   - Foto plana ${i} subida a S3: ${clonedFotos[i]}`);
        } catch (e: any) {
          console.error(`   - Error subiendo foto plana ${i}:`, e.message);
        }
      }
    }

    // 3. Firma Cliente
    if (typeof clonedFirma === 'string' && clonedFirma.startsWith('data:image/')) {
      try {
        const s3Url = await uploadBase64ToS3(clonedFirma, r.otId, 'firma');
        clonedFirma = s3Url;
        changed = true;
        console.log(`   - Firma de conformidad subida a S3: ${s3Url}`);
      } catch (e: any) {
        console.error(`   - Error subiendo firma:`, e.message);
      }
    }

    if (changed) {
      await prisma.technicalReport.update({
        where: { id: r.id },
        data: {
          fotos: clonedFotos,
          fotosLabeled: clonedFotosLabeled,
          firmaCliente: clonedFirma
        }
      });
      migratedCount++;
      console.log(`>>> [MIGRADO OK] Reporte ${r.id} para OT ${r.otId} actualizado en PostgreSQL.`);
    } else {
      console.log(`   - Sin imágenes Base64 pendientes (omitido).`);
    }
  }

  console.log(`>>> [BACKFILL COMPLETADO] Se migraron exitosamente ${migratedCount} reportes.`);
}

runBackfill()
  .catch((e) => {
    console.error('Fallo en script de backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
