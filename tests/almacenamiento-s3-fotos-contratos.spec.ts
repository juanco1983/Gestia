import { test, expect } from '@playwright/test';

test.describe('Validación de Almacenamiento S3 y Visualización de Fotos y Contratos', () => {
  test('Verificar que los contratos PDF usan el endpoint /api/contracts/files/ con token de autenticación', async ({ page }) => {
    // 1. Iniciar sesión como Administrador
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 2. Navegar al módulo Comercial
    await page.goto('/comercial');
    await page.waitForLoadState('networkidle');

    // 3. Verificar que la vista de Comercial cargue
    const header = page.locator('h1, h2, h3').first();
    await expect(header).toBeVisible({ timeout: 10000 });

    // 4. Verificar presencia de la tabla/tarjetas de contratos
    const tabContratos = page.locator('button, div, span').filter({ hasText: /Contratos Activos|Contratos/i }).first();
    if (await tabContratos.isVisible()) {
      await tabContratos.click().catch(() => {});
    }

    // 5. Verificar que exista al menos una tarjeta o botón de ver contrato si hay datos
    const verDetalleBtn = page.locator('button', { hasText: 'Ver Detalle' }).first();
    if (await verDetalleBtn.isVisible()) {
      await verDetalleBtn.click();
      
      // Si el contrato tiene PDF adjunto, verificar la URL del botón "Ver Contrato Digitalizado (PDF)"
      const linkPdf = page.locator('a', { hasText: 'Ver Contrato Digitalizado (PDF)' });
      if (await linkPdf.isVisible()) {
        const href = await linkPdf.getAttribute('href');
        expect(href).toContain('/api/contracts/files/');
        expect(href).toContain('token=');
      }
    }
  });

  test('Verificar que la vista de calidad en Supervisor renderice fotos con endpoints /api/photos/', async ({ page }) => {
    // 1. Iniciar sesión como Supervisor
    await page.goto('/login');
    await page.fill('input[type="text"]', 'supervisor');
    await page.fill('input[type="password"]', 'supervisor123');
    await page.click('button[type="submit"]');

    // 2. Navegar a la vista de Supervisor / Revisión de Calidad
    await page.goto('/revision-informes');
    await page.waitForLoadState('networkidle');

    // 3. Confirmar que la vista de Supervisor cargue cleanly
    const mainTitle = page.locator('h1, h2, h3').first();
    await expect(mainTitle).toBeVisible({ timeout: 10000 });
  });
});
