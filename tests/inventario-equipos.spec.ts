import { test, expect } from '@playwright/test';
import { login, goToModule, captureConsoleErrors } from './helpers/auth';

async function dismissTourIfPresent(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.setItem('gestia_tour_progreso_visto', '1');
  }).catch(() => {});
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#sidebar-panel')).toBeVisible({ timeout: 25_000 });
  await page.waitForTimeout(700);
}

async function openInventario(page: import('@playwright/test').Page) {
  await login(page, 'Administrador');
  await dismissTourIfPresent(page);
  await goToModule(page, 'Inventario de Equipos');
  await expect(page.getByRole('heading', { name: 'Inventario de Equipos' })).toBeVisible({ timeout: 15_000 });
}

async function openDrawer(page: import('@playwright/test').Page, codigo: string) {
  const row = page.locator('tbody tr', { hasText: codigo });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.locator('button[title="Ver detalle e histórico"]').click();
  await expect(page.locator('#inventario-drawer-title')).toContainText(codigo, { timeout: 15_000 });
}

test.describe('Inventario de Equipos consolidado', () => {
  test('muestra header, KPIs y la tabla con los equipos sembrados', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);
    await openInventario(page);

    const kpi = page.getByText('Total Equipos');
    await expect(kpi).toBeVisible({ timeout: 15_000 });

    // KPI Total: existen al menos 2 equipos sembrados
    await expect(page.locator('div', { hasText: /^Total Equipos/ }).locator('..').getByText(/^[0-9]+$/).first()).toBeVisible();

    // Tabla: filas de los equipos de prueba
    await expect(page.locator('tbody tr', { hasText: 'UPS-HIST-001' })).toBeVisible();
    await expect(page.locator('tbody tr', { hasText: 'UPS-HIST-002' })).toBeVisible();
    await expect(page.locator('tbody tr', { hasText: 'Prosegur Test S.A.' }).first()).toBeVisible();

    expect(consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Failed to load resource: the server responded with a status of 404'))).toHaveLength(0);
  }, );

  test('búsqueda por código filtra la tabla', async ({ page }) => {
    await openInventario(page);

    const search = page.getByPlaceholder('Buscar por código, serie, marca o modelo...');
    await search.fill('UPS-HIST-002');
    await expect(page.locator('tbody tr', { hasText: 'UPS-HIST-001' })).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator('tbody tr', { hasText: 'UPS-HIST-002' })).toHaveCount(1, { timeout: 15_000 });

    await search.fill('UPS-HIST-001');
    await expect(page.locator('tbody tr', { hasText: 'UPS-HIST-001' })).toHaveCount(1, { timeout: 15_000 });
  });

  test('el drawer muestra el histórico de informes con su detalle y voltajes', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);
    await openInventario(page);
    await openDrawer(page, 'UPS-HIST-001');

    // Histórico: UPS-HIST-001 tiene 2 informes
    await expect(page.getByText('Histórico completo')).toBeVisible();
    await expect(page.getByText(/Informes Técnicos \(\d+\)/)).toBeVisible({ timeout: 10_000 });

    // Detalle de cada informe del histórico
    await expect(page.getByText('INF-2026-001').first()).toBeVisible();
    await expect(page.getByText('INF-2026-002').first()).toBeVisible();

    // Voltajes del último informe en el card "Voltaje Último Informe"
    const voltajeCard = page.locator('.fixed.inset-0').getByText('Voltaje Último Informe', { exact: true });
    await expect(voltajeCard).toBeVisible();
    const voltajeEntrada = page.locator('.fixed.inset-0').getByText(/^\d{3}V$/).first();
    await expect(voltajeEntrada).toBeVisible();

    // Resumen completo: cada informe muestra fecha, tipo, técnico y voltajes de entrada/salida
    const cardInforme = page.locator('.fixed.inset-0 .rounded-xl', { hasText: /Fecha:/ }).filter({ hasText: 'INF-2026-001' });
    await expect(cardInforme).toBeVisible();
    await expect(cardInforme.getByText(/Fecha:/)).toBeVisible();
    await expect(cardInforme.getByText(/Tipo:/)).toBeVisible();
    await expect(cardInforme.getByText(/Técnico:/)).toBeVisible();
    await expect(cardInforme.getByText(/V\. Entrada:/)).toBeVisible();
    await expect(cardInforme.getByText(/V\. Salida:/)).toBeVisible();

    // Ahora cada informe tiene los botones Ver y PDF
    await expect(cardInforme.getByRole('button', { name: 'Ver' })).toBeVisible();
    await expect(cardInforme.getByRole('button', { name: 'PDF' })).toBeVisible();

    expect(consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Failed to load resource: the server responded with a status of 404'))).toHaveLength(0);
  });

  test('el estado del equipo se deriva del diagnóstico del último informe', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);
    await openInventario(page);

    // UPS-HIST-002: último informe con estadoOperativo=false + bypass + recomendaciones -> En observación
    const rowObs = page.locator('tbody tr', { hasText: 'UPS-HIST-002' });
    await expect(rowObs.locator('span', { hasText: 'En observación' })).toBeVisible({ timeout: 15_000 });

    // UPS-HIST-001: último informe operativo -> Operativo
    const rowOp = page.locator('tbody tr', { hasText: 'UPS-HIST-001' });
    await expect(rowOp.locator('span', { hasText: 'Operativo' })).toBeVisible({ timeout: 15_000 });

    // Drawer: panel "Estado según último informe" con referencia al informe y la regla de derivación
    await openDrawer(page, 'UPS-HIST-002');
    await expect(page.getByText('Estado según último informe')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.fixed.inset-0').getByText(/INF-2025-088/).first()).toBeVisible();
    await expect(page.getByText('El estado solo cambia al emitir un nuevo informe técnico desde la OT.')).toBeVisible();

    // Ya no existe la acción manual "Cambiar Estado"
    await expect(page.getByRole('button', { name: 'Cambiar Estado' })).toHaveCount(0);

    expect(consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Failed to load resource: the server responded with a status of 404'))).toHaveLength(0);
  });

  test('el botón Ver abre el modal con el informe en formato documento (PDF) y permite descargar', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);
    await openInventario(page);
    await openDrawer(page, 'UPS-HIST-001');

    // Abrir el modal "Ver" del primer informe del histórico
    const cardInforme = page.locator('.fixed.inset-0 .rounded-xl', { hasText: /Fecha:/ }).filter({ hasText: 'INF-2026-001' });
    await cardInforme.getByRole('button', { name: 'Ver' }).click();

    // Modal con encabezado de vista previa y número de informe
    await expect(page.getByText('Vista previa del informe')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('INF-2026-001').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Descargar PDF' })).toBeVisible();

    // El modal renderiza el contenido del documento (encabezado del informe técnico)
    await expect(page.getByText('INFORME TECNICO #INF-2026-001').first()).toBeVisible({ timeout: 15_000 });

    // Se puede cerrar el modal
    await page.locator('.fixed.inset-0.z-\\[9500\\]').getByLabel('Cerrar').click();
    await expect(page.getByText('Vista previa del informe')).toHaveCount(0);

    expect(consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Failed to load resource: the server responded with a status of 404'))).toHaveLength(0);
  });

  test('el rol Técnico ve el módulo en solo lectura sin acciones destructivas', async ({ page }) => {
    await login(page, 'Tecnico');
    await dismissTourIfPresent(page);
    await goToModule(page, 'Inventario de Equipos');
    await expect(page.getByRole('heading', { name: 'Inventario de Equipos' })).toBeVisible({ timeout: 15_000 });
    await openDrawer(page, 'UPS-HIST-001');

    // Histórico visible igualmente
    await expect(page.getByText('INF-2026-001').first()).toBeVisible();

    // Sin acciones: ni cambiar estado (retirado del diseño) ni eliminar
    await expect(page.getByRole('button', { name: 'Cambiar Estado' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Eliminar' })).toHaveCount(0);

    // Sí puede abrir el PDF y Ver el informe (solo lectura, permitido)
    await expect(page.getByRole('button', { name: 'PDF' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver' }).first()).toBeVisible();
  });
});
