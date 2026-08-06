import { test, expect } from '@playwright/test';
import { login, captureConsoleErrors } from './helpers/auth';

test.describe('Pruebas de Funcionamiento Rediseño Módulo Técnico (Interacción de Usuario Final)', () => {

  test('Flujo E2E Navegador: Clics reales de usuario final en el Módulo del Técnico', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);

    // 1. El usuario final (Técnico) entra a la aplicación e inicia sesión con formulario visual
    await login(page, 'Tecnico');
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);

    // 2. El usuario visualiza la interfaz del portal de técnico
    const portalContainer = page.locator('#tecnico-portal-container');
    await expect(portalContainer).toBeVisible({ timeout: 15_000 });

    // 3. El usuario observa la cabecera del portal "Mis Órdenes de Trabajo"
    await expect(page.getByText('Mis Órdenes de Trabajo')).toBeVisible();

    // 4. El usuario hace CLIC en la primera tarjeta de OT/Visita del sidebar
    const firstTaskCard = page.locator('#tecnico-portal-container .cursor-pointer').first();
    if (await firstTaskCard.isVisible()) {
      await firstTaskCard.click();
      await page.waitForTimeout(1000);
    }

    // 5. Verificar que el espacio de trabajo responde al clic sin errores de script en consola
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

});
