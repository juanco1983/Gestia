# Prompt: Dashboard Ejecutivo con Indicadores Reales

Copia y pega esto en el proyecto. Pídele que primero te muestre el plan de cambios antes de tocar código.

---

Necesito rediseñar el módulo **Dashboard** (`currentRole === 'Dashboard'` en `App.tsx`). El alcance es **exclusivamente ese bloque** — no tocar ningún otro módulo, componente ni vista.

## PASO 0 — Limpieza obligatoria antes de construir (eliminar código basura)

Antes de agregar nada nuevo, elimina lo siguiente de `App.tsx`. Todo esto es código decorativo que será reemplazado por implementaciones reales:

### Funciones/componentes a eliminar completamente:

1. **`function OperationalPerformanceChart()`** (líneas ~86–204): SVG estático con coordenadas hardcodeadas, datos inventados de voltaje y meses fijos. Reemplazada por gráfica real con `recharts`.

2. **`function TechHoursChart()`** (líneas ~206–245): Array `barData` hardcodeado con horas inventadas (`8h`, `7h`, `9h`...). Reemplazada por gráfica real de distribución.

3. **`interface CircularProgressProps` + `function CircularProgress()`** (líneas ~40–84): Se mantiene **solo si** las nuevas KPI cards la reutilizan con valores calculados. Si no, eliminarla también.

### Bloques JSX hardcodeados dentro del dashboard a eliminar:

4. **Las 4 tarjetas KPI con valores fijos**:
   - `<CircularProgress value={14} total={20} .../>` — "SLA Total OTs" con número inventado
   - `<CircularProgress value={10} total={15} .../>` — "Visitas Anuales" inventadas
   - `<CircularProgress value={92} total={100} label="92%" .../>` — "Satisfacción Cliente 92%" inventada
   - `<CircularProgress value={3} total={14} .../>` — "Bypass Activo 1" inventado

5. **Tarjeta "Documentos & SLAs"** (columna 2 del panel inferior): contiene un array hardcodeado con 3 archivos PDF ficticios (`SLA-Prosegur-Contrato.pdf`, `Certificado-Calibracion-UPS.pdf`, `Manual-Bypass-Termico-Mafort.pdf`) con fechas y tamaños inventados. Reemplazada por "Salud Financiera del Mes".

6. **Tarjeta "Notas de Auditoría Interna"** (columna 3 del panel inferior): contiene dos notas con texto completamente inventado ("bypass térmico de Clínica San Pablo", "kit certificado v2", "Seguridad Criptográfica"). Reemplazada por "Alertas Operativas".

**Regla de limpieza**: si al eliminar alguno de estos bloques queda alguna importación de ícono o variable sin usar, eliminarla también. El código resultante no debe tener warnings de TypeScript por variables declaradas y no usadas.

---

## Paleta de colores a respetar (NO usar colores fuera de esta lista)

| Uso | Color hex |
|---|---|
| Primario / Positivo / OK | `#00B594` |
| Éxito / Cerrado | `#10B981` |
| Advertencia / Pendiente | `#F59E0B` |
| Peligro / Rechazado / Crítico | `#F43F5E` |
| Informativo / En proceso | `#3B82F6` |
| Fondo de badge OK | `#E6F7F4` |
| Neutral / texto secundario | Tailwind `slate-400`, `slate-500` |
| Fondos de tarjeta | `white`, `slate-50` |

---

## Layout general del dashboard (estructura a construir)

```
[Fila 1] 4 tarjetas KPI resumen (grid 4 columnas)
[Fila 2] Gráfica principal (2/3) + Gráfica secundaria (1/3)
[Fila 3] 3 tarjetas de panel inferior
[Fila 4] Tabla de OTs próximas (ya existe, solo conectarla a datos reales)
```

---

## FILA 1 — 4 KPI Cards con datos reales

Reutilizar `CircularProgress` si se mantiene, o reemplazarlo con un SVG equivalente calculado. **Todos los valores se calculan en `useMemo`**, no dentro del JSX.

### Card 1: Pipeline de OTs Activas
- **Valor**: OTs cuyo `estado` NO sea `FACTURADA` ni `CERRADA`
- **Progreso**: `value = OTs activas`, `total = ots.length`, color `#00B594`
- **Subtexto**: `"X de Y OTs en ejecución este mes"` (filtradas por `fechaProgramada` del mes actual)
- **Alerta**: si hay OTs con `estado === OTStatus.OBSERVADA`, mostrar badge rojo con el conteo

