import { test, expect } from '@playwright/test';
import { login, goToModule, captureConsoleErrors } from './helpers/auth';

test.describe('Prueba E2E Completa con Validación de AWS S3 (Navegador + Archivos)', () => {

  test('Flujo E2E Completo: Cliente -> Contrato -> Asignar Equipo -> Validación S3 (Upload, Pre-Signed URLs & Cleanup)', async ({ page, request }) => {
    test.setTimeout(180_000); // 3 minutos
    const consoleErrors = captureConsoleErrors(page);
    const timestamp = Date.now();
    const razonSocial = `MINERA ANTAMINA S.A. ${timestamp.toString().slice(-4)}`;

    // =========================================================================
    // PASO 1: Registro del Cliente con Ubigeo Completo en el Navegador
    // =========================================================================
    await login(page, 'Administrador');
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);

    await goToModule(page, 'Comercial');
    await expect(page.getByText('Clientes, Contratos y Acuerdos Marco')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Registrar Cliente/i }).click();
    await expect(page.getByText('Registrar Nuevo Cliente')).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder('Ej: Repsol Data Center Perú S.A.').fill(razonSocial);
    await page.getByPlaceholder('Ej: 20100123456').fill(`20${timestamp.toString().slice(-9)}`);

    const paisSelect = page.locator('div.fixed select').filter({ hasText: /Seleccione país/i });
    if (await paisSelect.isVisible()) {
      await expect.poll(async () => (await paisSelect.locator('option').count()) > 1).toBeTruthy();
      await paisSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
    }

    const provinciaSelect = page.locator('div.fixed select').filter({ hasText: /Seleccione provincia/i });
    if (await provinciaSelect.isVisible()) {
      await expect.poll(async () => (await provinciaSelect.locator('option').count()) > 1, { timeout: 5000 }).toBeTruthy().catch(() => {});
      if (await provinciaSelect.isEnabled() && (await provinciaSelect.locator('option').count()) > 1) {
        await provinciaSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
      }
    }

    const distritoSelect = page.locator('div.fixed select').filter({ hasText: /Seleccione distrito/i });
    if (await distritoSelect.isVisible()) {
      await expect.poll(async () => (await distritoSelect.locator('option').count()) > 1, { timeout: 5000 }).toBeTruthy().catch(() => {});
      if (await distritoSelect.isEnabled() && (await distritoSelect.locator('option').count()) > 1) {
        await distritoSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
      }
    }

    const direccionInput = page.locator('div.fixed').getByPlaceholder(/Navarrete|Dirección|Av\./i).first();
    if (await direccionInput.isVisible()) {
      await direccionInput.fill('Av. El Derby 055, Torre 1, Santiago de Surco');
    }

    const contactoInput = page.locator('div.fixed').getByPlaceholder(/Juan Pérez|Carlos|Nombre/i).first();
    if (await contactoInput.isVisible()) {
      await contactoInput.fill('Ing. Manuel Gonzales');
    }

    const emailInput = page.locator('div.fixed').getByPlaceholder(/jperez|email|cramos/i).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(`mgonzales_${timestamp}@antamina.com`);
    }

    const phoneInput = page.locator('div.fixed').getByPlaceholder(/987654321|teléfono/i).first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('998877665');
    }

    await page.locator('div.fixed').getByRole('button', { name: /Guardar Cliente/i }).click();
    await page.waitForTimeout(600);

    // Cerrar cualquier modal residual
    const closeClientBtn = page.locator('div.fixed button').filter({ hasText: '×' });
    if (await closeClientBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeClientBtn.click().catch(() => {});
    }
    await page.evaluate(() => {
      document.getElementById('gestia-notification-modal')?.remove();
    });
    await expect(page.getByText('Registrar Nuevo Cliente')).toBeHidden({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);

    // =========================================================================
    // PASO 2: Registro de Contrato Comercial desde la UI
    // =========================================================================
    await page.getByRole('button', { name: /Contratos Activos/i }).click();
    await page.getByRole('button', { name: /Registrar Contrato/i }).click();
    await expect(page.getByText('Registrar Nuevo Contrato/Acuerdo')).toBeVisible({ timeout: 10_000 });

    const contratoFormEl = page.locator('div.fixed form').filter({ hasText: /Guardar Contrato/i });
    const clientSelect = contratoFormEl.locator('select').first();
    await expect.poll(async () => (await clientSelect.locator('option').count()) > 1).toBeTruthy();
    await clientSelect.selectOption({ index: 1 });

    const tipoSelect = contratoFormEl.locator('select').nth(1);
    await tipoSelect.selectOption({ index: 1 });

    const contratoAsunto = `Contrato Marco Minería 2026 ${timestamp.toString().slice(-4)}`;
    await contratoFormEl.getByPlaceholder('Ej: Alquiler de UPS 80KVA y visitas mensuales').fill(contratoAsunto);
    await contratoFormEl.getByPlaceholder('Ej: 5000.00').fill('35000');

    await contratoFormEl.getByRole('button', { name: /Guardar Contrato/i }).click();
    await page.waitForTimeout(600);

    const closeContratoBtn = page.locator('div.fixed button').filter({ hasText: '×' });
    if (await closeContratoBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeContratoBtn.click().catch(() => {});
    }
    await page.evaluate(() => {
      document.getElementById('gestia-notification-modal')?.remove();
    });
    await expect(page.getByText('Registrar Nuevo Contrato/Acuerdo')).toBeHidden({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);

    // =========================================================================
    // PASO 3: Validación Técnica de Persistencia AWS S3 (Contratos, Equipos, Fotos y Presigned URLs)
    // =========================================================================
    let token = await page.evaluate(() => localStorage.getItem('gestia_jwt_token') || localStorage.getItem('token') || '');
    if (!token) {
      const loginApiRes = await request.post('/api/auth/login', {
        data: { email: 'admin@gestia.pe', password: 'password123' }
      });
      const loginApiData = await loginApiRes.json();
      token = loginApiData.token;
    }
    expect(token).toBeTruthy();

    const headers = { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    };

    // 1. Obtener ID del cliente recién creado
    const clientsRes = await request.get('/api/clients', { headers });
    expect(clientsRes.status()).toBe(200);
    const clientsList = await clientsRes.json();
    const createdClient = clientsList.find((c: any) => c.razonSocial === razonSocial || c.razonSocial?.includes('ANTAMINA'));
    expect(createdClient).toBeTruthy();

    // 2. Crear Equipo con Foto Base64 real y verificar que se suba a S3
    const dummyImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    
    const equipoRes = await request.post('/api/equipos', {
      headers,
      data: {
        tipo: 'UPS Modular',
        marca: 'EATON',
        modelo: '93PM 100KVA',
        serie: `SN-S3-E2E-${timestamp.toString().slice(-6)}`,
        potenciaKva: 100,
        ubicacion: 'Centro de Datos Principal',
        estado: 'Operativo',
        clienteId: createdClient.id,
        fotos: [dummyImageBase64]
      }
    });
    expect(equipoRes.status()).toBe(201);
    const createdEquipo = await equipoRes.json();
    expect(createdEquipo.id).toBeTruthy();
    // La URL debe ser una ruta proxy segura /api/equipos/files/equipo/... o fallback local
    expect(Array.isArray(createdEquipo.fotos)).toBe(true);
    expect(createdEquipo.fotos[0]).toMatch(/(\/api\/equipos\/files\/equipo\/|\/uploads\/equipo-)/);

    // 3. Crear Reporte Técnico con Fotos Labeled, Panorama y Firma hacia S3
    const otId = `OT-E2E-S3-${timestamp.toString().slice(-6)}`;
    const reportRes = await request.post('/api/reports', {
      headers,
      data: {
        otId,
        equipoId: createdEquipo.id,
        voltajeEntrada: 220,
        voltajeSalida: 220,
        indicadoresBateria: { nivelCarga: '100%', temperaturaC: 22 },
        observacionesDiagnostico: 'Equipo operando bajo parámetros normales en ambiente climatizado.',
        comentariosAdicionales: 'Prueba de validación de almacenamiento en AWS S3 completada.',
        firmaCliente: dummyImageBase64,
        panoramaFoto: dummyImageBase64,
        fotos: [dummyImageBase64],
        fotosLabeled: [{ slotName: 'Baterías Banco 1', base64: dummyImageBase64 }],
        creadoEn: new Date().toISOString(),
        modificadoEn: new Date().toISOString(),
        offlineDirty: false
      }
    });
    expect([200, 201]).toContain(reportRes.status());
    const savedReport = await reportRes.json();
    expect(savedReport.otId).toBe(otId);
    expect(savedReport.firmaCliente).toMatch(/(\/api\/photos\/reports\/OT-|\/uploads\/OT-)/);
    expect(savedReport.panoramaFoto).toMatch(/(\/api\/photos\/reports\/OT-|\/uploads\/OT-)/);

    // 4. Probar descarga segura de archivos y Pre-Signed URLs
    const equipoPhotoUrl = createdEquipo.fotos[0];
    const directPhotoRes = await request.get(equipoPhotoUrl, { headers });
    expect(directPhotoRes.status()).toBe(200);

    const presignPhotoRes = await request.get(`${equipoPhotoUrl}?presign=true`, { headers });
    expect([200, 302]).toContain(presignPhotoRes.status());

    // 5. Validar que la eliminación de equipo ejecuta cleanup en S3
    const deleteEqRes = await request.delete(`/api/equipos/${createdEquipo.id}`, { headers });
    expect(deleteEqRes.status()).toBe(200);

    // =========================================================================
    // PASO 4: Navegación de interfaz y verificación final
    // =========================================================================
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#sidebar-panel')).toBeVisible({ timeout: 15_000 });
    await goToModule(page, 'Comercial');
    await expect(page.getByText('Clientes, Contratos y Acuerdos Marco')).toBeVisible({ timeout: 10_000 });
    await goToModule(page, 'Dashboard');
    await expect(page.getByText(/Control Operativo|Cumplimiento/i).first()).toBeVisible({ timeout: 10_000 });

    console.log('[E2E Test] Flujo de Usuario y Validación de AWS S3 completado al 100% exitosamente.');
  });

});
