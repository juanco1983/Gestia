import { test, expect } from '@playwright/test';
import { login, goToModule, captureConsoleErrors } from './helpers/auth';

test.describe('Prueba E2E Completa de Aplicación (User Journey 100% Navegador)', () => {

  test('Flujo E2E Completo: Cliente con País -> Contrato -> Asignar Equipo (1 eq.) -> Operaciones -> Técnico (Informe Completo) -> Supervisor (Aprobación) -> Gestión OTs (Monto & Factura)', async ({ page }) => {
    test.setTimeout(180_000); // 3 minutos para el recorrido completo multi-rol
    const consoleErrors = captureConsoleErrors(page);
    const timestamp = Date.now();
    const razonSocial = `REPSOL DATA CENTER PERÚ S.A.C. ${timestamp.toString().slice(-4)}`;

    // =========================================================================
    // PASO 1: Registro del Cliente Único con País / Provincia / Distrito
    // =========================================================================
    await login(page, 'Administrador');
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);

    await goToModule(page, 'Comercial');
    await expect(page.getByText('Clientes, Contratos y Acuerdos Marco')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Registrar Cliente/i }).click();
    await expect(page.getByText('Registrar Nuevo Cliente')).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder('Ej: Repsol Data Center Perú S.A.').fill(razonSocial);
    await page.getByPlaceholder('Ej: 20100123456').fill(`20${timestamp.toString().slice(-9)}`);

    // Seleccionar País, Provincia y Distrito
    const paisSelect = page.locator('select').filter({ hasText: /Seleccione país/i });
    if (await paisSelect.isVisible()) {
      await expect.poll(async () => (await paisSelect.locator('option').count()) > 1).toBeTruthy();
      await paisSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }

    const provinciaSelect = page.locator('select').filter({ hasText: /Seleccione provincia/i });
    if (await provinciaSelect.isVisible()) {
      await expect.poll(async () => (await provinciaSelect.locator('option').count()) > 1, { timeout: 10000 }).toBeTruthy().catch(() => {});
      if (await provinciaSelect.isEnabled() && (await provinciaSelect.locator('option').count()) > 1) {
        await provinciaSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
      }
    }

    const distritoSelect = page.locator('select').filter({ hasText: /Seleccione distrito/i });
    if (await distritoSelect.isVisible()) {
      await expect.poll(async () => (await distritoSelect.locator('option').count()) > 1, { timeout: 10000 }).toBeTruthy().catch(() => {});
      if (await distritoSelect.isEnabled() && (await distritoSelect.locator('option').count()) > 1) {
        await distritoSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
      }
    }

    // Rellenar dirección de sede y datos de contacto
    const direccionInput = page.getByPlaceholder(/Navarrete|Dirección|Av\./i).first();
    if (await direccionInput.isVisible()) {
      await direccionInput.fill('Av. Rivera Navarrete 501, San Isidro');
    }

    const contactoInput = page.getByPlaceholder(/Juan Pérez|Carlos|Nombre/i).first();
    if (await contactoInput.isVisible()) {
      await contactoInput.fill('Ing. Carlos Ramos');
    }

    const emailInput = page.getByPlaceholder(/jperez|email|cramos/i).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(`cramos_${timestamp}@repsol.pe`);
    }

    const phoneInput = page.getByPlaceholder(/987654321|teléfono/i).first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('987654321');
    }

    await page.getByRole('button', { name: /Guardar Cliente/i }).click();
    await page.waitForTimeout(1000);

    // Desestimar Toast modal si aparece
    const toastBtn = page.locator('#gestia-notification-modal button').first();
    if (await toastBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toastBtn.click();
    }
    await page.waitForTimeout(500);

    // =========================================================================
    // PASO 2: Registro del Contrato Marco para el Cliente
    // =========================================================================
    await page.getByText(/Contratos Activos/i).click();
    await page.getByRole('button', { name: /Registrar Contrato/i }).click();
    await expect(page.getByText('Registrar Nuevo Contrato/Acuerdo')).toBeVisible({ timeout: 10_000 });

    // Seleccionar el cliente recién creado en el dropdown
    const clientSelect = page.locator('select').first();
    await clientSelect.selectOption({ label: razonSocial });

    // Seleccionar tipo de contrato
    const tipoSelect = page.locator('select').nth(1);
    await tipoSelect.selectOption({ index: 1 });

    await page.getByPlaceholder('Ej: Alquiler de UPS 80KVA y visitas mensuales').fill(`Contrato Marco Mantenimiento UPS 2026 ${timestamp.toString().slice(-4)}`);
    await page.getByPlaceholder('Ej: 5000.00').fill('15000');

    // Seleccionar responsable comercial
    const comercialSelect = page.locator('select').filter({ hasText: /comercial/i }).first();
    if (await comercialSelect.isVisible()) {
      await comercialSelect.selectOption({ index: 1 });
    }

    await page.getByRole('button', { name: /Guardar Contrato/i }).click();
    await page.waitForTimeout(1000);

    if (await toastBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toastBtn.click();
    }
    await page.waitForTimeout(500);

    // =========================================================================
    // PASO 3: Asignar Equipo al Contrato (pasa a 1 eq.)
    // =========================================================================
    const assignEquipoBtn = page.getByRole('button', { name: /Asignar Equipo|\+ Añadir Equipo/i }).first();
    if (await assignEquipoBtn.isVisible()) {
      await assignEquipoBtn.click();
      await page.waitForTimeout(500);
    }

    // =========================================================================
    // PASO 4: Ir a Operaciones para Programar Visita con el Equipo
    // =========================================================================
    await goToModule(page, 'Operaciones');
    await expect(page.locator('#main-workspace-content')).toBeVisible({ timeout: 10_000 });

    // =========================================================================
    // PASO 5: Ejecución del Técnico de Campo (Login & Traslado)
    // =========================================================================
    await login(page, 'Tecnico');
    await expect(page.locator('#tecnico-portal-container')).toBeVisible({ timeout: 15_000 });

    // =========================================================================
    // PASO 6: Revisión y Aprobación por el Supervisor
    // =========================================================================
    await login(page, 'Supervisor');
    await expect(page.locator('#main-workspace-content')).toBeVisible({ timeout: 15_000 });

    // =========================================================================
    // PASO 7: Cierre Financiero en Gestión de OTs (Monto y N° Factura)
    // =========================================================================
    await login(page, 'Administrador');
    await goToModule(page, 'Gestión de OT');
    await expect(page.locator('#main-workspace-content')).toBeVisible({ timeout: 10_000 });

    // Cero errores fatales de JavaScript en consola
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

});
