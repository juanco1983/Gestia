import { test, expect } from '@playwright/test';
import { login, captureConsoleErrors } from './helpers/auth';
import { TOUR_STEPS } from '../src/tour/steps';

const PROGRESS_KEY = 'gestia_tour_progreso';
const SEEN_KEY = 'gestia_tour_progreso_visto';

function popover(page: import('@playwright/test').Page) {
  return page.locator('.driver-popover.tour-guide-popover');
}

async function pressNext(page: import('@playwright/test').Page) {
  const next = page.locator('.driver-popover .tour-guide-next');
  await expect(next).toBeVisible({ timeout: 10_000 });
  await next.click();
}

test.describe('Tour Guiado Interactivo (14 pasos)', () => {
  test('recorre los 14 pasos, termina en facturación y persiste el progreso', async ({ page }) => {
    test.setTimeout(120_000);
    const consoleErrors = captureConsoleErrors(page);
    await login(page, 'Administrador');

    // El tour se auto-inicia tras ~600ms en el primer login
    await expect(page.locator('.driver-overlay')).toBeVisible({ timeout: 15_000 });
    const first = popover(page);
    await expect(first.getByText('Bienvenido a Gestia')).toBeVisible({ timeout: 10_000 });

    // Recorrer los pasos 1..13 (primer paso ya visible)
    const expectedTitles = TOUR_STEPS.map((s) => s.title);
    for (let i = 0; i < TOUR_STEPS.length; i++) {
      const p = popover(page);
      await expect(p).toBeVisible({ timeout: 10_000 });
      // driver.js a veces muta el DOM; verificamos el título del paso actual
      await expect(p.getByText(expectedTitles[i], { exact: false })).toBeVisible({ timeout: 10_000 });

      const step = TOUR_STEPS[i];
      if (step.banner === 'final') {
        await expect(p.getByRole('button', { name: 'Terminar' })).toBeVisible();
      } else if (i > 0) {
        await expect(p.getByRole('button', { name: 'Atrás' })).toBeVisible();
      }
      await expect(p.getByRole('button', { name: 'Saltar tour' })).toBeVisible();

      // En pasos de dependencia se muestra el aviso (⚠) en la descripción
      if (step.banner === 'dependencia' && step.note) {
        await expect(p.getByText(/⚠/)).toBeVisible();
      }

      if (i < TOUR_STEPS.length - 1) {
        await pressNext(page);
      }
    }

    // Paso final: botón Terminar cierra el tour
    const finalPopup = popover(page);
    await expect(finalPopup.getByText('Paso 13 · Final: facturar el servicio', { exact: false })).toBeVisible();
    await finalPopup.getByRole('button', { name: 'Terminar' }).click();
    await expect(page.locator('.driver-overlay')).toBeHidden({ timeout: 10_000 });

    // Progreso persistido como completado
    const progress = await page.evaluate((key) => {
      try {
        return JSON.parse(localStorage.getItem(key) ?? '');
      } catch {
        return null;
      }
    }, PROGRESS_KEY);
    expect(progress?.completed).toBe(true);

    // Cero errores de consola (ignorando favicon)
    const realErrors = consoleErrors.filter((e) => !e.includes('favicon'));
    expect(realErrors, `Errores de consola: ${realErrors.join(' | ')}`).toEqual([]);
  });

  test('auto-start no se repite tras marcar visto, y Ctrl+Shift+H lo relanza', async ({ page }) => {
    test.setTimeout(90_000);
    const consoleErrors = captureConsoleErrors(page);
    await login(page, 'Administrador');
    await expect(page.locator('.driver-overlay')).toBeVisible({ timeout: 15_000 });
    await popover(page).getByRole('button', { name: 'Saltar tour' }).click();
    await expect(page.locator('.driver-overlay')).toBeHidden({ timeout: 10_000 });

    // Recarga: el tour NO se auto-inicia porque ya se marcó como visto
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#sidebar-panel')).toBeVisible({ timeout: 25_000 });
    await page.waitForTimeout(1500);
    await expect(page.locator('.driver-overlay')).toBeHidden();

    // Atajo Ctrl+Shift+H relanza el tour
    await page.keyboard.press('Control+Shift+H');
    await expect(page.locator('.driver-overlay')).toBeVisible({ timeout: 10_000 });

    const realErrors = consoleErrors.filter((e) => !e.includes('favicon'));
    expect(realErrors, `Errores de consola: ${realErrors.join(' | ')}`).toEqual([]);
  });

  test('navegación por teclado: → avanza, ← retrocede, Esc salta', async ({ page }) => {
    test.setTimeout(90_000);
    await login(page, 'Administrador');
    await expect(page.locator('.driver-overlay')).toBeVisible({ timeout: 15_000 });
    await expect(popover(page).getByText('Bienvenido a Gestia')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(popover(page).getByText('Paso 1 · Registrar el cliente', { exact: false })).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('ArrowLeft');
    await expect(popover(page).getByText('Bienvenido a Gestia')).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('Escape');
    await expect(page.locator('.driver-overlay')).toBeHidden({ timeout: 10_000 });
  });
});