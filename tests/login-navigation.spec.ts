import { test, expect } from '@playwright/test';
import { login, captureConsoleErrors, ROLE_MODULES, TEST_USERS } from './helpers/auth';

test.describe('Slice 1 — Login y navegación por rol', () => {
  for (const [role, modules] of Object.entries(ROLE_MODULES) as [keyof typeof TEST_USERS, string[]][]) {
    test.describe(`Rol: ${role}`, () => {
      test('inicia sesión sin errores de consola y ve el sidebar', async ({ page }) => {
        const errors = captureConsoleErrors(page);
        await login(page, role);
        await expect(page.locator('#sidebar-panel')).toBeVisible();
        expect(errors.length).toBe(0);
      });

      for (const moduleLabel of modules) {
        test(`navega al módulo "${moduleLabel}" sin errores de consola`, async ({ page }) => {
          const errors = captureConsoleErrors(page);
          await login(page, role);
          await emptyContentTest(page, moduleLabel);
          expect(errors, `Errores de consola: ${errors.join(' | ')}`).toEqual([]);
        });
      }
    });
  }
});

/** Verifica que al entrar a un módulo la vista principal renderiza contenido. */
async function emptyContentTest(page: import('@playwright/test').Page, moduleLabel: string) {
  await page.locator('#sidebar-panel nav').getByRole('button', { name: moduleLabel, exact: false }).first().click();
  await expect(page.locator('#main-workspace-content')).toBeVisible({ timeout: 15_000 });
}