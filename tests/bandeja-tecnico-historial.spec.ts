import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Bandeja de Trabajo e Historial de Aprobados para el Técnico', () => {
  test('Navegación por pestañas Pendientes y Historial Aprobados en portal del técnico', async ({ page }) => {
    // 1. Iniciar sesión como Técnico con las credenciales oficiales de prueba
    await login(page, 'Tecnico');

    // 2. Verificar existencia de pestañas "#btn-tab-pendientes" y "#btn-tab-aprobados" en la bandeja
    const tabPendientes = page.locator('#btn-tab-pendientes');
    const tabAprobados = page.locator('#btn-tab-aprobados');

    await expect(tabPendientes).toBeVisible({ timeout: 15000 });
    await expect(tabAprobados).toBeVisible({ timeout: 15000 });

    // 3. Hacer clic en pestaña Historial Aprobados usando dispatch Event
    await page.evaluate(() => (document.getElementById('btn-tab-aprobados') as HTMLElement)?.click());
    await page.waitForTimeout(500);

    // 4. Verificar presencia del buscador de historial
    const searchInput = page.locator('input[placeholder="Buscar por código u OT aprobada..."]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // 5. Volver a la pestaña Pendientes
    await page.evaluate(() => (document.getElementById('btn-tab-pendientes') as HTMLElement)?.click());
    await page.waitForTimeout(500);
    await expect(searchInput).toBeHidden({ timeout: 10000 });
  });
});
