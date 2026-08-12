# Guion de Pruebas E2E: Inventario de Equipos + Histórico de Informes

> **Fecha**: 2026-08-10 (actualizado 2026-08-11: estado derivado + modal Ver)
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
- **Estado del equipo derivado** del último informe técnico (sin cambio manual):
  `deriveEstadoEquipo(estadoOrigen, ultimoInforme)` — sin informe → `estadoOrigen`;
  `Baja`/`En almacén` se respetan; sin diagnóstico → `Operativo`;
  `equipoEnBypass=si`/`apagado`, `recomendaciones` no vacías o
  `estadoOperativo=false` → `En observación`; si no → `Operativo`. El filtro por
  estado y los KPIs se calculan sobre el estado derivado.
- **Drawer** (`InventarioEquipoDrawer`): Ficha Técnica, Empresa y Contrato, Voltaje
  del último informe, Visitas históricas/futuras, **Histórico de Informes Técnicos**
  (N° informe, fecha, tipo servicio, técnico, estado de la OT, voltajes entrada/salida).
  Panel "Estado según último informe" con la regla de derivación y la referencia del
  informe. Cada informe tiene botones **Ver** (modal con el informe en formato
  documento vía `DocumentFormat`) y **PDF** (descarga directa). Rol Técnico en
  **solo lectura**. Se eliminó la acción manual "Cambiar Estado".
- **Endpoint** `GET /api/inventario-equipos`: resuelve informes por equipo
  (`TechnicalReport.equipoId` directo + fallback legacy vía `OtEquipoAsignacion`) y
  visitas futuras por `ESTADOS_VISITA_FUTURA`; incluye campos de diagnóstico en el
  DTO de informes y `estadoOrigen`/empresa en el equipo.
- Rol Técnico puede navegar al módulo (nuevo caso en `currentRole`).

## 2. Criterios de Aceptación

- [ ] Login como Administrador → sidebar muestra "Inventario de Equipos" → vista consolidada con header, KPIs y tabla.
- [ ] La búsqueda por código filtra la tabla en tiempo real (debounce 300 ms).
- [ ] El drawer muestra el histórico de informes con detalle completo (fecha, tipo, técnico, V entrada/salida) y botones Ver + PDF.
- [ ] El estado del equipo se deriva del último informe técnico y no se puede cambiar manualmente.
- [ ] El botón Ver abre el modal con el informe en formato documento y permite descargar el PDF.
- [ ] Rol Técnico ve el módulo pero sin acciones destructivas (sin "Cambiar Estado" ni "Eliminar").
- [ ] Cero errores de consola del sistema en las pantallas cubiertas (ruido conocido de navegador filtrado: favicon / resource 404).

## 3. Pasos E2E (datos de prueba en BD local)

Datos sembrados: cliente `Prosegur Test S.A.`, equipos `UPS-HIST-001` (2 informes:
INF-2026-001 Aprobada / INF-2026-002 En Revisión) y `UPS-HIST-002` (1 informe:
INF-2025-088), OTs OT-HIST-001/002/003. INF-2025-088 tiene
`estadoOperativo=false`, `equipoEnBypass=si` y una recomendación → UPS-HIST-002
deriva a **En observación**; INF-2026-001 operativo → UPS-HIST-001 deriva a
**Operativo**.

| # | Módulo | Acción | Criterio |
|---|---|---|---|
| 1 | UI | `login(page, 'Administrador')` + abrir "Inventario de Equipos" | header "Inventario de Equipos" + KPI "Total Equipos" visible |
| 2 | UI | Verificar tabla | filas UPS-HIST-001, UPS-HIST-002 y "Prosegur Test S.A." visibles |
| 3 | UI | Buscar `UPS-HIST-002` | solo esa fila queda (UPS-HIST-001 = 0) |
| 4 | UI | Buscar `UPS-HIST-001` | vuelve a quedar solo UPS-HIST-001 |
| 5 | UI | Abrir drawer de UPS-HIST-001 | título contiene código + "Histórico completo" + "Informes Técnicos (n)" |
| 6 | UI | En el drawer | INF-2026-001 e INF-2026-002 visibles con Fecha/Tipo/Técnico/V. Entrada/V. Salida + botones Ver y PDF |
| 7 | UI | Verificar estado derivado | fila UPS-HIST-002 muestra "En observación", UPS-HIST-001 "Operativo"; drawer muestra "Estado según último informe" + INF-2025-088 + nota de regla; botón "Cambiar Estado" ausente |
| 8 | UI | Botón Ver en card de INF-2026-001 | modal "Vista previa del informe" con "INFORME TECNICO #INF-2026-001", botón "Descargar PDF"; se cierra con el botón Cerrar del modal |
| 9 | UI | Multi-rol | Técnico accede al módulo (rev. lectura): sin botones Cambiar Estado/Eliminar, pero histórico visible |

## 4. Evidencia

- Videos `.webm` en `test-results/` (config `video: 'on'`), uno por test (6 totales).
- Trace + screenshots automáticos de Playwright por cada escenario.
- Resultado: **6 passed** (3 corridas consecutivas estables ~2-2.8m).