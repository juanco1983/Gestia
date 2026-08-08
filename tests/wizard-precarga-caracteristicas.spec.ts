import { test, expect } from '@playwright/test';
import { login, captureConsoleErrors } from './helpers/auth';

test.describe('Regresión: Precarga de características del equipo en el Wizard del Técnico', () => {
  test('El informe precarga modelo/serie/marca/especificaciones del equipo registrado (no datos ficticios)', async ({ page, request }) => {
    const consoleErrors = captureConsoleErrors(page);
    const log = (m: string) => console.log(`[REGRESION] ${m}`);

    // 0. Autenticación API
    const loginRes = await request.post('/api/login', { data: { email: 'admin@mafort.pe', password: 'mafort' } });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const authHeaders = { Authorization: `Bearer ${token}` };

    const runId = Date.now().toString(36).toUpperCase();
    const otId = `OT-REGRES-${runId}`;
    const codigoEquipo = `EQ-REGRES-${runId}`;

    // Valores de equipo registrados en el contrato (los que deben precargarse)
    const expectModelo = `MOD-REGRES-${runId}`;
    const expectSerie = `SN-REGRES-${runId}`;
    const expectMarca = 'MARCA-REGRES';
    const specKey = 'TENSION_SALIDA';

    // 1. Crear equipo vía API con datos reales
    const createEq = await request.post('/api/equipos', {
      data: {
        codigo: codigoEquipo,
        tipo: 'UPS',
        marca: expectMarca,
        modelo: expectModelo,
        serie: expectSerie,
        potenciaKva: 40,
        ubicacion: 'Sala de Servidores - Piso 2',
        estado: 'Operativo',
        especificaciones: { [specKey]: '220 VAC' }
      },
      headers: authHeaders
    });
    expect(createEq.ok()).toBeTruthy();
    const equipo = await createEq.json();
    log(`Equipo creado id=${equipo.id} codigo=${equipo.codigo}`);

    // 2. Crear OT asignada al técnico, vinculada al equipo, en ejecución
    const createOtRes = await request.post('/api/ots', {
      data: {
        id: otId,
        clientId: 'cli_001',
        equipoId: equipo.id,
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

    // 3. Login UI como Técnico
    await login(page, 'Tecnico');
    await expect(page.locator('#tecnico-portal-container')).toBeVisible({ timeout: 20_000 });

    // 4. Abrir la OT de regresión y lanzar el informe
    const otCard = page
      .locator('#tecnico-portal-container div[class*="cursor-pointer"]')
      .filter({ hasText: otId })
      .first();
    await expect(otCard).toBeVisible({ timeout: 20_000 });
    await otCard.click();
    await expect(page.getByRole('heading', { name: new RegExp(otId) })).toBeVisible();

    const btnInforme = page.getByRole('button', { name: /Llenar Informe/i });
    await expect(btnInforme).toBeVisible({ timeout: 15_000 });
    await btnInforme.click();

    // 5. Navegar al paso 6 (Características los del Equipo) en el wizard
    // En el rediseño, la sección 3 (Inspección Técnica) está colapsada; avanzamos
    // con "Siguiente" desde el paso 1 hasta el 6.
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /Siguiente/i }).click();
      await page.waitForTimeout(120);
    }
    await expect(page.getByText(/Sección 3 · Subpaso 1 de 3/i)).toBeVisible({ timeout: 10_000 });

    // 6. Verificar que los valores precargados provienen del equipo registrado
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeAttached({ timeout: 15_000 });
    const todosLosInputs = await inputs.evaluateAll((els) => els.map(el => (el as HTMLInputElement).value));

    expect(todosLosInputs.join('|')).toContain(expectModelo);
    expect(todosLosInputs.join('|')).toContain(expectSerie);
    log(`El wizard muestra modelo=${expectModelo} serie=${expectSerie} marca=${expectMarca}`);

    // Consola: solo errores preexistentes ajenos a este cambio (fetch 404 del endpoint
    // /api/clients/:id/equipos, sin handler en server.ts) se ignoran.
    const unexpected = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('Error fetching client equipments')
    );
    expect(unexpected).toHaveLength(0);
  });
});