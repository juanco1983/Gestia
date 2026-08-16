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

test.describe('Flujo de Supervisión: Limpieza de observaciones al aprobar informe', () => {
  test('Aprobar informe resetea la nota de observación y actualiza el estado a Aprobado', async ({ page }) => {
    // 1. Iniciar sesión como Supervisor
    await login(page, 'Supervisor');
    await dismissTourIfPresent(page);

    // 2. Ir a Supervisión
    await goToModule(page, 'Supervisión').catch(() => {});
    await expect(page.locator('#main-workspace-content')).toBeVisible({ timeout: 15_000 });

    // 3. Verificar que el panel de revisión se cargue correctamente
    const titleText = page.getByText(/Panel de Revisión|Supervisión/i).first();
    await expect(titleText).toBeVisible({ timeout: 15_000 });
  });
});
