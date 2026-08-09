import { test, expect } from '@playwright/test';
import { login, goToModule, captureConsoleErrors } from './helpers/auth';

test.describe('Gestión de OT — Botones de creación manual deshabilitados', () => {
  test('Crear OT Marco y Agregar Cuota/Línea deshabilitados con tooltip; Exportar CSV activo', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = captureConsoleErrors(page);

    await login(page, 'Administrador');
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);

    await goToModule(page, 'Gestión de OT');
    await expect(page.locator('#ot-marco-main-panel')).toBeVisible({ timeout: 15_000 });

    const crearOtMarco = page.getByRole('button', { name: /Crear OT Marco \(Padre\)/i });
    await expect(crearOtMarco).toBeVisible();
    await expect(crearOtMarco).toBeDisabled();
    await expect(crearOtMarco).toHaveAttribute('aria-disabled', 'true');
    await expect(crearOtMarco).toHaveAttribute('title', /se crean automáticamente al programar una visita/i);

    const agregarCuota = page.getByRole('button', { name: /Agregar Cuota\/Línea/i });
    await expect(agregarCuota).toBeVisible();
    await expect(agregarCuota).toBeDisabled();
    await expect(agregarCuota).toHaveAttribute('aria-disabled', 'true');
    await expect(agregarCuota).toHaveAttribute('title', /se generan automáticamente al crear la OT/i);

    const exportarCsv = page.getByRole('button', { name: /Exportar Excel\/CSV/i });
    await expect(exportarCsv).toBeVisible();
    await expect(exportarCsv).toBeEnabled();

    await expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });
});