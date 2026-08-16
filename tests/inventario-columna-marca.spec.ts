import { test, expect } from '@playwright/test';
import { login, goToModule } from './helpers/auth';

async function dismissTourIfPresent(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.setItem('gestia_tour_progreso_visto', '1');
  }).catch(() => {});
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sidebar-panel')).toBeVisible({ timeout: 25_000 });
  await page.waitForTimeout(700);
}

test.describe('Módulo de Inventario de Equipos: Columna Dedicada de Marca', () => {
  test('Verificar presencia de la columna Marca en la tabla de inventario', async ({ page }) => {
    // 1. Iniciar sesión y abrir módulo Inventario de Equipos
    await login(page, 'Administrador');
    await dismissTourIfPresent(page);
    await goToModule(page, 'Inventario de Equipos');
    await expect(page.getByRole('heading', { name: 'Inventario de Equipos' })).toBeVisible({ timeout: 15_000 });

    // 2. Verificar que la tabla contenga el encabezado "Marca"
    const thMarca = page.locator('th', { hasText: 'Marca' });
    await expect(thMarca).toBeVisible({ timeout: 15000 });

    // 3. Verificar que los encabezados Código, Marca y Modelo existan de forma independiente
    const thCodigo = page.locator('th', { hasText: 'Código' });
    const thModelo = page.locator('th', { hasText: 'Modelo' });
    await expect(thCodigo).toBeVisible();
    await expect(thModelo).toBeVisible();
  });
});
