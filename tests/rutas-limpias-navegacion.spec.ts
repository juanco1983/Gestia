import { test, expect } from '@playwright/test';
import { login, goToModule, captureConsoleErrors } from './helpers/auth';

test.describe('Navegación por Rutas Limpias e Historial HTML5', () => {
  test('las URLs cambian dinámicamente al hacer clic en el sidebar y el botón atrás funciona', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const errors = captureConsoleErrors(page);
    await login(page, 'Administrador');

    // Dismiss any tour guide modal if active
    await page.evaluate(() => {
      localStorage.setItem('gestia_tour_progreso_visto', '1');
    });
    await page.keyboard.press('Escape').catch(() => {});

    // 1. Debe iniciar en la app con sesión iniciada
    await expect(page.locator('#main-workspace-content')).toBeVisible();

    // 2. Navegar a Comercial -> URL debe ser /comercial
    await page.evaluate(() => {
      (document.getElementById('nav-item-ClientesContratos') as HTMLElement)?.click();
    });
    await expect(page).toHaveURL(/\/comercial$/);

    // 3. Navegar a Gestión de OT -> URL debe ser /gestion-ots
    await page.evaluate(() => {
      (document.getElementById('nav-item-GestionOTs') as HTMLElement)?.click();
    });
    await expect(page).toHaveURL(/\/gestion-ots$/);

    // 4. Probar botón atrás del navegador -> debe volver a /comercial
    await page.goBack();
    await expect(page).toHaveURL(/\/comercial$/);

    // 5. Probar botón atrás del navegador nuevamente
    await page.goBack();
    await expect(page.locator('#main-workspace-content')).toBeVisible();

    // 6. Probar botón adelante del navegador -> debe avanzar a /comercial
    await page.goForward();
    await expect(page).toHaveURL(/\/comercial$/);

    expect(errors, `Errores de consola: ${errors.join(' | ')}`).toEqual([]);
  });

  test('carga directa a ruta profunda /inventario-equipos', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const errors = captureConsoleErrors(page);
    await login(page, 'Administrador');
    
    // Navegar directamente a la URL /inventario-equipos
    await page.goto('/inventario-equipos');
    await expect(page).toHaveURL(/\/inventario-equipos$/);
    await expect(page.locator('#main-workspace-content')).toBeVisible();

    expect(errors, `Errores de consola: ${errors.join(' | ')}`).toEqual([]);
  });
});
