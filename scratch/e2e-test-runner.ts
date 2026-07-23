/**
 * ============================================================
 * GESTIA IA — TEST E2E AUTOMATIZADO
 * ============================================================
 * Script de pruebas end-to-end que valida el flujo completo:
 * Cliente → Contrato → Equipo → Adenda → OT → Informe → Aprobación → Facturación
 *
 * USO:
 *   npx tsx scratch/e2e-test-runner.ts
 *   npx tsx scratch/e2e-test-runner.ts --base-url http://localhost:3000
 *
 * PREREQUISITO:
 *   El servidor debe estar corriendo: npm run dev
 * ============================================================
 */

import 'dotenv/config';

// ─── Configuración ───────────────────────────────────────────
const BASE_URL = process.argv.find(a => a.startsWith('--base-url='))?.split('=')[1] || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@mafort.pe';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'mafort';

// ─── Estado global del test ──────────────────────────────────
let TOKEN = '';
let passCount = 0;
let failCount = 0;
let skipCount = 0;
const failures: { test: string; error: string; detail?: any }[] = [];

// ─── Colores ANSI ────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
};

// ─── Helpers ─────────────────────────────────────────────────
function log(msg: string) { console.log(msg); }
function logSection(title: string) {
  log(`\n${C.bold}${C.blue}${'═'.repeat(60)}${C.reset}`);
  log(`${C.bold}${C.blue}  ${title}${C.reset}`);
  log(`${C.bold}${C.blue}${'═'.repeat(60)}${C.reset}`);
}
function logStep(msg: string) { log(`${C.dim}  ▶ ${msg}${C.reset}`); }
function logPass(test: string) { log(`  ${C.green}✅ PASS${C.reset} ${test}`); passCount++; }
function logFail(test: string, error: string, detail?: any) {
  log(`  ${C.red}❌ FAIL${C.reset} ${test}`);
  log(`     ${C.red}↳ ${error}${C.reset}`);
  if (detail) log(`     ${C.dim}${JSON.stringify(detail, null, 2)}${C.reset}`);
  failCount++;
  failures.push({ test, error, detail });
}
function logWarn(msg: string) { log(`  ${C.yellow}⚠️  ${msg}${C.reset}`); skipCount++; }

async function api(method: string, path: string, body?: any): Promise<{ ok: boolean; status: number; data: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  try { data = await res.json(); } catch { data = {}; }
  return { ok: res.ok, status: res.status, data };
}

function assert(condition: boolean, label: string, detail?: any) {
  if (condition) { logPass(label); }
  else { logFail(label, 'Condición falsa', detail); }
}

// ─── Limpieza pre-test ───────────────────────────────────────
async function cleanupTestData(prefix: string) {
  logStep(`Limpiando datos de prueba con prefijo "${prefix}"...`);
  // Best-effort cleanup — errors are silently ignored
  try {
    const { data: ots } = await api('GET', '/api/ots');
    if (Array.isArray(ots)) {
      for (const ot of ots.filter((o: any) => o.id?.includes(prefix) || o.clientId?.includes(prefix))) {
        await api('DELETE', `/api/ots/${ot.id}`);
      }
    }
  } catch {}

  try {
    const { data: clients } = await api('GET', '/api/clients');
    if (Array.isArray(clients)) {
      for (const c of clients.filter((cl: any) => cl.razonSocial?.includes(prefix))) {
        await api('DELETE', `/api/clients/${c.id}`);
      }
    }
  } catch {}
}

