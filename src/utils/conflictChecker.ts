import { OT, OTStatus, Client } from '../types';

export interface ConflictAlert {
  type: 'workload' | 'schedule' | 'geographic';
  message: string;
}

/**
 * Utility to convert "HH:MM" or similar time strings into minutes from midnight
 */
export function timeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  // Clean string and extract parts (handles cases like "09:00 AM" or raw "09:00")
  const cleaned = timeStr.replace(/(AM|PM)/i, '').trim();
  const [h, m] = cleaned.split(':').map(Number);
  let mins = (h || 0) * 60 + (m || 0);
  if (timeStr.toLowerCase().includes('pm') && h < 12) {
    mins += 12 * 60;
  }
  return mins;
}

/**
 * Checks for conflicts when assigning a technician to a service date and time.
 * 
 * @param tecnicoId The ID of the technician to check
 * @param fecha The scheduled date string (YYYY-MM-DD)
 * @param horaInicio The scheduled start time string (HH:MM)
 * @param horaFin The scheduled end time string (HH:MM)
 * @param currentOtId The ID of the current OT being edited/created (to avoid self-conflicts)
 * @param ots The array of all current OTs
 * @param clients The array of all clients
 * @param currentClientId The client ID of the current visit being scheduled
 */
export function checkTechnicianConflicts(
  tecnicoId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  currentOtId: string | undefined,
  ots: OT[],
  clients: Client[],
  currentClientId: string
): ConflictAlert[] {
  const alerts: ConflictAlert[] = [];
  if (!tecnicoId || !fecha) return alerts;

  const currentStart = timeToMinutes(horaInicio);
  const currentEnd = timeToMinutes(horaFin);
  const currentDuration = currentEnd > currentStart ? (currentEnd - currentStart) / 60 : 2.0; // default 2 hours

  // Find the current client to check its district
  const currentClient = clients.find(c => c.id === currentClientId);
  const currentDistrict = currentClient?.distrito?.trim().toLowerCase() || '';

  // Filter active, scheduled OTs on the same day for this technician (excluding self)
  const sameDayOts = ots.filter(o => {
    if (o.id === currentOtId) return false;
    if (o.fechaProgramada !== fecha) return false;
    
    // Ignore canceled/closed OTs
    if (o.estado === OTStatus.CERRADA || o.estado === OTStatus.FACTURADA || o.estado === OTStatus.APROBADA) {
      return false;
    }

    // Check if technician is assigned anywhere
    const isTitular = o.tecnicoTitularId === tecnicoId;
    const isApoyo = o.tecnicoApoyoId === tecnicoId;
    const isAdditional = (o.tecnicosAdicionalesIds || []).includes(tecnicoId);
    
    return isTitular || isApoyo || isAdditional;
  });

  let totalHours = currentDuration;
  const uniqueDistricts = new Set<string>();
  if (currentDistrict) {
    uniqueDistricts.add(currentDistrict);
  }

  sameDayOts.forEach(ot => {
    // 1. Time overlap check
    const otStart = timeToMinutes(ot.horaProgramada || '09:00');
    const otEnd = timeToMinutes(ot.horaFinProgramada || '11:00');
    const otDuration = otEnd > otStart ? (otEnd - otStart) / 60 : 2.0;

    totalHours += otDuration;

    // Check overlap: startA < endB && startB < endA
    if (currentStart < otEnd && otStart < currentEnd) {
      alerts.push({
        type: 'schedule',
        message: `⚠️ Cruce de Horario: El técnico ya tiene programada la OT ${ot.id} de ${ot.horaProgramada || '09:00'} a ${ot.horaFinProgramada || '11:00'} este mismo día.`
      });
    }

    // Collect other visit districts for geographic conflict
    const otClient = clients.find(c => c.id === ot.clientId);
    const otDistrict = otClient?.distrito?.trim().toLowerCase() || '';
    if (otDistrict) {
      uniqueDistricts.add(otDistrict);
    }
  });

  // 2. Workload overload check (> 8 hours)
  if (totalHours > 8.0) {
    alerts.push({
      type: 'workload',
      message: `⚠️ Sobrecarga de Horas: El técnico superará las 8 horas de servicio programadas para este día (Total: ${totalHours.toFixed(1)} horas).`
    });
  }

  // 3. Geographic conflict check (if there is more than 1 unique district)
  if (uniqueDistricts.size > 1) {
    // Let's list the other districts
    const otherDistricts = sameDayOts
      .map(o => clients.find(c => c.id === o.clientId)?.distrito || '')
      .filter((d, index, self) => d && self.indexOf(d) === index);
    
    alerts.push({
      type: 'geographic',
      message: `⚠️ Múltiples Zonas: El técnico tiene visitas programadas en distritos distintos el mismo día (Esta visita: ${currentClient?.distrito || 'S/D'} vs Otras: ${otherDistricts.join(', ')}).`
    });
  }

  return alerts;
}
