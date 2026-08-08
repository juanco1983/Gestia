import { test, expect } from '@playwright/test';
import { login, goToModule, captureConsoleErrors } from './helpers/auth';

test.describe('Dropdown de Distrito - Formulario Cliente (ClientesContratosView)', () => {

  test('Falla si la BD devuelve distritos vacíos (fallback DEFAULT_DISTRITOS roto)', async ({ page }) => {
    test.setTimeout(120_000);
    const consoleErrors = captureConsoleErrors(page);

    await login(page, 'Administrador');
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);

    await goToModule(page, 'Comercial');
    await expect(page.getByText('Clientes, Contratos y Acuerdos Marco')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Registrar Cliente/i }).click();
    await expect(page.getByText('Registrar Nuevo Cliente')).toBeVisible({ timeout: 10_000 });

    // Interceptar /api/ubigeo/distritos devolviendo [] (simula BD de QA sin distritos)
    await page.route('**/api/ubigeo/distritos**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

    // Seleccionar País (Perú)
    const paisSelect = page.locator('select').filter({ hasText: /Seleccione país/i });
    await expect(paisSelect).toBeVisible();
    await paisSelect.selectOption({ index: 1 });
    await page.waitForTimeout(500);

    // Elegir la provincia "Lima" (primer índice con opciones cargadas desde API real)
    const provinciaSelect = page.locator('select').filter({ hasText: /Seleccione provincia/i });
    await expect(provinciaSelect).toBeVisible();
    // La provincia habilita con opciones reales del endpoint; rotamos a Lima explícitamente
    const limaOption = provinciaSelect.locator('option', { hasText: /Lima/ }).first();
    await provinciaSelect.selectOption({ label: await limaOption.textContent() ?? '' });
    await page.waitForTimeout(500);

    // Distrito debe tener opciones gracias al fallback local (mapa PROVINCIA_DISTRITOS_MAP)
    const distritoSelect = page.locator('select').filter({ hasText: /Seleccione distrito/i });
    await expect(distritoSelect).toBeVisible();
    await expect(distritoSelect).toBeEnabled({ timeout: 10_000 });
    await expect.poll(async () => (await distritoSelect.locator('option').count()) > 1, {
      message: 'El dropdown de distrito debería poblarse desde el fallback aunque la BD esté vacía',
      timeout: 15_000,
    }).toBeTruthy();

    const distritoOptions = await distritoSelect.locator('option').allTextContents();
    expect(distritoOptions).toContain('Miraflores');
  });
});