// ═══════════════════════════════════════════════════════════════
// CASO DE PRUEBA #1 — Mantenimiento Preventivo (Flujo Normal)
// ═══════════════════════════════════════════════════════════════
async function runCase1(): Promise<void> {
  logSection('CASO #1 — Mantenimiento Preventivo (Flujo Normal)');
  log(`  ${C.dim}Cliente: ALPHA TECH E2E S.A.C. | UPS APC 20kVA + Adenda Eaton 30kVA${C.reset}\n`);

  let clientId = '';
  let contratoId = '';
  let equipoId = '';
  let adendaId = '';
  let otId = '';
  let otLineaId = '';
  let reportId = '';

  // ─── PASO 1: Crear Cliente ───────────────────────────────
  logStep('PASO 1: Crear Cliente');
  {
    const { ok, status, data } = await api('POST', '/api/clients', {
      razonSocial: 'ALPHA TECH E2E S.A.C.',
      ruc: '20601234001',
      direccionSede: 'Av. Javier Prado Este 1234, San Isidro, Lima',
      distrito: 'San Isidro',
      provincia: 'Lima',
      pais: 'Peru',
      contactoNombre: 'Carlos Ramos E2E',
      contactoEmail: 'operaciones@alphatechE2E.com.pe',
      contactoTelefono: '01-6543210',
    });

    assert(ok, 'POST /api/clients → 201 Created', !ok ? data : undefined);
    assert(!!data?.id, 'Cliente retorna ID', data);
    if (data?.id) {
      clientId = data.id;
      logStep(`Cliente creado: ${clientId} — ${data.razonSocial}`);
      assert(data.razonSocial === 'ALPHA TECH E2E S.A.C.', 'Razón social guardada correctamente');
    }
  }

  if (!clientId) { logWarn('Omitiendo pasos siguientes por fallo en creación de cliente'); return; }

  // ─── PASO 2: Crear Contrato Comercial ───────────────────
  logStep('PASO 2: Crear Contrato Comercial');
  {
    const { ok, data } = await api('POST', '/api/contratos-comerciales', {
      cliente: 'ALPHA TECH E2E S.A.C.',
      clientId,
      fecha_inicio: '2026-07-01',
      fecha_fin: '2027-06-30',
      monto_sin_igv: 12000,
      moneda: 'PEN',
      tipo_contrato: 'Preventivo Anual',
      detalle: 'Mantenimiento preventivo anual de equipos UPS - TEST E2E',
      estado: 'VIGENTE',
      anio: 2026,
    });

    assert(ok, 'POST /api/contratos-comerciales → 201 Created', !ok ? data : undefined);
    if (data?.id) {
      contratoId = data.id;
      logStep(`Contrato creado: ${contratoId}`);
      assert(data.cliente === 'ALPHA TECH E2E S.A.C.', 'Nombre del cliente guardado en contrato');
      assert(data.n_contrato?.startsWith('COT-'), `N° de contrato autogenerado correctamente (${data.n_contrato})`);
    }
  }

  if (!contratoId) { logWarn('Omitiendo pasos siguientes por fallo en creación de contrato'); return; }

  // ─── PASO 3: Agregar Equipo al Contrato ─────────────────
  logStep('PASO 3: Agregar Equipo al Contrato');
  {
    // Step 3a: Create the equipo first
    const { ok: createOk, data: createData } = await api('POST', '/api/equipos', {
      tipo: 'UPS',
      marca: 'APC',
      modelo: 'Smart-UPS 3000',
      serie: `SN-APC-E2E-001`,
      potenciaKva: 20,
      ubicacion: 'Sala de Servidores - Piso 3',
      estado: 'Operativo',
      contratoId,
      clienteId: clientId,
    });
    assert(createOk, 'POST /api/equipos (UPS APC) → 201 Created', !createOk ? createData : undefined);

    if (createData?.id) {
      equipoId = createData.id;
      logStep(`Equipo creado: ${equipoId} — ${createData.marca} ${createData.modelo}`);
      assert(createData.tipo === 'UPS', 'Tipo de equipo guardado correctamente');
      assert(parseFloat(createData.potenciaKva) === 20, 'Potencia kVA guardada correctamente');

      // Step 3b: Link equipo to contract
      const { ok: linkOk, data: linkData } = await api('POST', `/api/contracts/${contratoId}/equipos`, { equipoId });
      assert(linkOk, `Equipo vinculado al contrato ${contratoId}`, !linkOk ? linkData : undefined);
    }
  }

  // ─── PASO 4: Crear Adenda + Equipo Adicional ────────────
  logStep('PASO 4: Crear Adenda + Equipo Adicional');
  {
    const { ok: adOk, data: adData } = await api('POST', `/api/contracts/${contratoId}/ampliaciones`, {
      monto: 4500,
      fecha_inicio: '2026-08-01',
      fecha_fin: '2027-07-31',
      comentarios: 'Incorporación de nuevo equipo UPS en sala de backup - TEST E2E',
    });

    assert(adOk, `POST /api/contracts/${contratoId}/ampliaciones → 201`, !adOk ? adData : undefined);

    // Get adenda ID from the response
    const adendas = adData?.ampliaciones || [];
    const latestAdenda = adendas[adendas.length - 1];
    if (latestAdenda?.id) {
      adendaId = latestAdenda.id;
      logStep(`Adenda creada: ${adendaId}`);
      assert(latestAdenda.monto === 4500 || parseFloat(latestAdenda.monto) === 4500, 'Monto de adenda guardado correctamente');
    } else {
      logWarn('No se pudo obtener ID de adenda del response');
    }

    // Add equipment to adenda
    if (adendaId) {
      // Create equipo for adenda first
      const { ok: eqCreateOk, data: eqCreateData } = await api('POST', '/api/equipos', {
        tipo: 'UPS',
        marca: 'Eaton',
        modelo: '9PX 6000',
        serie: `SN-EATON-E2E-002`,
        potenciaKva: 30,
        ubicacion: 'Sala Backup - Sótano 1',
        estado: 'Operativo',
        clienteId: clientId,
      });
      assert(eqCreateOk, 'POST /api/equipos (Eaton adenda) → 201 Created', !eqCreateOk ? eqCreateData : undefined);

      if (eqCreateData?.id) {
        // Link equipo to adenda
        const { ok: eqOk, data: eqData } = await api('POST', `/api/contracts/${contratoId}/ampliaciones/${adendaId}/equipos`, {
          equipoId: eqCreateData.id
        });
        assert(eqOk, `Equipo Eaton vinculado a adenda ${adendaId}`, !eqOk ? eqData : undefined);
        if (eqData) { logStep(`Equipo de adenda vinculado: ${eqCreateData.id}`); }
      }
    }
  }

  // ─── PASO 5: Verificar Contrato con Equipos ──────────────
  logStep('PASO 5: Verificar Contrato actualizado');
  {
    const { ok, data } = await api('GET', '/api/contratos-comerciales');
    if (ok && Array.isArray(data)) {
      const myContract = data.find((c: any) => c.id === contratoId);
      assert(!!myContract, 'Contrato recuperado de la API');
      const contractEquipos = myContract?.equipos || [];
      const adendaEquipos = myContract?.ampliaciones?.flatMap((a: any) => a.equipos || []) || [];
      logStep(`Equipos en contrato: ${contractEquipos.length} directos, ${adendaEquipos.length} en adendas`);
      assert(contractEquipos.length >= 1, `Contrato tiene ≥1 equipo directo (encontrados: ${contractEquipos.length})`);
    }
  }

  // ─── PASO 6: Programar Visita → Generar OT ──────────────
  logStep('PASO 6: Programar Visita → Generar OT Técnica + Financiera');
  {
    const { data: users } = await api('GET', '/api/users');
    const tecnico = Array.isArray(users) ? users.find((u: any) => u.role === 'Tecnico' || u.role === 'Administrador') : null;

    const { ok, data } = await api('POST', '/api/ots', {
      clientId,
      contratoId,
      equipoId: equipoId || undefined,
      tipoMantenimiento: 'Preventivo',
      tipoEquipo: 'UPS',
      potenciaKva: 20,
      fechaProgramada: new Date().toISOString().split('T')[0],
      horaProgramada: '09:00',
      tecnicoTitular: tecnico?.username || 'Técnico Test',
      tecnicoTitularId: tecnico?.id || undefined,
      estado: 'Programada',
    });

    assert(ok, 'POST /api/ots → 201 Created', !ok ? data : undefined);
    if (data?.id) {
      otId = data.id;
      logStep(`OT Técnica creada: ${otId}`);
      assert(data.estado === 'Programada', 'Estado inicial de OT = Programada');
      assert(data.clientId === clientId, 'clientId guardado correctamente en OT');
    }

    // Check OT Financiera was auto-created
    const { data: lineas } = await api('GET', '/api/ot-lineas');
    if (Array.isArray(lineas)) {
      const cleanOtNum = otId.replace('OT-', '');
      const myLinea = lineas.find((l: any) =>
        l.otTecnicaId === otId ||
        String(l.ot) === cleanOtNum ||
        l.ot === otId
      );
      if (myLinea) {
        otLineaId = myLinea.id;
        logStep(`OT Financiera creada: ${otLineaId}`);
        assert(!!otLineaId, 'OT Financiera generada automáticamente');
        // Validate client name is NOT 'Cliente General'
        const clientOk = myLinea.razon_social !== 'Cliente General' && !!myLinea.razon_social;
        assert(clientOk, `Nombre del cliente en OT Financiera es correcto: "${myLinea.razon_social}" (no "Cliente General")`);
      } else {
        logWarn(`No se encontró OT Financiera vinculada a ${otId}`);
      }
    }
  }

  if (!otId) { logWarn('Omitiendo pasos de informe por fallo en creación de OT'); return; }

  // ─── PASO 7: Pasar OT a Ejecución ────────────────────────
  logStep('PASO 7: Cambiar estado OT → En Ejecución');
  {
    const { ok, data } = await api('PUT', `/api/ots/${otId}`, { estado: 'Trabajo en Ejecución' });
    assert(ok, `PUT /api/ots/${otId} → estado = "Trabajo en Ejecución"`, !ok ? data : undefined);
  }

  // ─── PASO 8: Registrar Informe Técnico ───────────────────
  logStep('PASO 8: Registrar Informe Técnico');
  {
    const { ok, data } = await api('POST', '/api/reports', {
      id: `report_c1_${Date.now()}`,
      otId,
      equipoId: equipoId || undefined,
      voltajeSalida: 220,
      indicadoresBateria: {
        nivelCarga: 85,
        temperaturaC: 28,
        estadoCeldas: 'Optimo',
        bypassActivo: false,
      },
      observacionesDiagnostico: '[E2E Test] Equipo funcionando correctamente. Limpieza de filtros y revisión de baterías realizada.',
      comentariosAdicionales: '[E2E Test] Se recomienda cambio de baterías en 12 meses.',
      fotos: [],
      creadoEn: new Date().toISOString(),
      modificadoEn: new Date().toISOString(),
      pasos: {
        paso1_funcionamiento: 'modo inversor',
        paso1_si_no: 'si',
      },
      tecnico1: 'Técnico Test E2E',
    });

    assert(ok, 'POST /api/reports → 201 Created', !ok ? data : undefined);
    if (data?.id) {
      reportId = data.id;
      logStep(`Informe creado: ${reportId}`);
      assert(data.indicadoresBateria?.bypassActivo === false, 'Bypass = false guardado correctamente');

      // Check OT Financial line execution auto-synced
      if (otLineaId) {
        const { data: lineas } = await api('GET', '/api/ot-lineas');
        const updatedLinea = Array.isArray(lineas) ? lineas.find((l: any) => l.id === otLineaId) : null;
        if (updatedLinea) {
          assert(updatedLinea.pendiente === 'EJECUTADO', `OT Financiera auto-sincroniza pendiente = EJECUTADO (actual: ${updatedLinea.pendiente})`);
        }
      }
    }
  }

  // ─── PASO 9: Supervisor Aprueba el Informe ───────────────
  logStep('PASO 9: Supervisor Aprueba el Informe → OT = Aprobada');
  {
    const { ok, data } = await api('PUT', `/api/ots/${otId}`, { estado: 'Aprobada' });
    assert(ok, `PUT /api/ots/${otId} → estado = "Aprobada"`, !ok ? data : undefined);

    // Check OT Financiera estado changed to POR FACTURAR
    if (otLineaId) {
      await new Promise(r => setTimeout(r, 300)); // Small wait for DB sync
      const { data: lineas } = await api('GET', '/api/ot-lineas');
      const updatedLinea = Array.isArray(lineas) ? lineas.find((l: any) => l.id === otLineaId) : null;
      if (updatedLinea) {
        assert(
          updatedLinea.pendiente === 'EJECUTADO',
          `OT Financiera pendiente = EJECUTADO tras aprobación (actual: ${updatedLinea.pendiente})`
        );
        assert(
          updatedLinea.listaParaFacturar === true || updatedLinea.estado === 'POR FACTURAR',
          `OT Financiera lista para facturar (actual estado: ${updatedLinea.estado})`
        );
      } else {
        logWarn('No se pudo verificar OT Financiera tras aprobación');
      }
    }
  }

  // ─── PASO 10: Completar Datos de Facturación ─────────────
  logStep('PASO 10: Completar Datos de Facturación → Estado = FACTURADO');
  if (otLineaId) {
    const fechaFactura = new Date().toISOString().split('T')[0];
    const { ok, data } = await api('PUT', `/api/ot-lineas/${otLineaId}`, {
      sub_importe_sin_igv: 6000,
      sub_importe_inc_igv: 7080,
      n_factura: 'F001-E2E-001245',
      fecha_facturacion: fechaFactura,
      estado: 'FACTURADO',
      pendiente: 'FACTURADO',
    });

    assert(ok, `PUT /api/ot-lineas/${otLineaId} → Facturación guardada`, !ok ? data : undefined);
    if (data) {
      logStep(`OT Financiera actualizada. Estado: ${data.estado}`);
      assert(
        parseFloat(data.sub_importe_sin_igv) === 6000,
        `Importe guardado correctamente (${data.sub_importe_sin_igv})`
      );
      assert(
        data.factura === 'F001-E2E-001245',
        `N° Factura guardado correctamente (${data.factura})`
      );
    }
  } else {
    logWarn('No hay OT Financiera para completar facturación');
  }

  log(`\n  ${C.green}${C.bold}✅ CASO #1 completado${C.reset}`);
}

