import { test, expect } from '@playwright/test';
import { login, goToModule, captureConsoleErrors } from './helpers/auth';

const TABS = ['analytics', 'targets', 'comercial'] as const;

test.describe('Gestión de OT — Pestañas rediseñadas (Analíticas, Metas, Comercial)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'Administrador');
    await goToModule(page, 'Gestión de OT');
    await expect(page.locator('#ot-tabs')).toBeVisible({ timeout: 15_000 });
  });

  for (const tab of TABS) {
    test(`pestaña "${tab}" renderiza KPIs sin errores de consola`, async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.locator('#ot-tabs button').filter({ hasText: new RegExp(tab === 'analytics' ? 'Desviación' : tab === 'targets' ? 'Metas' : 'Rendimiento', 'i') }).click();

      if (tab === 'analytics') {
        await expect(page.locator('#ot-tabs').locator('..')).toBeVisible();
        await expect(page.getByText('Panorama Operativo y Alertas')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Backlog de facturación')).toBeVisible();
        await expect(page.getByText('Distribución por estado')).toBeVisible();
        await expect(page.getByText('Alertas operativas')).toBeVisible();
      }

      if (tab === 'targets') {
        await expect(page.locator('#ot-reporte-target')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Control de Metas de Ventas Anual')).toBeVisible();
        await expect(page.getByText('Meta Anual')).toBeVisible();
      }

      if (tab === 'comercial') {
        await expect(page.locator('#ot-reporte-comercial')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Cartera de Ejecutivos y Facturación')).toBeVisible();
      }

      expect(errors, `Errores de consola: ${errors.join(' | ')}`).toEqual([]);
    });
  }
});
