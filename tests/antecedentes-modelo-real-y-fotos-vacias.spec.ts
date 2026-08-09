import { test, expect } from '@playwright/test';
import { login, captureConsoleErrors } from './helpers/auth';

test.describe('Regresión: Antecedentes con datos reales y fotos vacías en Wizard Informe Técnico', () => {
  test('Antecedentes usa el modelo real del equipo y no hay imágenes precargadas en el paso 7', async ({ page, request }) => {
    const consoleErrors = captureConsoleErrors(page);
    const log = (m: string) => console.log(`[REGRESION] ${m}`);

    // 0. Autenticación API
    const loginRes = await request.post('/api/login', { data: { email: 'admin@mafort.pe', password: 'mafort' } });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const authHeaders = { Authorization: `Bearer ${token}` };

    const runId = Date.now().toString(36).toUpperCase();
    const otId = `OT-ANT-${runId}`;
    const codigoEquipo = `EQ-ANT-${runId}`;

    // Modelo/marca/serie reales que deben estar en el texto de antecedentes (no los ficticios).
    const expectModelo = `MOD-ANT-${runId}`;
    const expectMarca = 'MARCA-ANT';
    const expectSerie = `SN-ANT-${runId}`;

    // 1. Crear equipo vía API con datos reales
    const createEq = await request.post('/api/equipos', {
      data: {
        codigo: codigoEquipo,
        tipo: 'UPS',
        marca: expectMarca,
        modelo: expectModelo,
        serie: expectSerie,
        potenciaKva: 40,
        ubicacion: 'Sala de Servidores - Piso 3',
        estado: 'Operativo',
      },
      headers: authHeaders,
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
        fechaProgramada: '2026-08-21',
        tecnicoTitularId: 'user_5',
        tecnicoTitular: 'Juan Córdova',
        estado: 'Trabajo en Ejecución',
      },
      headers: authHeaders,
    });
    expect(createOtRes.ok()).toBeTruthy();
    log(`OT creada ${otId}`);

    // 3. Login UI como Técnico
    await login(page, 'Tecnico');
    await expect(page.locator('#tecnico-portal-container')).toBeVisible({ timeout: 20_000 });

    // 4. Abrir la OT y lanzar el informe
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

    // 5. Ir al paso 3 (Antecedentes): 2 veces "Siguiente"
    for (let i = 0; i < 2; i++) {
      await page.getByRole('button', { name: /Siguiente/i }).click();
      await page.waitForTimeout(120);
    }
    await expect(page.getByText(/Sección 1 · Subpaso 3 de 3/i)).toBeVisible({ timeout: 10_000 });

    // 6. El textarea de antecedentes contiene el modelo REAL, no los ficticios.
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeAttached({ timeout: 10_000 });
    const antecedentesText = await textarea.inputValue();
    log(`Antecedentes contiene modelo real=${expectModelo} marca=${expectMarca} serie=${expectSerie}`);
    expect(antecedentesText).toContain(expectModelo);
    expect(antecedentesText).toContain(expectMarca);
    expect(antecedentesText).toContain(expectSerie);
    // No debe contener los valores ficticios de la versión previa.
    expect(antecedentesText).not.toContain('RT-X Dual Conversion');
    expect(antecedentesText).not.toContain('EXM 3 Phase Series');
    expect(antecedentesText).not.toContain('APC Smart-UPS');
    expect(antecedentesText).not.toContain('EMERSON LIEBERT');

    // 7. Ir al paso 7 (Fotografías): avanzar 4 "Siguiente".
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /Siguiente/i }).click();
      await page.waitForTimeout(120);
    }
    await expect(page.getByText(/Sección 3 · Subpaso 2 de 3/i)).toBeVisible({ timeout: 10_000 });

    // 8. No deben existir <img> precargadas con data:image/svg+xml (los fake placeholders).
    const svgCount = await page.locator('img[src^="data:image/svg+xml"]').count();
    log(`IMG con data:image/svg+xml en paso 7 (debe ser 0): ${svgCount}`);
    expect(svgCount).toBe(0);

    const unexpected = consoleErrors.filter(
      e => !e.includes('favicon') && !e.includes('Error fetching client equipments')
    );
    expect(unexpected).toHaveLength(0);
  });
});