### Card 2: Visitas del Mes
- **Valor**: OTs con `fechaProgramada` en el mes/año actual
- **Progreso**: `value = OTs con estado FIRMADA o CERRADA del mes`, `total = total OTs del mes`
- **Color dinámico**: tasa ≥ 80% → `#00B594`, 50–79% → `#F59E0B`, < 50% → `#F43F5E`
- **Subtexto**: `"X ejecutadas de Y programadas"`

### Card 3: Informes Pendientes de Revisión
- **Valor**: OTs con `estado === INFORME_ENVIADO || EN_REVISION`
- **Progreso**: `value = pendientes`, `total = (INFORME_ENVIADO + EN_REVISION + OBSERVADA + CORREGIDA + APROBADA + FIRMADA).length`
- **Color**: `#F59E0B`; si `pendientes > 5`, badge rojo urgente
- **Subtexto**: `"Esperando aprobación del supervisor"`

### Card 4: Equipos en Bypass Activo
- **Valor**: `reports` donde `indicadoresBateria.bypassActivo === true` y su OT no esté `CERRADA`
- **Progreso**: `value = con bypass`, `total = reports.length`
- **Color dinámico**: `value === 0` → `#00B594` + subtexto `"Sin incidencias críticas"`, `> 0` → `#F43F5E` + `"Requieren auditoría inmediata"`

---

## FILA 2 — Gráficas con `recharts` (ya disponible, no instalar nada nuevo)

### Gráfica principal (2/3): Flujo de OTs por Estado
- **Tipo**: `BarChart` horizontal de `recharts`
- **Datos**: agrupar `ots` por `estado` colapsando los 16 estados en 6 grupos:

| Grupo | Estados que incluye | Color |
|---|---|---|
| Por Asignar | `CREADA` + `PENDIENTE_PROGRAMACION` | `#94A3B8` |
| Programadas | `ASIGNADA` + `PROGRAMADA` | `#3B82F6` |
| En Campo | `EN_CAMINO` + `EN_SITIO` + `TRABAJO_EN_EJECUCION` | `#F59E0B` |
| En Documentación | `INFORME_PENDIENTE` + `INFORME_ENVIADO` | `#6366F1` |
| En Revisión | `EN_REVISION` + `OBSERVADA` + `CORREGIDA` | `#F43F5E` |
| Finalizadas | `APROBADA` + `FIRMADA` + `FACTURADA` + `CERRADA` | `#00B594` |

- **Tooltip**: al hover mostrar detalle de estados individuales dentro del grupo
- **Debajo de la gráfica**: 3 tiles con métricas reales:
  - `Tasa de cierre del mes`: `(FIRMADA + CERRADA del mes / total OTs del mes) × 100`%
  - `Tiempo promedio de ciclo`: días promedio entre `creadoEn` y fecha actual para OTs `FIRMADAS`/`CERRADAS`; si no hay suficientes datos, mostrar `"N/D"`
  - `Sin técnico asignado`: OTs con `!tecnicoTitularId && tecnicoTitular === ''` en estado `CREADA` o `PENDIENTE_PROGRAMACION`

### Gráfica secundaria (1/3): Distribución por Tipo
- **Tipo**: `PieChart` con `innerRadius` (dona) de `recharts`
- **Toggle** arriba: "Por Servicio" / "Por Equipo"
  - Por Servicio: agrupar por `tipoMantenimiento` → Preventivo `#00B594`, Correctivo `#F59E0B`, Emergencia `#F43F5E`
  - Por Equipo: agrupar por `tipoEquipo` → UPS `#00B594`, Climatización `#3B82F6`, Transformador `#F59E0B`, Rectificador `#6366F1`
- **Centro de la dona**: total de OTs
- Si `ots.length === 0`: mostrar estado vacío con texto `"Sin OTs registradas"`

---

## FILA 3 — 3 tarjetas de panel inferior