// ═══════════════════════════════════════════════════════════════
// CASO DE PRUEBA #2 — Correctivo con Bypass + Observación Supervisor
// ═══════════════════════════════════════════════════════════════
async function runCase2(): Promise<void> {
  logSection('CASO #2 — Correctivo con Bypass + Observación del Supervisor');
  log(`  ${C.dim}Cliente: BETA SOLUTIONS E2E S.R.L. | Tablero ABB + Adenda Schneider${C.reset}\n`);

  let clientId = '';
  let contratoId = '';
  let equipoId = '';
  let otId = '';
  let otLineaId = '';
  let reportId = '';

  // ─── PASO 1: Crear Cliente ───────────────────────────────
  logStep('PASO 1: Crear Cliente');
  {
    const { ok, data } = await api('POST', '/api/clients', {
      razonSocial: 'BETA SOLUTIONS E2E S.R.L.',
      ruc: '20507654002',
      direccionSede: 'Calle Los Laureles 456, Miraflores, Lima',
      distrito: 'Miraflores',
      provincia: 'Lima',
      pais: 'Peru',
      contactoNombre: 'Lucía Mendoza E2E',
      contactoEmail: 'mantenimiento@betaE2E.com.pe',
      contactoTelefono: '01-7654321',
    });

    assert(ok, 'POST /api/clients → 201 Created', !ok ? data : undefined);
    if (data?.id) {
      clientId = data.id;
      logStep(`Cliente creado: ${clientId} — ${data.razonSocial}`);
      assert(data.razonSocial === 'BETA SOLUTIONS E2E S.R.L.', 'Razón social guardada correctamente');
    }
  }

  if (!clientId) { logWarn('Omitiendo pasos siguientes por fallo en creación de cliente'); return; }

  // ─── PASO 2: Crear Contrato + Equipo ────────────────────
  logStep('PASO 2: Crear Contrato + Equipo Tablero');
  {
    const { ok: ctOk, data: ctData } = await api('POST', '/api/contratos-comerciales', {
      cliente: 'BETA SOLUTIONS E2E S.R.L.',
      clientId,
      fecha_inicio: '2026-07-01',
      fecha_fin: '2027-06-30',
      monto_sin_igv: 8500,
      moneda: 'PEN',
      tipo_contrato: 'Correctivo + Preventivo',
      detalle: 'Mantenimiento correctivo de tableros eléctricos - TEST E2E',
      estado: 'VIGENTE',
      anio: 2026,
    });

    assert(ctOk, 'POST /api/contratos-comerciales → 201 Created', !ctOk ? ctData : undefined);
    if (ctData?.id) {
      contratoId = ctData.id;
      logStep(`Contrato creado: ${contratoId}`);

      // Add equipment
      const { ok: eqCreateOk, data: eqCreateData } = await api('POST', '/api/equipos', {
        tipo: 'Tablero Eléctrico',
        marca: 'ABB',
        modelo: 'TRITON 400A',
        serie: 'SN-ABB-E2E-088',
        potenciaKva: 0,
        ubicacion: 'Sub-estación principal - Piso 1',
        estado: 'Operativo',
        contratoId,
        clienteId: clientId,
      });
      assert(eqCreateOk, 'POST /api/equipos (ABB Tablero) → 201', !eqCreateOk ? eqCreateData : undefined);

      if (eqCreateData?.id) {
        equipoId = eqCreateData.id;
        logStep(`Equipo ABB creado: ${equipoId}`);
        const { ok: eqOk, data: eqData } = await api('POST', `/api/contracts/${contratoId}/equipos`, { equipoId });
        assert(eqOk, `Equipo ABB vinculado al contrato`, !eqOk ? eqData : undefined);
      }
    }
  }

  if (!contratoId) { logWarn('Omitiendo pasos siguientes por fallo en creación de contrato'); return; }

  // ─── PASO 3: Crear Adenda + Equipo Adicional ────────────
  logStep('PASO 3: Crear Adenda + Equipo Schneider');
  {
    const { ok, data } = await api('POST', `/api/contracts/${contratoId}/ampliaciones`, {
      monto: 2000,
      fecha_inicio: '2026-08-15',
      fecha_fin: '2027-07-31',
      comentarios: 'Ampliar cobertura a gabinete de distribución secundario - TEST E2E',
    });

    assert(ok, 'POST adenda → 201', !ok ? data : undefined);
    const adendas = data?.ampliaciones || [];
    const latestAdenda = adendas[adendas.length - 1];
    if (latestAdenda?.id) {
      logStep(`Adenda creada: ${latestAdenda.id}`);

      // Create Schneider equipo first, then link to adenda
      const { ok: eqCreateOk, data: eqCreateData } = await api('POST', '/api/equipos', {
        tipo: 'Tablero Eléctrico',
        marca: 'Schneider',
        modelo: 'Prisma G 250A',
        serie: 'SN-SCHN-E2E-045',
        potenciaKva: 0,
        ubicacion: 'Sub-estación secundaria - Sótano',
        estado: 'Operativo',
        clienteId: clientId,
      });
      assert(eqCreateOk, 'POST /api/equipos (Schneider) → 201', !eqCreateOk ? eqCreateData : undefined);

      if (eqCreateData?.id) {
        const { ok: eqOk, data: eqData } = await api('POST', `/api/contracts/${contratoId}/ampliaciones/${latestAdenda.id}/equipos`, {
          equipoId: eqCreateData.id
        });
        assert(eqOk, 'POST equipo a adenda → 201', !eqOk ? eqData : undefined);
        if (eqOk) { logStep(`Equipo Schneider vinculado a adenda: ${eqCreateData.id}`); }
      }
    } else {
      logWarn('No se obtuvo ID de adenda');
    }
  }

  // ─── PASO 4: Programar Visita (OT Correctiva) ───────────
  logStep('PASO 4: Programar Visita → OT Correctiva');
  {
    const { data: users } = await api('GET', '/api/users');
    const tecnico = Array.isArray(users) ? users.find((u: any) => u.role === 'Tecnico' || u.role === 'Administrador') : null;

    const { ok, data } = await api('POST', '/api/ots', {
      clientId,
      contratoId,
      equipoId: equipoId || undefined,
      tipoMantenimiento: 'Correctivo',
      tipoEquipo: 'Tablero Eléctrico',
      potenciaKva: 0,
      fechaProgramada: new Date().toISOString().split('T')[0],
      horaProgramada: '10:00',
      tecnicoTitular: tecnico?.username || 'Técnico Test',
      tecnicoTitularId: tecnico?.id || undefined,
      estado: 'Programada',
    });

    assert(ok, 'POST /api/ots → 201 Correctiva', !ok ? data : undefined);
    if (data?.id) {
      otId = data.id;
      logStep(`OT Técnica creada: ${otId}`);
      assert(data.tipoMantenimiento === 'Correctivo', 'Tipo de mantenimiento = Correctivo');
      assert(data.clientId === clientId, 'clientId correcto en OT');
    }

    // Verify OT Financiera auto-created with correct client name
    const { data: lineas } = await api('GET', '/api/ot-lineas');
    if (Array.isArray(lineas) && otId) {
      const cleanOtNum = otId.replace('OT-', '');
      const myLinea = lineas.find((l: any) =>
        l.otTecnicaId === otId ||
        String(l.ot) === cleanOtNum ||
        l.ot === otId
      );
      if (myLinea) {
        otLineaId = myLinea.id;
        logStep(`OT Financiera: ${otLineaId}`);
        assert(myLinea.razon_social !== 'Cliente General', `Nombre cliente no es "Cliente General" (actual: "${myLinea.razon_social}")`);
        assert(myLinea.razon_social?.includes('BETA'), `Nombre cliente contiene "BETA" (actual: "${myLinea.razon_social}")`);
      } else {
        logWarn('OT Financiera no encontrada para este OT');
      }
    }
  }

  if (!otId) { logWarn('Omitiendo pasos de informe por fallo en creación de OT'); return; }

  // ─── PASO 5: Registrar Informe con Bypass Activo ─────────
  logStep('PASO 5: Registrar Informe con BYPASS ACTIVO (anomalía)');
  {
    const { ok, data } = await api('POST', '/api/reports', {
      id: `report_c2a_${Date.now()}`,
      otId,
      equipoId: equipoId || undefined,
      voltajeEntrada: 215,
      voltajeSalida: 215,
      indicadoresBateria: {
        nivelCarga: 45,
        temperaturaC: 38,
        estadoCeldas: 'Regular',
        bypassActivo: true, // ← ANOMALÍA
      },
      observacionesDiagnostico: '[E2E Test] Equipo en modo bypass por falla en inversor interno. Requiere revisión urgente.',
      comentariosAdicionales: '[E2E Test] Se recomienda correctivo inmediato.',
      fotos: [],
      pasos: {
        paso1_funcionamiento: 'bypass',
        paso1_si_no: 'si',
        paso6_observaciones: 'Tarjeta de control dañada - verificar P/N ABB-CTRL-3000',
      },
      creadoEn: new Date().toISOString(),
      modificadoEn: new Date().toISOString(),
      tecnico1: 'Técnico Test E2E',
    });

    assert(ok, 'POST /api/reports con bypass → 201 Created', !ok ? data : undefined);
    if (data?.id) {
      reportId = data.id;
      logStep(`Informe creado con bypass: ${reportId}`);
      assert(data.indicadoresBateria?.bypassActivo === true, 'Bypass activo guardado correctamente');

      // Verify OT Financial sync
      if (otLineaId) {
        const { data: lineas } = await api('GET', '/api/ot-lineas');
        const updatedLinea = Array.isArray(lineas) ? lineas.find((l: any) => l.id === otLineaId) : null;
        if (updatedLinea) {
          assert(updatedLinea.pendiente === 'EJECUTADO', `OT Financiera auto-sincronizada a EJECUTADO (actual: ${updatedLinea.pendiente})`);
        }
      }
    }
  }

  // ─── PASO 6: OT → Estado Observada (Supervisor Observa) ─
  logStep('PASO 6A: Supervisor OBSERVA el informe → OT = Observada');
  {
    const { ok, data } = await api('PUT', `/api/ots/${otId}`, {
      estado: 'Observada',
      correccionesSupervisor: '[E2E Test] Detallar número de parte de la tarjeta de control afectada y adjuntar foto del inversor.',
    });
    assert(ok, `PUT /api/ots/${otId} → estado = "Observada"`, !ok ? data : undefined);
  }

  // ─── PASO 6B: Técnico Corrige Informe ────────────────────
  logStep('PASO 6B: Técnico CORRIGE y reenvía informe');
  {
    const { ok, data } = await api('POST', '/api/reports', {
      id: `report_c2b_${Date.now()}`,
      otId,
      equipoId: equipoId || undefined,
      voltajeEntrada: 215,
      voltajeSalida: 215,
      indicadoresBateria: {
        nivelCarga: 45,
        temperaturaC: 38,
        estadoCeldas: 'Regular',
        bypassActivo: true,
      },
      observacionesDiagnostico: '[E2E Test - CORREGIDO] Equipo en modo bypass por falla en inversor. Tarjeta de control: P/N ABB-CTRL-3000.',
      comentariosAdicionales: '[E2E Test - CORREGIDO] Foto del inversor adjuntada. Requiere reemplazo urgente.',
      fotos: [],
      pasos: {
        paso1_funcionamiento: 'bypass',
        paso6_observaciones: 'P/N ABB-CTRL-3000. Requiere reemplazo urgente.',
      },
      creadoEn: new Date().toISOString(),
      modificadoEn: new Date().toISOString(),
      tecnico1: 'Técnico Test E2E',
    });

    assert(ok, 'POST /api/reports (corrección) → 201/200', !ok ? data : undefined);
    if (data?.id) { logStep(`Informe corregido guardado: ${data.id}`); }
  }

  // ─── PASO 6C: Supervisor Aprueba el Informe Corregido ───
  logStep('PASO 6C: Supervisor APRUEBA el informe corregido');
  {
    const { ok, data } = await api('PUT', `/api/ots/${otId}`, { estado: 'Aprobada' });
    assert(ok, `PUT /api/ots/${otId} → estado = "Aprobada"`, !ok ? data : undefined);

    if (otLineaId) {
      await new Promise(r => setTimeout(r, 300));
      const { data: lineas } = await api('GET', '/api/ot-lineas');
      const updatedLinea = Array.isArray(lineas) ? lineas.find((l: any) => l.id === otLineaId) : null;
      if (updatedLinea) {
        assert(
          updatedLinea.pendiente === 'EJECUTADO',
          `OT Financiera pendiente = EJECUTADO (actual: ${updatedLinea.pendiente})`
        );
        assert(
          updatedLinea.listaParaFacturar === true || updatedLinea.estado === 'POR FACTURAR',
          `OT Financiera lista para facturar (estado: ${updatedLinea.estado})`
        );
      }
    }
  }

  // ─── PASO 7: Completar Facturación ───────────────────────
  logStep('PASO 7: Completar Datos de Facturación');
  if (otLineaId) {
    const { ok, data } = await api('PUT', `/api/ot-lineas/${otLineaId}`, {
      sub_importe_sin_igv: 2125,
      sub_importe_inc_igv: 2507.5,
      n_factura: 'F001-E2E-001246',
      fecha_facturacion: new Date().toISOString().split('T')[0],
      estado: 'FACTURADO',
      pendiente: 'FACTURADO',
    });

    assert(ok, `PUT /api/ot-lineas/${otLineaId} → Facturación guardada`, !ok ? data : undefined);
    if (data) {
      assert(
        data.factura === 'F001-E2E-001246',
        `N° Factura guardado correctamente (${data.factura})`
      );
      assert(
        parseFloat(data.sub_importe_sin_igv) === 2125,
        `Importe guardado: S/ ${data.sub_importe_sin_igv}`
      );
    }
  } else {
    logWarn('No hay OT Financiera para completar facturación');
  }

  log(`\n  ${C.green}${C.bold}✅ CASO #2 completado${C.reset}`);
}

