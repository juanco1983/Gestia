import {openDB, type DBSchema, type IDBPDatabase} from 'idb';
import type {TechnicalReport, OT, Client} from '../types';

export interface OfflineDraft {
  key: string;
  otId: string;
  equipoId: string;
  data: Record<string, unknown>;
  updatedAt: number;
}

export interface QueuedReport {
  queueId: string;
  otId: string;
  equipoId?: string;
  createdAt: number;
  attempts: number;
  status: 'pending' | 'failed' | 'synced';
  nextRetryAt?: number;
  report: TechnicalReport;
}

export interface OfflineMeta {
  key: string;
  value: string;
}

interface GestiaOfflineDB extends DBSchema {
  drafts: {
    key: string;
    value: OfflineDraft;
    indexes: { 'by-updatedAt': number };
  };
  reports_queue: {
    key: string;
    value: QueuedReport;
    indexes: {
      'by-status': string;
      'by-createdAt': number;
      'by-otId': string;
    };
  };
  ots: {
    key: string;
    value: OT;
  };
  equipos: {
    key: string;
    value: Record<string, unknown>;
  };
  clientes: {
    key: string;
    value: Client;
  };
  meta: {
    key: string;
    value: OfflineMeta;
  };
}

const DB_NAME = 'gestia_offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GestiaOfflineDB>> | null = null;

export function getOfflineDB(): Promise<IDBPDatabase<GestiaOfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GestiaOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const drafts = db.createObjectStore('drafts', {keyPath: 'key'});
        drafts.createIndex('by-updatedAt', 'updatedAt');

        const queue = db.createObjectStore('reports_queue', {keyPath: 'queueId'});
        queue.createIndex('by-status', 'status');
        queue.createIndex('by-createdAt', 'createdAt');
        queue.createIndex('by-otId', 'otId');

        db.createObjectStore('ots', {keyPath: 'id'});
        db.createObjectStore('equipos', {keyPath: 'id'});
        db.createObjectStore('clientes', {keyPath: 'id'});
        db.createObjectStore('meta', {keyPath: 'key'});
      },
    });
  }
  return dbPromise;
}

export function draftKey(otId: string, equipoId: string): string {
  return `${otId}__${equipoId}`;
}

export async function putDraft(draft: OfflineDraft): Promise<void> {
  const db = await getOfflineDB();
  await db.put('drafts', draft);
}

export async function getDraft(key: string): Promise<OfflineDraft | undefined> {
  const db = await getOfflineDB();
  return db.get('drafts', key);
}

export async function getDraftsByOt(otId: string): Promise<OfflineDraft[]> {
  const db = await getOfflineDB();
  const all = await db.getAll('drafts');
  return all.filter((d) => d.otId === otId);
}

export async function deleteDraft(key: string): Promise<void> {
  const db = await getOfflineDB();
  await db.delete('drafts', key);
}

export async function getDraftKeys(): Promise<string[]> {
  const db = await getOfflineDB();
  return db.getAllKeys('drafts');
}

export async function enqueueReport(report: TechnicalReport): Promise<string> {
  const queueId = globalThis.crypto?.randomUUID?.() || `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const item: QueuedReport = {
    queueId,
    otId: report.otId,
    equipoId: report.equipoId,
    createdAt: Date.now(),
    attempts: 0,
    status: 'pending',
    report,
  };
  const db = await getOfflineDB();
  await db.put('reports_queue', item);
  return queueId;
}

export async function getPendingQueue(): Promise<QueuedReport[]> {
  const db = await getOfflineDB();
  return db.getAllFromIndex('reports_queue', 'by-status', IDBKeyRange.bound('failed', 'pending'));
}

export async function getQueueCount(): Promise<number> {
  const db = await getOfflineDB();
  const pending = await db.countFromIndex('reports_queue', 'by-status', 'pending');
  const failed = await db.countFromIndex('reports_queue', 'by-status', 'failed');
  return pending + failed;
}

export async function markQueueSynced(queueId: string): Promise<void> {
  const db = await getOfflineDB();
  const item = await db.get('reports_queue', queueId);
  if (!item) return;
  await db.put('reports_queue', {...item, status: 'synced', nextRetryAt: undefined});
}

export async function removeQueueItem(queueId: string): Promise<void> {
  const db = await getOfflineDB();
  await db.delete('reports_queue', queueId);
}

export async function failQueueItem(queueId: string, nextRetryAt: number): Promise<void> {
  const db = await getOfflineDB();
  const item = await db.get('reports_queue', queueId);
  if (!item) return;
  await db.put('reports_queue', {...item, status: 'failed', attempts: item.attempts + 1, nextRetryAt});
}

export async function putOts(ots: OT[]): Promise<void> {
  const db = await getOfflineDB();
  const tx = db.transaction('ots', 'readwrite');
  await Promise.all(ots.map((ot) => tx.store.put(ot)));
  await tx.done;
}

export async function getCachedOts(): Promise<OT[]> {
  const db = await getOfflineDB();
  return db.getAll('ots');
}

export async function getCachedOt(otId: string): Promise<OT | undefined> {
  const db = await getOfflineDB();
  return db.get('ots', otId);
}

export async function putEquipo(equipo: Record<string, unknown>): Promise<void> {
  const db = await getOfflineDB();
  await db.put('equipos', equipo);
}

export async function getCachedEquipo(equipoId: string): Promise<Record<string, unknown> | undefined> {
  const db = await getOfflineDB();
  return db.get('equipos', equipoId);
}

export async function putCliente(cliente: Client): Promise<void> {
  const db = await getOfflineDB();
  await db.put('clientes', cliente);
}

export async function getCachedCliente(clientId: string): Promise<Client | undefined> {
  const db = await getOfflineDB();
  return db.get('clientes', clientId);
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getOfflineDB();
  await db.put('meta', {key, value});
}

export async function getMeta(key: string): Promise<string | undefined> {
  const db = await getOfflineDB();
  const row = await db.get('meta', key);
  return row?.value;
}

export async function migrateLegacyDrafts(): Promise<number> {
  let migrated = 0;
  if (typeof localStorage === 'undefined') return migrated;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('mafort_draft_') || k.startsWith('mafort_wizard_draft_'))) {
      keys.push(k);
    }
  }
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      const [otId, equipoId] = k.replace('mafort_wizard_draft_', 'mafort_draft_').replace('mafort_draft_', '').split('__');
      if (!otId) continue;
      const key = k.replace('mafort_wizard_draft_', 'mafort_draft_').replace('mafort_draft_', `${otId}__${equipoId || ''}`);
      await putDraft({
        key,
        otId,
        equipoId: equipoId || '',
        data,
        updatedAt: Date.now(),
      });
      localStorage.removeItem(k);
      migrated++;
    } catch (e) {
      console.warn('Migración de borrador legacy falló:', k, e);
    }
  }
  return migrated;
}

export async function getLastSyncAt(): Promise<string | undefined> {
  return getMeta('lastSyncAt');
}

export async function setLastSyncAt(date: string): Promise<void> {
  await setMeta('lastSyncAt', date);
}

export async function setSyncUser(userId: string): Promise<void> {
  await setMeta('userId', userId);
}

export async function getSyncUser(): Promise<string | undefined> {
  return getMeta('userId');
}
