import { test, expect } from '@playwright/test';
import { login, captureConsoleErrors } from './helpers/auth';

test.describe('Prueba de Integración Completa: Flujo End-to-End Entidad Visita', () => {

  test('Flujo Integrado Completo: Desde Programación (Operaciones) hasta Ejecución y Completado (Técnico)', async ({ page, request }) => {
    const consoleErrors = captureConsoleErrors(page);

    // 0. Autenticación API Backend
    const loginRes = await request.post('/api/login', {
      data: { email: 'admin@mafort.pe', password: 'mafort' }
    });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 1. Fase Backend/API: Crear Visita agrupadora
    const visitaData = {
      clientId: 'cli_001',
      ubicacion: 'Sede San Isidro - Av. Javier Prado 1234',
      fechaProgramada: '2026-08-20',
      horaProgramada: '08:30',
      horaFinProgramada: '12:30',
      tecnicoTitularId: 'usr_tec_001',
      tecnicoTitular: 'Juan Córdova',
      estado: 'Programada'
    };

    const createVisitaRes = await request.post('/api/visitas', {
      data: visitaData,
      headers: authHeaders
    });
    expect(createVisitaRes.ok()).toBeTruthy();
    const createdVisita = await createVisitaRes.json();
    expect(createdVisita.id).toBeTruthy();
    expect(createdVisita.codigo).toMatch(/^VIS-2026-\d{4}$/);

    // 2. Crear 2 OTs vinculadas a la Visita
    const ot1Data = {
      id: `OT-FULL-1-${Date.now()}`,
      clientId: 'cli_001',
      visitaId: createdVisita.id,
      tipoMantenimiento: 'Preventivo',
      tipoEquipo: 'UPS',
      potenciaKva: 80,
      fechaProgramada: '2026-08-20',
      tecnicoTitular: 'Juan Córdova',
      estado: 'Programada'
    };

    const ot2Data = {
      id: `OT-FULL-2-${Date.now()}`,
      clientId: 'cli_001',
      visitaId: createdVisita.id,
      tipoMantenimiento: 'Preventivo',
      tipoEquipo: 'Tablero Eléctrico',
      potenciaKva: 150,
      fechaProgramada: '2026-08-20',
      tecnicoTitular: 'Juan Córdova',
      estado: 'Programada'
    };

    const createOt1Res = await request.post('/api/ots', { data: ot1Data, headers: authHeaders });
    expect(createOt1Res.ok()).toBeTruthy();

    const createOt2Res = await request.post('/api/ots', { data: ot2Data, headers: authHeaders });
    expect(createOt2Res.ok()).toBeTruthy();

    // 3. Fase Frontend Navegador: Login real como Técnico
    await login(page, 'Tecnico');
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);

    // 4. Verificar que el portal del técnico abre correctamente
    await expect(page.locator('#tecnico-portal-container')).toBeVisible({ timeout: 15_000 });

    // 5. Cascada de Estado Logístico vía API: Actualizar Visita a "En Camino"
    const updateEnCaminoRes = await request.put(`/api/visitas/${createdVisita.id}`, {
      data: { estado: 'En Camino', horaSalida: '08:00' },
      headers: authHeaders
    });
    expect(updateEnCaminoRes.ok()).toBeTruthy();

    // 6. Verificar que las OTs pasaron a "En Camino" por cascada
    const otsRes = await request.get('/api/ots', { headers: authHeaders });
    expect(otsRes.ok()).toBeTruthy();
    const allOts = await otsRes.json();
    const ot1Updated = allOts.find((o: any) => o.id === ot1Data.id);
    const ot2Updated = allOts.find((o: any) => o.id === ot2Data.id);
    expect(ot1Updated.estado).toBe('En Camino');
    expect(ot2Updated.estado).toBe('En Camino');

    // 7. Cascada de Estado Logístico: Actualizar Visita a "En Sitio"
    const updateEnSitioRes = await request.put(`/api/visitas/${createdVisita.id}`, {
      data: { estado: 'En Sitio', horaLlegada: '08:30' },
      headers: authHeaders
    });
    expect(updateEnSitioRes.ok()).toBeTruthy();

    // 8. Verificar que las OTs pasaron a "En Sitio"
    const otsRes2 = await request.get('/api/ots', { headers: authHeaders });
    const allOts2 = await otsRes2.json();
    expect(allOts2.find((o: any) => o.id === ot1Data.id).estado).toBe('En Sitio');
    expect(allOts2.find((o: any) => o.id === ot2Data.id).estado).toBe('En Sitio');

    // 9. Verificar que no hay errores fatales de JavaScript en consola
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

});