### Tarjeta 1: Usuario en Sesión (mantener diseño, agregar datos contextuales)
- Mantener el avatar con iniciales, nombre, email, rol y área (ya existe y usa datos reales)
- Agregar sección debajo con información contextual según rol:
  - **Técnico**: "Mis OTs hoy: X | Esta semana: Y" (filtrar por `tecnicoTitularId === currentUser.id`)
  - **Supervisor**: "Informes en revisión: X" (contar `EN_REVISION`)
  - **Ventas / Administrador**: "Por facturar este mes: S/ X" (sumar `ordenesTrabajo` con `estado === 'POR FACTURAR'` y `mes_prog_facturacion` = mes actual)
  - **Cliente**: "Mis OTs activas: X" (filtrar por `clientId === currentUser.clientId`)

### Tarjeta 2: Salud Financiera del Mes (reemplaza "Documentos & SLAs")
- Fuente de datos: `ordenesTrabajo` y `targetVentas`
- **Facturado este mes**: suma de `sub_importe_sin_igv` donde `estado === 'FACTURADO'` y `mes_factura` = mes actual en español (ENE, FEB...)
- **Por facturar este mes**: suma donde `estado === 'POR FACTURAR'` y `mes_prog_facturacion` = mes actual
- **Target del mes**: buscar en `targetVentas` por `anio` y `mes_num` actuales → campo `target_ventas_usd`
- **Barra de progreso**: `(Facturado USD / Target) × 100` — misma lógica de color que Card 2 (verde/ámbar/rojo)
- Si `ordenesTrabajo.length === 0` o sin target configurado: mostrar `"Sin datos financieros cargados"` en tono neutro

### Tarjeta 3: Alertas Operativas (reemplaza "Notas de Auditoría Interna")
- Lista priorizada de hasta 5 alertas calculadas de los datos reales:
  1. 🔴 OTs de hoy con `estado === PROGRAMADA` y sin `tecnicoTitularId`
  2. 🟠 OTs con `estado === OBSERVADA` (rechazadas por supervisor, esperando corrección del técnico)
  3. 🟡 OTs con `fecha Programada` hace > 3 días y `estado === INFORME_PENDIENTE`
  4. 🟡 `ordenesTrabajo` con `mes_prog_facturacion` del mes anterior y `estado === 'POR FACTURAR'`
  5. 🟢 OTs con `estado === FIRMADA` y `listaParaFacturar !== true`
- Si no hay alertas en ninguna categoría: `"✓ Sin alertas activas"` en `#00B594`
- Cada alerta es un ítem clicable que navega al módulo correspondiente (`setCurrentRole(...)`)

---

## FILA 4 — Tabla de OTs próximas (ajustes menores)

La lógica de ordenar por cercanía a hoy y mostrar 10 ya funciona. Solo corregir:
- **Columna Técnico**: resolver `tecnicoTitularId` buscando en `users` para mostrar el nombre actualizado (no depender solo del string `tecnicoTitular`)
- **Columna Origen**: agregar columna con `ot.origen` como badge sutil si existe
- **Mantener** los badges de estado con sus colores actuales — ya están bien

---

## Consideraciones técnicas obligatorias

- **Alcance estricto**: modificar únicamente el bloque `{currentRole === 'Dashboard' && (...)}` en `App.tsx` y las funciones/interfaces que solo se usan dentro de él. No tocar otros módulos, vistas ni componentes.
- **`useMemo` único**: todos los cálculos del dashboard en un solo `useMemo` al inicio del bloque, con dependencias `[ots, clients, reports, ordenesTrabajo, users, contracts, currentUser]`. Cero lógica de cálculo dentro del JSX.
- **Sin librerías nuevas**: usar solo `recharts` (ya instalado) y lo que ya está importado en `App.tsx`.
- **Sin `NaN` ni `undefined` visibles**: usar `|| 0`, `|| 'N/D'` y `Number.isFinite()` donde corresponda antes de renderizar.
- **Responsive**: en `< md` las 4 cards → 2 columnas; gráficas → una debajo de la otra; tabla → solo 5 OTs o hidden en mobile.
- **Sin warnings de TypeScript**: después de la limpieza del Paso 0, el archivo no debe tener variables ni importaciones sin usar.

---

Antes de escribir código, muéstrame:
1. Lista exacta de líneas/bloques que eliminarás (Paso 0)
2. Lista de lo que agregarás y dónde se insertará
3. Confirmación de que ningún otro módulo será tocado
