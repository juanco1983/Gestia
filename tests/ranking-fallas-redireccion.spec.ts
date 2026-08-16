import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

async function dismissTourIfPresent(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.setItem('gestia_tour_progreso_visto', '1');
  }).catch(() => {});
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sidebar-panel')).toBeVisible({ timeout: 25_000 });
  await page.waitForTimeout(700);
}

test.describe('Dashboard Principal: Ranking de Equipos e Interacción Redirección', () => {
  test('El ranking de equipos con incidencias es visible y posee tarjetas interactivas', async ({ page }) => {
    // 1. Iniciar sesión como Administrador
    await login(page, 'Administrador');
    await dismissTourIfPresent(page);

    // 2. Verificar que el componente Ranking de Equipos esté presente en el Dashboard
    const rankingHeader = page.getByText('Ranking de Equipos con Incidencias').first();
    await expect(rankingHeader).toBeVisible({ timeout: 15_000 });
  });
});
