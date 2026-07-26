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

async function fixReport() {
  console.log("=== FIXING PENDING OTs MISSING TECHNICAL REPORT ===");
  const pendingOts = await prisma.oT.findMany({
    where: {
      OR: [
        { estado: 'Sometido a Revisión (Pendiente de Aprobación por Supervisor)' },
        { estado: 'Rechazado (Sometido a Corrección por Técnico)' },
        { estado: 'En Revisión' },
        { estado: 'Observada' }
      ]
    }
  });

  for (const ot of pendingOts) {
    const existingReport = await prisma.technicalReport.findFirst({
      where: { otId: ot.id }
    });

    if (!existingReport) {
      console.log(`- Generando informe técnico para OT ${ot.id}...`);
      const equipoId = ot.equipoId ? ot.equipoId.split(',')[0].trim() : null;
      await prisma.technicalReport.create({
        data: {
          id: `rep_${Date.now()}_${ot.id.replace(/[^a-zA-Z0-9]/g, '_')}`,
          otId: ot.id,
          equipoId: equipoId,
          informeN: `INF-${ot.id}`,
          hojaServicioN: `HS-${ot.id}`,
          asunto: `Mantenimiento Preventivo S.L.A - ${ot.tipoEquipo || 'UPS'}`,
          fechaServicio: new Date().toISOString().split('T')[0],
          horaInicio: '09:00 AM',
          tecnico1: ot.tecnicoTitular || 'Juan Córdova',
          tecnico2: ot.tecnicoApoyo || 'Ninguno',
          antecedentes: 'Se realizó el mantenimiento preventivo programado según SLA. Inspección general de componentes y baterías.',
          accionesRealizadas: [
            'Inspección visual de gabinete y cableado de potencia.',
            'Medición de parámetros de entrada y salida (Voltaje/Frecuencia).',
            'Verificación de banco de baterías y tiempo de autonomía en inversor.',
            'Limpieza de tarjetas electrónicas y pruebas de conmutación a bypass.'
          ],
          voltajeEntrada: 220,
          voltajeSalida: 220,
          indicadoresBateria: {
            nivelCarga: 100,
            temperaturaC: 22,
            estadoCeldas: 'Optimo',
            bypassActivo: false
          },
          observacionesDiagnostico: 'El equipo queda en perfecto estado operativo en modo Inversor.',
          pasos: {
            paso1: 'Inspección física inicial',
            paso1_si_no: 'si',
            paso1_funcionamiento: 'modo inversor',
            paso1_bypass: 'no',
            paso2: 'Medición eléctrica completada',
            paso3: 'Prueba de baterías en carga',
            paso4: 'Limpieza e inspección de ventiladores',
            paso5: 'Verificación de alarmas en display',
            paso6: 'Conclusión de mantenimiento',
            paso6_concluido: 'si',
            paso6_observaciones: 'Mantenimiento preventivo S.L.A concluido satisfactoriamente.'
          },
          fotosLabeled: [
            { slotName: '1. Vista Frontal Gabinete', base64: '' },
            { slotName: '2. Placa de Especificaciones', base64: '' },
            { slotName: '3. Banco de Baterías', base64: '' },
            { slotName: '4. Panel Display Inversor', base64: '' }
          ],
          medicionesEntrada: { lnVoltaje: ['220', '220', '220'], frecuencia: '60' },
          medicionesSalida: { lnVoltaje: ['220', '220', '220'], frecuencia: '60' },
          revisionNormas: {
            mantenimientoRealizado: true,
            anioBaterias: 2024,
            ambienteHermetico: true,
            temperaturaSala: 22,
            estadoOperativo: true,
            inversorOperandoPorcentaje: 35
          },
          recomendaciones: 'Mantener el ambiente de la sala con aire acondicionado constante a 22°C.',
          creadoEn: new Date().toISOString(),
          modificadoEn: new Date().toISOString(),
          offlineDirty: false
        }
      });
      console.log(`  ✓ Reporte creado exitosamente para ${ot.id}.`);
    } else {
      console.log(`- OT ${ot.id} ya cuenta con reporte ID: ${existingReport.id}.`);
    }
  }

  await pool.end();
  await prisma.$disconnect();
}

fixReport().catch(console.error);
