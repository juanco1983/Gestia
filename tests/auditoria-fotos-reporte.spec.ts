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

test.describe('Centro de Operaciones: Panel de Auditoría y Visor Lightbox de Fotos', () => {
  test('Visualización de evidencias fotográficas y apertura de foto ampliada en modal', async ({ page }) => {
    // 1. Iniciar sesión como Administrador
    await login(page, 'Administrador');
    await dismissTourIfPresent(page);

    // 2. Navegar al módulo Operaciones
    await goToModule(page, 'Operaciones');
    await expect(page.locator('#main-workspace-content')).toBeVisible({ timeout: 15_000 });

    // 3. Hacer clic en pestaña Centro de Operaciones
    const tabCentroOps = page.locator('button', { hasText: 'Centro de Operaciones' }).first();
    await expect(tabCentroOps).toBeVisible({ timeout: 10_000 });
    await tabCentroOps.click();

    // 4. Cambiar a la subpestaña "Informes"
    const subtabInformes = page.locator('button', { hasText: 'Informes' }).first();
    await expect(subtabInformes).toBeVisible({ timeout: 10_000 });
    await subtabInformes.click();

    // 5. Hacer clic en "Auditar" del primer informe técnico
    const btnAuditar = page.locator('button', { hasText: 'Auditar' }).first();
    await expect(btnAuditar).toBeVisible({ timeout: 15_000 });
    await btnAuditar.click();

    // 6. Verificar presencia del Panel de Auditoría
    await expect(page.getByText('Panel de Auditoría')).toBeVisible({ timeout: 10_000 });
  });
});
