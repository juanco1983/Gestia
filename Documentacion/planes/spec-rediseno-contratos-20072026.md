# Spec: Rediseño de vista "Contratos y Adendas" — GESTIA

## Contexto

Vista actual: `Operaciones > Contratos y Adendas`, dentro del sistema GESTIA (gestión de OT/SLA para servicios de UPS y climatización).

Usuario objetivo: **personal de servicio** que da seguimiento a contratos, programa visitas y necesita monitorear el estado de varios contratos a la vez.

Problema a resolver: la vista actual usa tarjetas de altura variable (por etiquetas de servicio de largo distinto), lo que produce desalineación del grid, baja densidad de información (4 contratos visibles por pantalla) y no permite escanear el estado de muchos contratos de un vistazo. Se reemplaza por una tabla operativa densa, ordenable y filtrable, manteniendo el sistema visual existente.

**No se debe rediseñar la identidad visual del sistema** (sidebar, topbar, paleta, tipografía). Este documento define únicamente el nuevo layout del panel de contenido "Contratos y Adendas".

---

## 1. Design tokens existentes (a reutilizar, no crear nuevos)

Extraer/confirmar estos valores del sistema de diseño actual antes de implementar. Los valores abajo son los observados en la vista actual como referencia inicial; deben validarse contra el design system real del proyecto (variables CSS, theme de Tailwind, etc.) en vez de hardcodearse de nuevo.

| Token | Uso actual observado |
|---|---|
| `--sidebar-bg` | Verde oscuro (fondo de sidebar) |
| `--accent` / `--accent-text` | Teal/verde usado en badges, links, botón primario, pill "Conectado" |
| `--amber` / `--amber-bg` | Usado en badge "Pendientes" |
| `--border` | Gris claro, 1px, separadores de tabla y cards |
| `--surface` | Blanco, fondo de cards y topbar |
| `--page-bg` | Gris muy claro, fondo general del content area |
| `--text-primary` / `--text-secondary` / `--text-muted` | Jerarquía de texto |
| Radios | `8px` en controles/botones, `12px` en cards/containers |
| Tipografía | Sans-serif del sistema (confirmar familia exacta con el equipo de frontend) |

**Regla para la IA que implemente esto**: no inventar nuevos colores ni radios. Buscar en el codebase las variables/clases ya usadas por `Contratos y Adendas`, `Centro de Operaciones` y componentes de sidebar/topbar, y reutilizarlas. Si el proyecto usa Tailwind, mapear estos tokens a las clases utilitarias existentes del proyecto, no a valores arbitrarios.

---

## 2. Estructura de la nueva vista

Reemplaza el grid de tarjetas por:

```
[Header de página: título + subtítulo + buscador]
[Barra de filtros: chips + buscador de tabla]
[Tabla]
[Nota de pie: contador + criterio de orden]
```

### 2.1 Header de página
- Título: "Contratos y Adendas Activas" (se mantiene igual al actual).
- Subtítulo: `{N} contratos registrados · {M} requieren atención` — el segundo dato es nuevo, calculado dinámicamente (ver sección 4).

### 2.2 Barra de filtros (nueva)
Chips de filtro rápido, mutuamente no exclusivos salvo "Todos":
- **Todos** (`count` = total)
- **Requieren atención** (`count` = contratos con `pendientes > 0`)
- **Por vencer (30 días)** (`count` = contratos cuya fecha de fin de vigencia está a ≤30 días)
- **Sin visitas programadas** (`count` = contratos con `programados = 0`)

Comportamiento: al hacer clic, filtra la tabla client-side (o vía query param si la data viene paginada del backend). Chip activo usa `--accent` de fondo sólido, texto blanco. Chips inactivos: borde gris, fondo blanco, texto secundario.

### 2.3 Tabla

Columnas (izquierda a derecha):

