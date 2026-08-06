import { test, expect } from '@playwright/test';

test.describe('Suite Completa de Pruebas de Integración (API, Base de Datos Postgres & Sync)', () => {

  let token = '';
  let authHeaders = {};

  test.beforeAll(async ({ request }) => {
    // Autenticación inicial para obtener JWT
    const loginRes = await request.post('/api/login', {
      data: { email: 'admin@mafort.pe', password: 'mafort' }
    });
    expect(loginRes.ok()).toBeTruthy();
    const body = await loginRes.json();
    token = body.token;
    authHeaders = { Authorization: `Bearer ${token}` };
  });

  test('Integración 1: CRUD de Visita y Validación de Código Correlativo (VIS-YYYY-NNNN)', async ({ request }) => {
    const visitaData = {
      clientId: 'cli_001',
      ubicacion: 'Planta Principal - Av. Argentina 4500',
      fechaProgramada: '2026-08-25',
      horaProgramada: '10:00',
      tecnicoTitularId: 'usr_tec_001',
      tecnicoTitular: 'Juan Córdova',
      estado: 'Programada'
    };

    const res = await request.post('/api/visitas', { data: visitaData, headers: authHeaders });
    expect(res.ok()).toBeTruthy();
    const created = await res.json();
    expect(created.id).toBeTruthy();
    expect(created.codigo).toMatch(/^VIS-2026-\d{4}$/);
  });

  test('Integración 2: Cascada de Estados Logísticos (Visita -> OTs en Postgres)', async ({ request }) => {
    // 1. Crear Visita
    const visitaRes = await request.post('/api/visitas', {
      data: {
        clientId: 'cli_001',
        ubicacion: 'Sede Surco - Av. Primavera 500',
        fechaProgramada: '2026-08-26',
        tecnicoTitularId: 'usr_tec_001',
        tecnicoTitular: 'Juan Córdova',
        estado: 'Programada'
      },
      headers: authHeaders
    });
    expect(visitaRes.ok()).toBeTruthy();
    const visita = await visitaRes.json();

    const ot1Id = `OT-INT-1-${Date.now()}`;
    const ot2Id = `OT-INT-2-${Date.now()}`;

    // 2. Crear 2 OTs vinculadas
    const ot1Res = await request.post('/api/ots', {
      data: {
        id: ot1Id,
        clientId: 'cli_001',
        visitaId: visita.id,
        tipoMantenimiento: 'Preventivo',
        tipoEquipo: 'UPS',
        potenciaKva: 60,
        fechaProgramada: '2026-08-26',
        tecnicoTitular: 'Juan Córdova',
        estado: 'Programada'
      },
      headers: authHeaders
    });
    expect(ot1Res.ok()).toBeTruthy();

    const ot2Res = await request.post('/api/ots', {
      data: {
        id: ot2Id,
        clientId: 'cli_001',
        visitaId: visita.id,
        tipoMantenimiento: 'Preventivo',
        tipoEquipo: 'Grupo Electrógeno',
        potenciaKva: 200,
        fechaProgramada: '2026-08-26',
        tecnicoTitular: 'Juan Córdova',
        estado: 'Programada'
      },
      headers: authHeaders
    });
    expect(ot2Res.ok()).toBeTruthy();

    // 3. Ejecutar cambio de estado a "En Camino" en la Visita
    const putEnCamino = await request.put(`/api/visitas/${visita.id}`, {
      data: { estado: 'En Camino', horaSalida: '09:00' },
      headers: authHeaders
    });
    expect(putEnCamino.ok()).toBeTruthy();

    // 4. Verificar que ambas OTs pasaron a "En Camino"
    const getOts = await request.get('/api/ots', { headers: authHeaders });
    const allOts = await getOts.json();
    const child1 = allOts.find((o: any) => o.id === ot1Id);
    const child2 = allOts.find((o: any) => o.id === ot2Id);
    expect(child1).toBeDefined();
    expect(child2).toBeDefined();
    expect(child1.estado).toBe('En Camino');
    expect(child2.estado).toBe('En Camino');

    // 5. Ejecutar cambio de estado a "En Sitio" en la Visita
    const putEnSitio = await request.put(`/api/visitas/${visita.id}`, {
      data: { estado: 'En Sitio', horaLlegada: '09:35' },
      headers: authHeaders
    });
    expect(putEnSitio.ok()).toBeTruthy();

    const getOts2 = await request.get('/api/ots', { headers: authHeaders });
    const allOts2 = await getOts2.json();
    expect(allOts2.find((o: any) => o.id === ot1Id).estado).toBe('En Sitio');
    expect(allOts2.find((o: any) => o.id === ot2Id).estado).toBe('En Sitio');
  });

  test('Integración 3: Sincronización Masiva Offline (/api/sync)', async ({ request }) => {
    const uniqueSeq = Math.floor(1000 + Math.random() * 9000);
    const syncPayload = {
      visitas: [
        {
          id: `vis_off_${Date.now()}`,
          codigo: `VIS-2026-${uniqueSeq}`,
          clientId: 'cli_001',
          ubicacion: 'Sede Callao - Av. Faucett 100',
          fechaProgramada: '2026-08-27',
          tecnicoTitularId: 'usr_tec_001',
          tecnicoTitular: 'Juan Córdova',
          estado: 'Programada'
        }
      ]
    };

    const syncRes = await request.post('/api/sync', {
      data: syncPayload,
      headers: authHeaders
    });
    expect(syncRes.ok()).toBeTruthy();
    const result = await syncRes.json();
    expect(result.success).toBeTruthy();
  });

});