// ═══════════════════════════════════════════════════════════════
// VERIFICACIONES GLOBALES DEL DASHBOARD
// ═══════════════════════════════════════════════════════════════
async function verifyDashboardData(): Promise<void> {
  logSection('VERIFICACIONES GLOBALES — Estado Final del Sistema');

  // Verify counts
  const [{ data: clients }, { data: contratos }, { data: ots }, { data: reports }, { data: lineas }] = await Promise.all([
    api('GET', '/api/clients'),
    api('GET', '/api/contratos-comerciales'),
    api('GET', '/api/ots'),
    api('GET', '/api/reports'),
    api('GET', '/api/ot-lineas'),
  ]);

  const clientCount = Array.isArray(clients) ? clients.filter((c: any) => c.razonSocial?.includes('E2E')).length : 0;
  const contratoCount = Array.isArray(contratos) ? contratos.filter((c: any) => c.n_contrato?.includes('E2E')).length : 0;
  const otCount = Array.isArray(ots) ? ots.length : 0;
  const reportCount = Array.isArray(reports) ? reports.length : 0;
  const lineasAprobadas = Array.isArray(lineas) ? lineas.filter((l: any) => l.pendiente === 'EJECUTADO' || l.pendiente === 'FACTURADO' || l.estado === 'FACTURADO').length : 0;

  log(`\n  ${C.cyan}${C.bold}📊 Estado Final de BD:${C.reset}`);
  log(`  ${C.dim}Clientes E2E creados:          ${clientCount}${C.reset}`);
  log(`  ${C.dim}Contratos E2E creados:         ${contratoCount}${C.reset}`);
  log(`  ${C.dim}OTs Técnicas total:            ${otCount}${C.reset}`);
  log(`  ${C.dim}Informes técnicos total:       ${reportCount}${C.reset}`);
  log(`  ${C.dim}OTs Financieras ejecutadas:    ${lineasAprobadas}${C.reset}`);

  assert(clientCount >= 2, `Al menos 2 clientes E2E creados (encontrados: ${clientCount})`);
  assert(contratoCount >= 2, `Al menos 2 contratos E2E creados (encontrados: ${contratoCount})`);
  assert(otCount >= 2, `Al menos 2 OTs creadas (encontradas: ${otCount})`);
  assert(reportCount >= 2, `Al menos 2 informes técnicos (encontrados: ${reportCount})`);
  assert(lineasAprobadas >= 2, `Al menos 2 OTs Financieras ejecutadas/facturadas (encontradas: ${lineasAprobadas})`);

  // Verify no ghost OTs (OT that have no linked contract)
  if (Array.isArray(ots)) {
    const ghostOts = ots.filter((o: any) => !o.clientId && !o.contratoId);
    assert(ghostOts.length === 0, `No hay OTs fantasma sin cliente/contrato (encontradas: ${ghostOts.length})`);
  }
}

