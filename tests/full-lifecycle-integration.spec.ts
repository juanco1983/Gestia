import { test, expect } from '@playwright/test';
import { login, captureConsoleErrors } from './helpers/auth';

test.describe('Prueba de Integración Extremo a Extremo (Ciclo Completo)', () => {

  test('Ciclo Completo: Creación de Cliente -> Equipo -> Visita -> OT -> Logística -> Informe Técnico', async ({ page, request }) => {
    const consoleErrors = captureConsoleErrors(page);

    // 1. Autenticación inicial como Admin/Operaciones vía API
    const loginRes = await request.post('/api/login', {
      data: { email: 'admin@mafort.pe', password: 'mafort' }
    });
    expect(loginRes.ok()).toBeTruthy();
    const { token } = await loginRes.json();
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Creación del Cliente
    const timestamp = Date.now();
    const clientPayload = {
      razonSocial: `CLIENTE CORPORATIVO E2E S.A.C. ${timestamp}`,
      ruc: `20${timestamp.toString().slice(-9)}`,
      direccionSede: 'Av. República de Panamá 3505, San Isidro',
      distrito: 'San Isidro',
      contactoNombre: 'Ing. Fernando Ramos',
      contactoTelefono: '998877665',
      contactoEmail: `framos_${timestamp}@cliente.pe`
    };

    const createClientRes = await request.post('/api/clients', {
      data: clientPayload,
      headers: authHeaders
    });
    expect(createClientRes.ok()).toBeTruthy();
    const createdClient = await createClientRes.json();
    expect(createdClient.id).toBeTruthy();

    // 3. Creación del Equipo con Ubicación Obligatoria (US-4)
    const equipoPayload = {
      id: `eq_e2e_${timestamp}`,
      codigo: `EQ-UPS-${timestamp.toString().slice(-4)}`,
      clientId: createdClient.id,
      tipo: 'UPS',
      marca: 'APC Schneider',
      modelo: 'Symmetra PX 80KVA',
      serie: `SN-APC-${timestamp}`,
      potenciaKva: 80,
      ubicacion: 'Centro de Cómputo - Piso 4, Gabinete A-01',
      estado: 'Operativo'
    };

    const createEquipoRes = await request.post('/api/equipos', {
      data: equipoPayload,
      headers: authHeaders
    });
    expect(createEquipoRes.ok()).toBeTruthy();

    // 4. Programación de la Visita Agrupadora (US-1)
    const visitaPayload = {
      clientId: createdClient.id,
      ubicacion: equipoPayload.ubicacion,
      fechaProgramada: '2026-08-30',
      horaProgramada: '08:30',
      horaFinProgramada: '12:30',
      tecnicoTitularId: 'usr_tec_001',
      tecnicoTitular: 'Juan Córdova',
      estado: 'Programada'
    };

    const createVisitaRes = await request.post('/api/visitas', {
      data: visitaPayload,
      headers: authHeaders
    });
    expect(createVisitaRes.ok()).toBeTruthy();
    const createdVisita = await createVisitaRes.json();
    expect(createdVisita.id).toBeTruthy();
    expect(createdVisita.codigo).toMatch(/^VIS-2026-\d{4}$/);

    // 5. Creación de la OT asociada al Cliente, Equipo y Visita
    const otPayload = {
      id: `OT-E2E-FULL-${timestamp}`,
      clientId: createdClient.id,
      visitaId: createdVisita.id,
      equipoId: equipoPayload.id,
      tipoMantenimiento: 'Preventivo',
      tipoEquipo: 'UPS',
      potenciaKva: 80,
      fechaProgramada: '2026-08-30',
      tecnicoTitularId: 'usr_tec_001',
      tecnicoTitular: 'Juan Córdova',
      estado: 'Programada'
    };

    const createOtRes = await request.post('/api/ots', {
      data: otPayload,
      headers: authHeaders
    });
    expect(createOtRes.ok()).toBeTruthy();

    // 6. Transición Logística 1: Visita passa a "En Camino" (Cascada)
    const putEnCaminoRes = await request.put(`/api/visitas/${createdVisita.id}`, {
      data: { estado: 'En Camino', horaSalida: '08:00' },
      headers: authHeaders
    });
    expect(putEnCaminoRes.ok()).toBeTruthy();

    // Verificación de propagación a la OT
    const getOtCheck1 = await request.get('/api/ots', { headers: authHeaders });
    const otsList1 = await getOtCheck1.json();
    const otCheck1 = otsList1.find((o: any) => o.id === otPayload.id);
    expect(otCheck1.estado).toBe('En Camino');

    // 7. Transición Logística 2: Visita pasa a "En Sitio" (Cascada)
    const putEnSitioRes = await request.put(`/api/visitas/${createdVisita.id}`, {
      data: { estado: 'En Sitio', horaLlegada: '08:30' },
      headers: authHeaders
    });
    expect(putEnSitioRes.ok()).toBeTruthy();

    const getOtCheck2 = await request.get('/api/ots', { headers: authHeaders });
    const otsList2 = await getOtCheck2.json();
    const otCheck2 = otsList2.find((o: any) => o.id === otPayload.id);
    expect(otCheck2.estado).toBe('En Sitio');

    // 8. Generación del Informe Técnico Oficial
    const reportPayload = {
      id: `rpt_e2e_${timestamp}`,
      otId: otPayload.id,
      equipoId: equipoPayload.id,
      cliente: createdClient.razonSocial,
      fecha: '2026-08-30',
      tecnico: 'Juan Córdova',
      equipoTipo: 'UPS',
      equipoMarca: 'APC Schneider',
      equipoModelo: 'Symmetra PX 80KVA',
      equipoSerie: equipoPayload.serie,
      potenciaKva: 80,
      ubicacion: equipoPayload.ubicacion,
      estadoFinalEquipo: 'Operativo',
      observaciones: 'Mantenimiento preventivo ejecutado satisfactoriamente sin anomalías térmicas.',
      recomendaciones: 'Programar siguiente mantenimiento preventivo en 6 meses.'
    };

    const createReportRes = await request.post('/api/reports', {
      data: reportPayload,
      headers: authHeaders
    });
    expect(createReportRes.ok()).toBeTruthy();

    // 9. Cambio de Estado de la OT a "EN_REVISION"
    const putOtRevisionRes = await request.put(`/api/ots/${otPayload.id}`, {
      data: { estado: 'En Revision' },
      headers: authHeaders
    });
    expect(putOtRevisionRes.ok()).toBeTruthy();

    // 10. Interacción Visual en Navegador Real (Playwright)
    await login(page, 'Tecnico');
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);

    // 11. Comprobar que el espacio de trabajo del Técnico funciona correctamente
    await expect(page.locator('#tecnico-portal-container')).toBeVisible({ timeout: 15_000 });
  });

});
