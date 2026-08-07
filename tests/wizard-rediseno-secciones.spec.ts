import { test, expect } from '@playwright/test';
import { login, captureConsoleErrors } from './helpers/auth';

test.describe('Rediseño Wizard Informe Técnico: 4 secciones + fotos cámara/fototeca', () => {

  test('El wizard muestra las 4 secciones, shell claro y orígenes de foto cámara/fototeca', async ({ page, request }) => {
    const consoleErrors = captureConsoleErrors(page);
    const log = (m: string) => console.log(`[REDISENO-WIZARD] ${m}`);

    // 0. Autenticación API
    const loginRes = await request.post('/api/login', { data: { email: 'admin@mafort.pe', password: 'mafort' } });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const authHeaders = { Authorization: `Bearer ${token}` };

    const runId = Date.now().toString(36).toUpperCase();
    const otId = `OT-REDIS-${runId}`;

    // 1. Crear OT asignada al técnico en ejecución
    const createOtRes = await request.post('/api/ots', {
      data: {
        id: otId,
        clientId: 'cli_001',
        tipoMantenimiento: 'Preventivo',
        tipoEquipo: 'UPS',
        potenciaKva: 40,
        fechaProgramada: '2026-08-20',
        tecnicoTitularId: 'user_5',
        tecnicoTitular: 'Juan Córdova',
        estado: 'Trabajo en Ejecución'
      },
      headers: authHeaders
    });
    expect(createOtRes.ok()).toBeTruthy();
    log(`OT creada ${otId}`);

    // 2. Login UI como Técnico
    await login(page, 'Tecnico');
    await expect(page.locator('#tecnico-portal-container')).toBeVisible({ timeout: 20_000 });

    // 3. Abrir la OT y lanzar el wizard
    const otCard = page
      .locator('#tecnico-portal-container div[class*="cursor-pointer"]')
      .filter({ hasText: otId })
      .first();
    await expect(otCard).toBeVisible({ timeout: 20_000 });
    await otCard.click();
    await expect(page.getByRole('button', { name: /Llenar Informe/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Llenar Informe/i }).click();

    // 4. Verificar las 4 secciones (sidebar claro) y el breadcrumb
    await expect(page.getByText('Datos del Servicio')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Trabajo Realizado')).toBeVisible();
    await expect(page.getByText('Inspección Técnica')).toBeVisible();
    await expect(page.getByText('Diagnóstico y Envío')).toBeVisible();
    await expect(page.getByText(/Sección 1 · Subpaso 1 de 3/i)).toBeVisible();

    // Barra de progreso global presente
    await expect(page.getByText('Progreso')).toBeVisible();

    // 5. Footer táctil de 3 acciones en el paso 1
    await expect(page.getByRole('button', { name: /Guardar borrador/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Siguiente/i })).toBeVisible();
    log('Shell rediseñado verificado (4 secciones + footer táctil)');

    // 6. Avanzar por Siguiente hasta el paso 6 (Características del Equipo, sección 3)
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /Siguiente/i }).click();
      await page.waitForTimeout(150);
    }
    await expect(page.getByText(/Sección 3 · Subpaso 1 de 3/i)).toBeVisible({ timeout: 10_000 });

    // 7. Panorámica: dos orígenes (cámara + fototeca)
    await expect(page.getByRole('button', { name: /Tomar con cámara/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Elegir de fototeca/i })).toBeVisible();
    log('Paso 6: fotos panorámicas con cámara/fototeca OK');

    // 8. Ir al paso 7 (Fotografías slots)
    await page.getByRole('button', { name: /Siguiente/i }).click();
    await expect(page.getByRole('button', { name: /Tomar con cámara/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Elegir de fototeca/i })).toBeVisible();
    log('Paso 7: photos slots con cámara/fototeca OK');

    // Consola: solo errores preexistentes ajenos al cambio
    const unexpected = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('Error fetching client equipments')
    );
    expect(unexpected).toHaveLength(0);
  });

});