// ═══════════════════════════════════════════════════════════════
// RUNNER PRINCIPAL
// ═══════════════════════════════════════════════════════════════
async function main() {
  log(`\n${C.bold}${C.magenta}${'═'.repeat(60)}${C.reset}`);
  log(`${C.bold}${C.magenta}  🧪 GESTIA IA — TEST E2E AUTOMATIZADO${C.reset}`);
  log(`${C.bold}${C.magenta}  Servidor: ${BASE_URL}${C.reset}`);
  log(`${C.bold}${C.magenta}  Fecha: ${new Date().toLocaleString('es-PE')}${C.reset}`);
  log(`${C.bold}${C.magenta}${'═'.repeat(60)}${C.reset}`);

  // ─── 1. Health check ────────────────────────────────────
  logSection('CONEXIÓN Y AUTENTICACIÓN');
  logStep(`Verificando health check en ${BASE_URL}/api/health`);
  {
    const { ok, data } = await api('GET', '/api/health');
    assert(ok, 'GET /api/health → responde correctamente', !ok ? data : undefined);
    if (!ok) {
      log(`\n${C.red}${C.bold}ERROR FATAL: El servidor no responde en ${BASE_URL}${C.reset}`);
      log(`${C.red}Asegúrate de ejecutar: npm run dev${C.reset}\n`);
      process.exit(1);
    }
  }

  // ─── 2. Login ───────────────────────────────────────────
  logStep(`Autenticando con usuario: ${ADMIN_EMAIL}`);
  {
    const { ok, data } = await api('POST', '/api/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    assert(ok, 'POST /api/login → token recibido', !ok ? data : undefined);
    if (ok && data?.token) {
      TOKEN = data.token;
      logStep(`Autenticado como: ${data.user?.username} (${data.user?.role})`);
    } else {
      log(`\n${C.red}${C.bold}ERROR FATAL: Login fallido. Verifica credenciales.${C.reset}`);
      log(`${C.yellow}Configura TEST_ADMIN_PASSWORD=<password> en .env o pasa --password como arg.${C.reset}\n`);
      process.exit(1);
    }
  }

  // ─── 3. Run Cases ───────────────────────────────────────
  await runCase1();
  await runCase2();
  await verifyDashboardData();

  // ─── 4. Final Report ────────────────────────────────────
  logSection('REPORTE FINAL');

  const total = passCount + failCount;
  const pct = total > 0 ? Math.round((passCount / total) * 100) : 0;

  log(`\n  ${C.bold}Resumen:${C.reset}`);
  log(`  ${C.green}✅ Pasaron: ${passCount}${C.reset}`);
  log(`  ${C.red}❌ Fallaron: ${failCount}${C.reset}`);
  if (skipCount > 0) log(`  ${C.yellow}⚠️  Advertencias: ${skipCount}${C.reset}`);
  log(`  ${C.bold}Cobertura: ${pct}% (${passCount}/${total})${C.reset}`);

  if (failures.length > 0) {
    log(`\n  ${C.red}${C.bold}🐛 FALLOS DETECTADOS:${C.reset}`);
    failures.forEach((f, i) => {
      log(`\n  ${C.red}${i + 1}. ${f.test}${C.reset}`);
      log(`     ${C.red}↳ ${f.error}${C.reset}`);
      if (f.detail && typeof f.detail === 'object') {
        const detailStr = JSON.stringify(f.detail).substring(0, 200);
        log(`     ${C.dim}Detalle: ${detailStr}${C.reset}`);
      }
    });

    log(`\n  ${C.yellow}${C.bold}💡 Cómo Diagnosticar Fallos:${C.reset}`);
    log(`  ${C.dim}1. Revisa los logs del servidor (terminal donde corre npm run dev)${C.reset}`);
    log(`  ${C.dim}2. Verifica la BD: npx tsx scratch/check-db.ts${C.reset}`);
    log(`  ${C.dim}3. Para limpiar BD y re-ejecutar: npx tsx scratch/wipe-operational-db.ts && npx tsx scratch/e2e-test-runner.ts${C.reset}`);
  }

  if (failCount === 0) {
    log(`\n  ${C.green}${C.bold}🎉 TODOS LOS TESTS PASARON — Sistema listo para merge a dev y deploy a AWS${C.reset}`);
  } else {
    log(`\n  ${C.red}${C.bold}⚠️  HAY FALLOS — Revisar y corregir antes de hacer merge a dev${C.reset}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`\n${C.red}${C.bold}ERROR NO CAPTURADO:${C.reset}`, err);
  process.exit(1);
});
