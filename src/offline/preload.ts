import {putOts, putCliente, putEquipo, setLastSyncAt, setSyncUser, migrateLegacyDrafts} from './db';
import type {OT, Client} from '../types';

export interface PreloadResult {
  ots: number;
  clientes: number;
  equipos: number;
  migratedDrafts: number;
}

export async function preloadOfflineData(
  userId: string,
  ots: OT[],
  clients: Client[],
  nestedEquipos: Array<Record<string, unknown>>
): Promise<PreloadResult> {
  const ownOts = ots.filter(
    (ot) => ot.tecnicoTitularId === userId ||
      ot.tecnicoApoyoId === userId ||
      (ot.tecnicosAdicionalesIds?.includes(userId))
  );

  if (ownOts.length > 0) {
    await putOts(ownOts);
  } else {
    await putOts(ots);
  }

  const relatedClientIds = new Set<string>();
  for (const ot of ownOts.length > 0 ? ownOts : ots) {
    if (ot.clientId) relatedClientIds.add(ot.clientId);
  }

  let clientes = 0;
  for (const client of clients) {
    if (relatedClientIds.size === 0 || relatedClientIds.has(client.id)) {
      await putCliente(client);
      clientes++;
    }
  }

  let equipos = 0;
  for (const eq of nestedEquipos) {
    if (eq && typeof eq.id === 'string') {
      await putEquipo(eq);
      equipos++;
    }
  }

  await setSyncUser(userId);
  await setLastSyncAt(new Date().toISOString());

  let migratedDrafts = 0;
  try {
    migratedDrafts = await migrateLegacyDrafts();
  } catch (e) {
    console.warn('Migración de borradores legacy falló en precarga:', e);
  }

  return {ots: ownOts.length || ots.length, clientes, equipos, migratedDrafts};
}