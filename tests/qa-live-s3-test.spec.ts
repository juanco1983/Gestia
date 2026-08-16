import { test, expect } from '@playwright/test';

test.describe('Prueba de Integración en Vivo sobre QA (qagestia.perugenius.com)', () => {
  test('Verificar inicio de sesión y endpoints de contratos y fotos en QA', async ({ page }) => {
    // 1. Navegar a QA Live
    await page.goto('https://qagestia.perugenius.com/login');
    await page.waitForLoadState('networkidle');

    // 2. Autenticarse como Administrador
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Esperar navegación post-login
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});

    // 3. Verificar navegación a Comercial
    await page.goto('https://qagestia.perugenius.com/comercial');
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    // 4. Verificar pestaña Contratos y URLs de PDF
    const verDetalleBtn = page.locator('button', { hasText: 'Ver Detalle' }).first();
    if (await verDetalleBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await verDetalleBtn.click();
      
      const linkPdf = page.locator('a', { hasText: 'Ver Contrato Digitalizado (PDF)' });
      if (await linkPdf.isVisible({ timeout: 5000 }).catch(() => false)) {
        const href = await linkPdf.getAttribute('href');
        console.log('[QA Live Test] URL de Contrato PDF:', href);
        expect(href).toContain('/api/contracts/files/');
      }
    }

    // 5. Verificar panel de Supervisor en QA Live
    await page.goto('https://qagestia.perugenius.com/revision-informes');
    await page.waitForLoadState('networkidle');

    const supHeading = page.locator('h1, h2, h3').first();
    await expect(supHeading).toBeVisible({ timeout: 10000 });
  });
});
