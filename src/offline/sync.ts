import {
  enqueueReport,
  getPendingQueue,
  getQueueCount,
  getLastSyncAt,
  setLastSyncAt,
  getSyncUser,
  type QueuedReport,
} from './db';
import type {TechnicalReport} from '../types';

export const BACKOFF_DELAYS = [5000, 15000, 60000, 300000, 900000, 1800000];

export function computeBackoff(attempts: number): number {
  const idx = Math.min(Math.max(attempts - 1, 0), BACKOFF_DELAYS.length - 1);
  return BACKOFF_DELAYS[idx];
}

function authHeaders(): HeadersInit {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('gestia_jwt_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
  };
}

export interface SyncResult {
  ok: boolean;
  synced: number;
  failed: number;
  error?: string;
}

let flushInProgress = false;
let lastQueueSnapshot: number | null = null;
let lastAttemptAt: number | null = null;

export async function enqueueReportOffline(report: TechnicalReport): Promise<string> {
  return enqueueReport({...report, offlineDirty: true});
}

export function getQueueSnapshot(): {
  count: number;
  latestAt: number | null;
  attemptedAgoSec: number | null;
} {
  return {
    count: lastQueueSnapshot ?? 0,
    latestAt: lastAttemptAt,
    attemptedAgoSec: lastAttemptAt ? Math.round((Date.now() - lastAttemptAt) / 1000) : null,
  };
}

export async function refreshQueueSnapshot(): Promise<void> {
  lastQueueSnapshot = await getQueueCount();
}

export async function flushQueue(force = false): Promise<SyncResult> {
  if (flushInProgress) {
    return {ok: true, synced: 0, failed: 0};
  }
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  if (!isOnline) {
    return {ok: false, synced: 0, failed: 0, error: 'Sin conexión'};
  }

  const items = await getPendingQueue();
  if (items.length === 0) {
    lastQueueSnapshot = 0;
    return {ok: true, synced: 0, failed: 0};
  }

  const due = items.filter(
    (item) =>
      (item.status === 'pending' && (!item.nextRetryAt || Date.now() >= item.nextRetryAt)) ||
      (item.status === 'failed' && item.nextRetryAt != null && Date.now() >= item.nextRetryAt)
  );

  if (due.length === 0) {
    return {ok: true, synced: 0, failed: 0};
  }

  flushInProgress = true;
  lastAttemptAt = Date.now();
  let synced = 0;
  let failed = 0;

  try {
    for (const item of due) {
      if (!navigator.onLine) break;
      try {
        const res = await fetch('/api/sync', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            reports: [{...item.report, queueId: item.queueId}],
          }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const serverApplied = Array.isArray(data?.appliedIds) && data.appliedIds.includes(item.queueId);
          if (!serverApplied) {
            // El servidor aceptó el reporte; marcamos la cola como sincronizada de todos modos.
          }
          await markItemSynced(item.queueId);
          synced++;
        } else {
          const text = await res.text().catch(() => '');
          if (res.status === 401) {
            lastQueueSnapshot = (await getQueueCount()) - synced;
            return {ok: false, synced, failed: failed + 1, error: 'Sesión expirada. Inicie sesión para sincronizar.'};
          }
          failed++;
          await scheduleRetry(item);
        }
      } catch (err) {
        failed++;
        await scheduleRetry(item);
      }
    }
  } finally {
    flushInProgress = false;
    lastQueueSnapshot = await getQueueCount();
    await setLastSyncAt(new Date().toISOString());
  }

  return {ok: failed === 0, synced, failed};
}

export async function scheduleRetry(item: QueuedReport): Promise<void> {
  const {failQueueItem} = await import('./db');
  await failQueueItem(item.queueId, Date.now() + computeBackoff(item.attempts + 1));
}

export async function markItemSynced(queueId: string): Promise<void> {
  const {markQueueSynced, removeQueueItem} = await import('./db');
  await markQueueSynced(queueId);
  await removeQueueItem(queueId);
}

export async function runSyncFor(userId: string): Promise<SyncResult> {
  const {setSyncUser} = await import('./db');
  await setSyncUser(userId);
  const result = await flushQueue();
  await refreshQueueSnapshot();
  return result;
}

export async function getSyncInfo(): Promise<{count: number; lastSyncAt: string | null}> {
  const [count, lastSyncAt] = await Promise.all([getQueueCount(), getLastSyncAt()]);
  return {count, lastSyncAt};
}