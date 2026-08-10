# Guion de Pruebas E2E: Inventario de Equipos + Histórico de Informes

> **Fecha**: 2026-08-10
> **Rama**: `feature/inventario-equipos-historico`
> **Archivo de Prueba**: `tests/inventario-equipos.spec.ts`
> **Backend**: `GET /api/inventario-equipos` (nuevo)

## 1. Contexto

Nuevo módulo **Inventario de Equipos** (plan original `2026-07-25-inventario-equipos.md`,
nunca implementado) ampliado con un eje transaccional: **histórico de informes
técnicos por equipo**.

- **Vista consolidada** (`InventarioEquiposView`): KPIs (Total / Operativos /
  En Obs. y Reparación / Próximas Visitas), buscador por código/serie/marca/modelo,
  filtros por estado/empresa/tipo, tabla con paginación y estado vacío.
- **Drawer** (`InventarioEquipoDrawer`): Ficha Técnica, Empresa y Contrato, Voltaje
  del último informe, Visitas históricas/futuras, **Histórico de Informes Técnicos**
  (N° informe, fecha, tipo servicio, técnico, estado de la OT, voltajes entrada/salida)
  y descarga **PDF directa** de cada informe. Acciones Cambiar Estado y Eliminar con
  `ConfirmModal` + `ToastModal`; rol Técnico en **solo lectura**.
- **Endpoint** `GET /api/inventario-equipos`: resuelve informes por equipo
  (`TechnicalReport.equipoId` directo + fallback legacy vía `OtEquipoAsignacion`) y
  visitas futuras por `ESTADOS_VISITA_FUTURA`.
- Rol Técnico puede navegar al módulo (nuevo caso en `currentRole`).

## 2. Criterios de Aceptación

- [ ] Login como Administrador → sidebar muestra "Inventario de Equipos" → vista consolidada con header, KPIs y tabla.
- [ ] La búsqueda por código filtra la tabla en tiempo real (debounce 300 ms).
- [ ] El drawer muestra el histórico de informes con detalle completo (fecha, tipo, técnico, V entrada/salida) y botón PDF.
- [ ] "Cambiar Estado" exige confirmación y muestra toast de éxito (el drawer no se cierra).
- [ ] Rol Técnico ve el módulo pero sin acciones destructivas (sin "Cambiar Estado" ni "Eliminar").
- [ ] Cero errores de consola en las pantallas cubiertas.

## 3. Pasos E2E (datos de prueba en BD local)

Datos sembrados: cliente `Prosegur Test S.A.`, equipos `UPS-HIST-001` (2 informes:
INF-2026-001 Aprobada / INF-2026-002 En Revisión) y `UPS-HIST-002` (1 informe:
INF-2025-088), OTs OT-HIST-001/002/003.

| # | Módulo | Acción | Criterio |
|---|---|---|---|
| 1 | UI | `login(page, 'Administrador')` + abrir "Inventario de Equipos" | header "Inventario de Equipos" + KPI "Total Equipos" visible |
| 2 | UI | Verificar tabla | filas UPS-HIST-001, UPS-HIST-002 y "Prosegur Test S.A." visibles |
| 3 | UI | Buscar `UPS-HIST-002` | solo esa fila queda (UPS-HIST-001 = 0) |
| 4 | UI | Buscar `UPS-HIST-001` | vuelve a quedar solo UPS-HIST-001 |
| 5 | UI | Abrir drawer de UPS-HIST-001 | título contiene código + "Histórico completo" + "Informes Técnicos (n)" |
| 6 | UI | En el drawer | INF-2026-001 e INF-2026-002 visibles con Fecha/Tipo/Técnico/V. Entrada/V. Salida + botón PDF |
| 7 | UI | Abrir drawer de UPS-HIST-002 → "Cambiar Estado" → confirmar | modal "Cambiar Estado del Equipo" + toast "Estado Actualizado" |
| 8 | UI | Multi-rol | Técnico accede al módulo (rev. lectura): sin botones Cambiar Estado/Eliminar, pero PDF visible |

## 4. Evidencia

- Videos `.webm` en `test-results/` (config `video: 'on'`), uno por test (5 totales).
- Trace + screenshots automáticos de Playwright por cada escenario.