| Columna | Contenido | Notas |
|---|---|---|
| Cliente | Nombre de cliente (bold) + número de contrato (muted, debajo) | Click navega a detalle |
| Tipo de servicio | Badge con fondo `--accent-light`, texto `--accent-text` | Truncar con `...` + `title` tooltip si excede el ancho de columna, nunca hacer wrap que rompa la altura de fila |
| Vigencia | Fecha inicio – fecha fin, formato corto `dd mmm aa` | Columna ordenable |
| Equipos | Número de equipos asociados | Alineado a la derecha o centrado, tabular-nums |
| Estado | Badge: `Al día` (verde/accent) o `{N} pendiente(s)` (ámbar) | Columna ordenable, **orden por defecto: pendientes primero, luego alfabético por cliente** |
| Acciones | Link "Detalle" + botón primario "Programar visita" | Alineado a la derecha, siempre en la misma posición |

Reglas de fila:
- Altura de fila fija (no debe variar por contenido — a diferencia del diseño de tarjetas anterior).
- Fila con `pendientes > 0` recibe fondo sutil de advertencia (`--amber-bg` a baja opacidad o el token equivalente ya usado en el sistema para estados de warning, si existe).
- Hover: fondo `--page-bg` o el gris de hover ya usado en otras tablas/listas del sistema.

### 2.4 Pie de tabla
Contador ("Mostrando X de Y contratos") + indicador de criterio de orden activo.

---

## 3. Responsive / mobile

- Desktop (≥1024px): tabla completa como se especifica.
- Tablet/mobile (<1024px): colapsar a una versión de lista tipo tarjeta compacta de una sola columna (no la tarjeta grande original) — cada fila se convierte en un bloque con: línea 1 = cliente + estado badge alineado a la derecha; línea 2 = tipo de servicio + vigencia; línea 3 = acciones. Mantener los mismos datos, solo cambia el layout, no la lógica de filtros/orden.

---

## 4. Lógica funcional requerida

1. **Cálculo de estado**: `estado = pendientes > 0 ? 'attention' : 'ok'`. El badge y el conteo del header/chips dependen de este campo, no debe hardcodearse en el frontend — debe derivarse del dato real de OTs/visitas pendientes por contrato.
2. **Orden por defecto**: contratos con `estado = 'attention'` primero (orden interno: mayor número de pendientes primero), luego el resto por nombre de cliente A–Z.
3. **Ordenamiento manual**: clic en encabezado de "Vigencia" o "Estado" alterna asc/desc y desactiva el orden por defecto mientras esté activo.
4. **Filtros de chip**: aplican sobre el dataset ya cargado (o via API si la tabla es paginada server-side — a decidir según cómo esté implementado el resto del sistema).
5. **Buscador de tabla**: filtra por nombre de cliente, número de contrato o tipo de servicio (ya existe un input equivalente en el diseño actual, mantener su comportamiento).
6. **Acción "Programar visita"**: mismo modal/flujo que ya usa el sistema actual, sin cambios funcionales — solo cambia el punto de entrada visual.
7. **Acción "Detalle"**: navega a la misma vista de detalle e historial que ya existe.

---

## 5. Qué NO cambiar

- Sidebar, topbar, buscador global, badges de navegación: sin cambios.
- Tabs superiores "Contratos y Adendas" / "Centro de Operaciones": sin cambios.
- Banner de monitoreo activo y sincronización móvil: sin cambios.
- Flujo y modal de "Programar visita": sin cambios funcionales, solo el trigger visual.

---

## 6. Referencia visual

Se adjunta `rediseno_contratos.html` como mockup estático de referencia (colores aproximados, sin lógica real ni conexión a datos). **Usar únicamente como referencia de layout y jerarquía** — los colores exactos, tipografía y espaciados finales deben tomarse del design system real del proyecto, no copiarse literalmente del mockup si difieren.

## 7. Criterios de aceptación

- [ ] Con 12+ contratos, todas las filas visibles sin desalineación entre columnas.
- [ ] Un contrato con pendientes es identificable en <1 segundo de vistazo (color + badge), sin necesidad de leer la fila completa.
- [ ] Los 4 filtros de chip funcionan y actualizan el contador visible.
- [ ] El orden por defecto muestra primero los contratos que requieren atención.
- [ ] La vista responde correctamente en viewport móvil sin volver al diseño de tarjeta grande original.
- [ ] Ningún color, radio o fuente nuevo fue introducido fuera del design system existente del proyecto.
