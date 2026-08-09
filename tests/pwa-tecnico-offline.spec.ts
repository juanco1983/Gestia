import { test, expect } from '@playwright/test';
import { login, captureConsoleErrors } from './helpers/auth';

test.describe('PWA Módulo Técnico Offline', () => {
  test('Borrador y reporte offline se persisten en IndexedDB y se sincronizan al reconectar', async ({ page, request, context }) => {
    const consoleErrors = captureConsoleErrors(page);
    const log = (m: string) => console.log(`[PWA] ${m}`);

    // 1. Setup vía API: usuario técnico con OT en ejecución y equipo real
    const loginRes = await request.post('/api/login', { data: { email: 'admin@mafort.pe', password: 'mafort' } });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const authHeaders = { Authorization: `Bearer ${token}` };

    const runId = Date.now().toString(36).toUpperCase();
    const otId = `OT-PWA-${runId}`;
    const codigoEquipo = `EQ-PWA-${runId}`;

    const createEq = await request.post('/api/equipos', {
      data: {
        codigo: codigoEquipo,
        tipo: 'UPS',
        marca: 'MARCA-PWA',
        modelo: `MOD-PWA-${runId}`,
        serie: `SN-PWA-${runId}`,
        potenciaKva: 40,
        ubicacion: 'Sala de Servidores - Piso 3',
        estado: 'Operativo',
      },
      headers: authHeaders,
    });
    expect(createEq.ok()).toBeTruthy();
    const equipo = await createEq.json();
    log(`Equipo creado id=${equipo.id}`);

    const createOtRes = await request.post('/api/ots', {
      data: {
        id: otId,
        clientId: 'cli_001',
        equipoId: equipo.id,
        tipoMantenimiento: 'Preventivo',
        tipoEquipo: 'UPS',
        potenciaKva: 40,
        fechaProgramada: '2026-08-21',
        tecnicoTitularId: 'user_5',
        tecnicoTitular: 'Juan Córdova',
        estado: 'Trabajo en Ejecución',
      },
      headers: authHeaders,
    });
    expect(createOtRes.ok()).toBeTruthy();
    log(`OT creada ${otId}`);

    // 2. Login UI como Técnico (online)
    await login(page, 'Tecnico');
    await expect(page.locator('#tecnico-portal-container')).toBeVisible({ timeout: 20_000 });

    // 2b. Esperar la card de la OT: garantiza que ots ya está en el state de React
    //     (la precarga offline se dispara una vez que ots/clients están cargados).
    const otCard = page
      .locator('#tecnico-portal-container div[class*="cursor-pointer"]')
      .filter({ hasText: otId })
      .first();
    await expect(otCard).toBeVisible({ timeout: 20_000 });

    // 2c. Esperar un instante para que el effect de precarga (App.tsx) persista ots/lastSyncAt
    await page.waitForTimeout(700);

    // 3. Verificamos que precargan OTs en IndexedDB después del login online
    const precacheInfo = await page.evaluate(async () => {
      const db = await new Promise<any>((resolve, reject) => {
        const req = indexedDB.open('gestia_offline');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction('ots', 'readonly');
      const store = tx.objectStore('ots');
      const count = await new Promise<number>((resolve, reject) => {
        const c = store.count();
        c.onsuccess = () => resolve(c.result);
        c.onerror = () => reject(c.error);
      });
      const metaTx = db.transaction('meta', 'readonly');
      const metaStore = metaTx.objectStore('meta');
      const lastSync = await new Promise<string | null>((resolve) => {
        const g = metaStore.get('lastSyncAt');
        g.onsuccess = () => resolve(g.result?.value || null);
        g.onerror = () => resolve({ value: null } as any);
      });
      db.close();
      return { otsCount: count, lastSyncAt: lastSync };
    });
    log(`IndexedDB tras precarga: ots=${precacheInfo.otsCount} lastSyncAt=${precacheInfo.lastSyncAt}`);
    expect(precacheInfo.otsCount).toBeGreaterThan(0);
    expect(precacheInfo.lastSyncAt).toBeTruthy();
    log('Precarga offline verificada (ots + lastSyncAt en IndexedDB)');

    // 4. Abrir la OT y lanzar el wizard hasta el paso 10
    await otCard.click();
    await expect(page.getByRole('heading', { name: new RegExp(otId) })).toBeVisible();

    const btnInforme = page.getByRole('button', { name: /Llenar Informe/i });
    await expect(btnInforme).toBeVisible({ timeout: 15_000 });
    await btnInforme.click();

    // Navegar hasta el paso 10 (Revisión Final)
    for (let i = 0; i < 9; i++) {
      const next = page.getByRole('button', { name: /Siguiente/i });
      if ((await next.count()) === 0) break;
      await next.click();
      await page.waitForTimeout(120);
    }
    await expect(page.getByRole('button', { name: /Enviar Informe/i })).toBeVisible({ timeout: 15_000 });

    // Guardamos borrador manualmente para validar persistencia en IndexedDB
    await page.getByRole('button', { name: /Guardar borrador/i }).click();
    await page.waitForTimeout(400);

    // Cerrar el modal de notificación "Borrador Guardado" para que no intercepte clics
    const enteredButton = page.getByRole('button', { name: /Entendido/i });
    if (await enteredButton.isVisible().catch(() => false)) {
      await enteredButton.click();
      await page.waitForTimeout(200);
    }

    const draftInfo = await page.evaluate(async () => {
      const db = await new Promise<any>((resolve, reject) => {
        const req = indexedDB.open('gestia_offline');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction('drafts', 'readonly');
      const store = tx.objectStore('drafts');
      const count = await new Promise<number>((resolve, reject) => {
        const c = store.count();
        c.onsuccess = () => resolve(c.result);
        c.onerror = () => reject(c.error);
      });
      db.close();
      return { drafts: count };
    });
    log(`Borradores en IndexedDB: ${draftInfo.drafts}`);
    expect(draftInfo.drafts).toBeGreaterThan(0);

    // 5. Simular offline: cortar red + toggle UI a Offline (estado react)
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    const offlineToggle = page.getByRole('button', { name: 'Offline', exact: true }).first();
    if (await offlineToggle.isVisible().catch(() => false)) {
      await offlineToggle.click();
      await page.waitForTimeout(200);
    }

    // 6. Enviar informe en modo offline
    await page.getByRole('button', { name: /Enviar Informe/i }).click();

    // Debe aparecer el toast offline de cacheo
    await expect(page.getByText(/Reporte Cacheado Localmente/i)).toBeVisible({ timeout: 15_000 });
    log('Toast de reporte cacheado visible');

    // Cerrar el modal de notificación para que no intercepte clics posteriores
    const offlineAck = page.getByRole('button', { name: /Entendido|Cerrar notificación/i }).last();
    if (await offlineAck.isVisible().catch(() => false)) {
      await offlineAck.click();
      await page.waitForTimeout(200);
    }

    // 7. Verificar cola en IndexedDB reports_queue
    const queueInfo = await page.evaluate(async () => {
      const db = await new Promise<any>((resolve, reject) => {
        const req = indexedDB.open('gestia_offline');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction('reports_queue', 'readonly');
      const store = tx.objectStore('reports_queue');
      const all = await new Promise<any[]>((resolve, reject) => {
        const g = store.getAll();
        g.onsuccess = () => resolve(g.result || []);
        g.onerror = () => reject(g.error);
      });
      db.close();
      return { pending: all.filter((r) => r.status !== 'synced').length, total: all.length };
    });
    log(`Cola reports_queue en IndexedDB: ${queueInfo.pending} pendientes / ${queueInfo.total} total`);
    expect(queueInfo.pending).toBeGreaterThan(0);

    // El chip de cola debe estar visible
    await expect(page.getByText(/\d+ en cola/)).toBeVisible({ timeout: 15_000 });
    log('Chip de cola visible');

    // 8. Reconectar: red restaurada + toggle UI a Conectado
    await context.setOffline(false);
    page.on('response', (r) => {
      if (r.url().includes('/api/sync')) {
        r.text().then((t) => log(`/api/sync ${r.status()}: ${t.slice(0, 300)}`)).catch(() => {});
      }
    });
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    const onlineToggle = page.getByRole('button', { name: 'Conectado', exact: true }).first();
    if (await onlineToggle.isVisible().catch(() => false)) {
      await onlineToggle.click();
    }

    // Esperamos a que la cola se sincronice y desaparezca (flushQueue en flujo online)
    await expect(page.getByText(/Sin cola/)).toBeVisible({ timeout: 25_000 });
    log('Cola sincronizada, chip en estado Sin cola');

    const finalQueue = await page.evaluate(async () => {
      const db = await new Promise<any>((resolve, reject) => {
        const req = indexedDB.open('gestia_offline');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const tx = db.transaction('reports_queue', 'readonly');
      const store = tx.objectStore('reports_queue');
      const all = await new Promise<any[]>((resolve, reject) => {
        const g = store.getAll();
        g.onsuccess = () => resolve(g.result || []);
        g.onerror = () => reject(g.error);
      });
      db.close();
      return { pending: all.filter((r) => r.status !== 'synced').length, total: all.length };
    });
    log(`Cola tras sync: ${finalQueue.pending} pendientes / ${finalQueue.total} total`);
    expect(finalQueue.pending).toBe(0);

    // 9. Cero errores de consola inesperados (sin flujo offline)
    const unexpected = consoleErrors.filter(
      e => !e.includes('favicon') && !e.includes('Error fetching client equipments') && !e.includes('Failed to fetch') && !e.includes('net::ERR')
    );
    log(`Errores de consola inesperados: ${unexpected.length}`);
    expect(unexpected).toHaveLength(0);
  });
});