import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Regresión: Antecedentes del informe con hora programada y datos del equipo', () => {
  test('La sección Antecedentes usa la hora programada de la visita y la marca/modelo/serie del equipo', async ({ page, request }) => {
    const runId = Date.now().toString(36).toUpperCase();
    const otId = `OT-ANTECED-${runId}`;
    const codigoEquipo = `EQ-ANTECED-${runId}`;

    // 0. Auth API
    const loginRes = await request.post('/api/login', { data: { email: 'admin@mafort.pe', password: 'mafort' } });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 1. Crear equipo con marca/modelo/serie reales
    const createEq = await request.post('/api/equipos', {
      data: {
        codigo: codigoEquipo,
        tipo: 'UPS',
        marca: 'Vertiv',
        modelo: 'GXT5',
        serie: 'SN-ANTECED-0001',
        potenciaKva: 10,
        ubicacion: 'Sala de Servidores - Piso 2',
        estado: 'Operativo',
        especificaciones: { TENSION_SALIDA: '220 VAC' }
      },
      headers: authHeaders
    });
    expect(createEq.ok()).toBeTruthy();
    const equipo = await createEq.json();
    console.log(`[REG] Equipo id=${equipo.id}`);

    // 2. Crear OT en ejecución vinculada al equipo, con hora programada de visita 08:30
    const createOtRes = await request.post('/api/ots', {
      data: {
        id: otId,
        clientId: 'cli_001',
        equipoId: equipo.id,
        tipoMantenimiento: 'Preventivo',
        tipoEquipo: 'UPS',
        potenciaKva: 10,
        fechaProgramada: '2026-08-20',
        horaProgramada: '08:30',
        tecnicoTitularId: 'user_5',
        tecnicoTitular: 'Juan Córdova',
        estado: 'Trabajo en Ejecución'
      },
      headers: authHeaders
    });
    expect(createOtRes.ok()).toBeTruthy();
    console.log(`[REG] OT creada ${otId}`);

    // 3. Login UI como Técnico y abrir la OT
    await login(page, 'Tecnico');
    await expect(page.locator('#tecnico-portal-container')).toBeVisible({ timeout: 20_000 });

    const otCard = page
      .locator('#tecnico-portal-container div[class*="cursor-pointer"]')
      .filter({ hasText: otId })
      .first();
    await expect(otCard).toBeVisible({ timeout: 20_000 });
    await otCard.dispatchEvent('click');
    await expect(page.getByRole('heading', { name: new RegExp(otId) })).toBeVisible();

    const btnInforme = page.getByRole('button', { name: /Llenar Informe/i });
    await expect(btnInforme).toBeVisible({ timeout: 15_000 });
    await btnInforme.click();

    // 4. Paso 2 (Datos de Cabecera): la Hora Inicio debe venir de la visita programada
    await page.getByRole('button', { name: /Siguiente/i }).click();
    await page.waitForTimeout(120);
    const horaInput = page.locator('input[type="time"]').first();
    await expect(horaInput).toHaveValue('08:30', { timeout: 10_000 });

    // 5. Paso 3 (Antecedentes): el texto autogenerado debe incluir marca/modelo/serie y la hora
    await page.getByRole('button', { name: /Siguiente/i }).click();
    await page.waitForTimeout(120);
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });
    const antecedentes = await textarea.inputValue();

    expect(antecedentes).toContain('Vertiv');
    expect(antecedentes).toContain('GXT5');
    expect(antecedentes).toContain('SN-ANTECED-0001');
    expect(antecedentes).toContain('a las 08:30');
    console.log('[REG] Antecedentes ok: marca/modelo/serie + hora 08:30');
  });
});