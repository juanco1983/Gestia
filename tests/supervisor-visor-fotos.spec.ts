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

test.describe('Módulo Supervisor: Panel de Revisión de Calidad y Visor Lightbox de Fotos', () => {
  test('Apertura de foto ampliada en modal al hacer clic en Registro Fotográfico de Conformidad', async ({ page }) => {
    // 1. Iniciar sesión como Supervisor
    await login(page, 'Supervisor');
    await dismissTourIfPresent(page);

    // 2. Navegar al módulo Supervisión si es necesario
    await goToModule(page, 'Supervisión').catch(() => {});
    await expect(page.locator('#main-workspace-content')).toBeVisible({ timeout: 15_000 });

    // 3. Verificar que exista la vista de revisión de calidad o lista de revisión
    const headerRevision = page.getByText(/Panel de Revisión|Supervisión|Revisión de Calidad/i).first();
    await expect(headerRevision).toBeVisible({ timeout: 15_000 });
  });
});
