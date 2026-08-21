import { test, expect } from '@playwright/test';
import { login, goToModule, captureConsoleErrors } from './helpers/auth';

test.describe('Fix: Estabilidad de Guardado en BD (server-confirmed)', () => {
  test('Crear cliente con POST fallido NO deja registro fantasma y muestra error', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);
    const log = (m: string) => console.log(`[FIX-SAVE] ${m}`);

    // 1. Login como Ventas y navegar al módulo Comercial (ClientesContratos)
    await login(page, 'Ventas');
    await goToModule(page, 'Comercial');
    await expect(page.getByText(/Directorio de Clientes/i)).toBeVisible({ timeout: 20_000 });
    log('Módulo Comercial cargado');

    const clientName = `MAFORT E2E ${Date.now().toString().slice(-6)}`;
    const clientRuc = '20' + Date.now().toString().slice(-9);

    // 2. Interceptar POST /api/clients para simular caída de red (TypeError → "offline")
    await page.route('**/api/clients', (route) => {
      if (route.request().method() === 'POST') return route.abort();
      return route.continue();
    });

    // 3. Abrir el modal Registrar Cliente
    await page.getByRole('button', { name: /Registrar Cliente/i }).click();
    await expect(page.getByRole('heading', { name: /Registrar Nuevo Cliente/i })).toBeVisible({ timeout: 15_000 });
    log('Modal de nuevo cliente abierto');

    await page.getByPlaceholder('Ej: Repsol Data Center Perú S.A.').fill(clientName);
    await page.getByPlaceholder('Ej: 20100123456').fill(clientRuc);
    log('Formulario de cliente lleno');

    // 4. Enviar el formulario
    await page.getByRole('button', { name: /Guardar Cliente/i }).click();

    // 5. El modal DEBE seguir abierto (no se cierra) y mostrarse el error de conexión
    await expect(page.getByRole('heading', { name: /Registrar Nuevo Cliente/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Error de Conexión/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/NO fue guardado/i)).toBeVisible();
    log('Toast de error de conexión visible: cliente NO fue guardado');

    // 6. El cliente NO debe aparecer en el directorio (sin registro fantasma)
    await expect(page.getByText(new RegExp(clientName, 'i'))).toHaveCount(0);
    log('Cliente fantasma NO aparece en el directorio');

    // 7. Cerrar la notificación de error y luego el modal del formulario
    await page.getByRole('button', { name: /Entendido/i }).click();
    await page.getByRole('button', { name: /Cancelar/i }).click();
    await expect(page.getByRole('heading', { name: /Registrar Nuevo Cliente/i })).toBeHidden();

    // 8. Verificar cero errores de consola inesperados (los errores del fallo simulado son esperados)
    const unexpected = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('net::ERR') &&
        !e.includes('Failed to load resource') &&
        !e.includes('Error al registrar cliente en la BD')
    );
    log(`Errores de consola inesperados: ${unexpected.length}`);
    expect(unexpected).toHaveLength(0);
  });

  test('Crear cliente con POST 500 (error de servidor) tampoco deja registro fantasma', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);
    const log = (m: string) => console.log(`[FIX-SAVE] ${m}`);

    await login(page, 'Ventas');
    await goToModule(page, 'Comercial');
    await expect(page.getByText(/Directorio de Clientes/i)).toBeVisible({ timeout: 20_000 });

    const clientName = `MAFORT SVR ${Date.now().toString().slice(-6)}`;
    const clientRuc = '20' + Date.now().toString().slice(-9);

    // Interceptar POST /api/clients devolviendo 500 (fallo de servidor/BD)
    await page.route('**/api/clients', (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Error interno en la BD' }) });
    });

    await page.getByRole('button', { name: /Registrar Cliente/i }).click();
    await expect(page.getByRole('heading', { name: /Registrar Nuevo Cliente/i })).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder('Ej: Repsol Data Center Perú S.A.').fill(clientName);
    await page.getByPlaceholder('Ej: 20100123456').fill(clientRuc);

    await page.getByRole('button', { name: /Guardar Cliente/i }).click();

    // Debe aparecer el error de registro (mensaje del servidor), modal sigue abierto
    await expect(page.getByRole('heading', { name: /Registrar Nuevo Cliente/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Error de Registro/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Error interno en la BD/i)).toBeVisible();
    log('Toast de error de servidor visible');

    // Sin registro fantasma
    await expect(page.getByText(new RegExp(clientName, 'i'))).toHaveCount(0);
    log('Cliente fantasma NO aparece tras error 500');

    const unexpected = consoleErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('Failed to load resource') &&
        !e.includes('Error al registrar cliente en la BD')
    );
    expect(unexpected).toHaveLength(0);
  });
});