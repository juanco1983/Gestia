import { test, expect } from '@playwright/test';
import { login, captureConsoleErrors } from './helpers/auth';

test.describe('Feature Entidad Visita — Pruebas de Integración y E2E', () => {

  test('Prueba de Integración: API CRUD /api/visitas y cascada de estado logístico', async ({ request }) => {
    // 0. Obtener token de autenticación
    const loginRes = await request.post('/api/login', {
      data: { email: 'admin@mafort.pe', password: 'mafort' }
    });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 1. Crear Visita vía API REST
    const newVisitaData = {
      clientId: 'cli_001',
      ubicacion: 'Sede San Isidro - Av. Javier Prado 1234',
      fechaProgramada: '2026-08-15',
      horaProgramada: '09:00',
      tecnicoTitularId: 'usr_tec_001',
      tecnicoTitular: 'Juan Córdova',
      estado: 'Programada'
    };

    const createRes = await request.post('/api/visitas', {
      data: newVisitaData,
      headers: authHeaders
    });
    if (!createRes.ok()) {
      console.log("POST /api/visitas error status:", createRes.status(), await createRes.text());
    }
    expect(createRes.ok()).toBeTruthy();
    const createdVisita = await createRes.json();
    expect(createdVisita.id).toBeTruthy();
    expect(createdVisita.codigo).toMatch(/^VIS-2026-\d{4}$/);

    // 2. Crear OT vinculada a la Visita
    const otData = {
      id: `OT-E2E-${Date.now()}`,
      clientId: 'cli_001',
      visitaId: createdVisita.id,
      tipoMantenimiento: 'Preventivo',
      tipoEquipo: 'UPS',
      potenciaKva: 80,
      fechaProgramada: '2026-08-15',
      tecnicoTitular: 'Juan Córdova',
      estado: 'Programada'
    };

    const createOtRes = await request.post('/api/ots', {
      data: otData,
      headers: authHeaders
    });
    expect(createOtRes.ok()).toBeTruthy();

    // 3. Actualizar estado de Visita a "En Camino" y verificar la cascada a la OT
    const updateVisitaRes = await request.put(`/api/visitas/${createdVisita.id}`, {
      data: {
        estado: 'En Camino',
        horaSalida: '08:30'
      },
      headers: authHeaders
    });
    if (!updateVisitaRes.ok()) {
      console.log("PUT /api/visitas error status:", updateVisitaRes.status(), await updateVisitaRes.text());
    }
    expect(updateVisitaRes.ok()).toBeTruthy();

    // 4. Verificar que la OT vinculada haya pasado a "En Camino" por cascada
    const getOtRes = await request.get('/api/ots', { headers: authHeaders });
    expect(getOtRes.ok()).toBeTruthy();
    const otsList = await getOtRes.json();
    const childOt = otsList.find((o: any) => o.id === otData.id);
    expect(childOt).toBeTruthy();
    expect(childOt.estado).toBe('En Camino');
  });

  test('Prueba E2E Navegador: Flujo completo del Técnico de Campo con Visita', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);

    // 1. Iniciar sesión como Técnico
    await login(page, 'Tecnico');
    expect(consoleErrors.length).toBe(0);

    // 2. Verificar que el panel del técnico cargó
    await expect(page.locator('#main-workspace-content')).toBeVisible({ timeout: 15_000 });

    // 3. Verificar que no hay errores fatales de consola
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

});
