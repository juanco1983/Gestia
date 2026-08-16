# INVENTARIO DE INCONSISTENCIAS UI/UX — GESTIA

> **Auditoría vista por módulo contra el patrón Dashboard.** Cada hallazgo
> tiene prioridad y plan de corrección. La fuente de verdad del patrón
> canónico está en [guia_ui_ux.md](./guia_ui_ux.md).
>
> **Fecha de auditoría:** 2026-07-24.
> **Alcance:** `src/components/**`.

---

## Resumen Ejecutivo

| Métrica | Cantidad |
|---|---|
| Archivos con `window.alert(...)` nativos | **11** |
| Total de llamadas `window.alert(...)` | **44** |
| Vistas con `createPortal` duplicado (sin shared `<Modal>`) | ~10 |
| Vistas que cumplen el patrón Dashboard | **1** (Dashboard) |
| Vistas con `alertState`-like pattern (canónico) | **1** (`ClientesContratosView`) |
| Módulos con emojis en UI | 6 |
| Utilidades Tailwind v4 inválidas detectadas | ≥4 (`w-8.5`, `h-8.5`, `gap-4.5`, `mb-4.5`, `pb-4.5`) |
| Hex crudos `bg-[#00B594]` en lugar del token | presente en al menos 3 vistas |

**Conclusión:** el proyecto tiene **3 sistemas de notificación
coexistentes** y **estilos duplicados** en cada modal. El Dashboard es el
único módulo homologado a su propio design system. Hay que refactorizar el
resto para alinearlo.

---

## 1. Hallazgos por Archivo

### 1.1 `src/components/ClienteView.tsx`

| Hallazgo | Línea | Severidad |
|---|---|---|
| `alert()` nativo con emoji `🎉` para confirmar firma SLA | 138 | Alta |
| Sin `alertState` pattern | — | Alta |
| No sigue el layout `bg-white rounded-2xl` estándar en su contenido | — | Media |

**Plan:** reemplazar `alert(...)` (línea 138) por
`notify('success', 'Firma Exitosa', 'El SLA ha sido firmado y el informe archivado.')`.

### 1.2 `src/components/ClientesContratosView.tsx` (3102 líneas)

| Hallazgo | Línea | Severidad |
|---|---|---|
| ✅ **Único archivo con `alertState` pattern canónico** | 84-95, 2823-2866 | — |
| `alert()` para popup blocker warning | 867 | Media |
| `alert()` para OT no encontrada | 881 | Media |
| `alert()` para informe no redactado | 886 | Media |
| `bg-[#00B594]` en vez del token `bg-teal-brand` | 2853 | Baja |
| Layout de cards correcto (`bg-white rounded-2xl border shadow-sm`) | disperso | OK |

**Plan:** usar `alertState` ya existente para reemplazar las 3 llamadas
`alert()` restantes. Migrar `bg-[#00B594]` → `bg-teal-brand` (cosmético).

### 1.3 `src/components/dashboard/*` (módulo de referencia)

| Hallazgo | Severidad |
|---|---|
| ✅ Sigue el patrón canónico completo | — |
| `bg-[#00B594]` en `DashboardHeader.tsx:86` para botón "Ir a Operaciones" (debería ser `bg-teal-brand`) | Baja |
| Bell en `DashboardHeader.tsx:80` con badge hardcoded "3" (debería ser dinámico) | Media |
| `text-[9px]` en bell badge — reemplazar por `text-[10px]` | Baja |

**Plan:** migrar `bg-[#00B594]` → `bg-teal-brand` y `bg-blue-600` (línea 89)
al sistema de tokens. El badge del bell debe venir de estado real (alerts no
vistas), no hardcoded.

### 1.4 `src/components/LoginView.tsx`

| Hallazgo | Línea | Severidad |
|---|---|---|
| `alert()` informativo SSO Azure AD | 250 | Media |
| Sin estado de error visual inline | — | Alta |

**Plan:** reemplazar `alert(...)` por un mensaje inline dentro del form de
login (estilo `bg-amber-50 border-amber-200 text-amber-700`) o por el
`<ToastModal>` patrón si se ha porteado.

### 1.5 `src/components/SupervisorView.tsx`

| Hallazgo | Línea | Severidad |
|---|---|---|
| 7 llamadas `alert()` (líneas 82, 86, 94, 98, 112, 130, 926) con emojis ⚡ ❌ ALERTA | Múltiple | Alta |
| Sin patrón `alertState` | — | Alta |
| Mensajes demasiado largos en `alert()` | — | Media |

**Plan:** introducir `alertState` local + `notify(...)` para reemplazar los
7 `alert()`. Ejemplos:
- Línea 82 → `notify('error', 'Acción Restringida', 'El informe ya fue aprobado previamente.')`
- Línea 86 → `notify('success', 'Informe Aprobado', 'Se envió la notificación al cliente para firma.')`
- Línea 94 → `notify('error', 'Acción Restringida', 'No se puede cancelar un informe ya aprobado.')`
- Línea 98 → `notify('error', 'Validación Requerida', 'Debe redactar una nota de corrección.')`
- Línea 112 → `notify('success', 'Enviado a Corrección', 'El informe regresó al técnico con las anotaciones.')`
- Línea 130 → `notify('error', 'Informe no Redactado', 'Técnico aún no redacta el informe.')`
- Línea 926 → `notify('error', 'OT Inactiva', 'La OT ya no está activa en el sistema.')`

### 1.6 `src/components/VentasView.tsx`

| Hallazgo | Línea | Severidad |
|---|---|---|
| 3 llamadas `alert()` (líneas 415, 422, 562, 584) | Múltiple | Alta |
| "Notification banner" inline (línea 1355) — diferenciado del patrón canónico | Media |
| Sin `alertState` | — | Alta |
| Charts recharts consistentes | — | OK |

**Plan:** reemplazar `alert()` y el banner inline por `<ToastModal>` patrón.

### 1.7 `src/components/UserManagementView.tsx`

| Hallazgo | Línea | Severidad |
|---|---|---|
| 5 llamadas `alert()` (líneas 101, 106, 149, 178, 212, 231) — validaciones y confirmaciones | Múltiple | Alta |
| Sin `alertState` | — | Alta |
| Usa emojis 🔒 🔑 en mensajes | — | Media |

**Plan:** introducir `alertState` local. Validaciones de form deben ser
inline (rojo debajo de cada campo), pero el éxito de guardado usa
`notify('success', 'Usuario Creado', ...)`.

### 1.8 `src/components/TecnicoView.tsx` (offline)

| Hallazgo | Línea | Severidad |
|---|---|---|
| 5 llamadas `alert()` (líneas 259, 579, 584, 689, 757, 761) con emojis 💾 ⚡ ✅ ⚠️ | Múltiple | Alta |
| "Offline notification banner" inline en línea 1832 | Media |
| Sin `alertState` | — | Alta |
| Signature canvas custom con color `#1e3a8a` (debería ser `--color-teal-deep` o similar) | — | Baja |

**Plan:** este es el módulo con mayor fricción — el técnico recibe feedback
crítico en sótanos (offline) que afecta productividad. Prioridad 1:
- Línea 259 (offline draft) → `notify('offline', 'Borrador Guardado', 'Se guardará localmente y se sincronizará al recuperar la conexión.')`
- Línea 579 (autocompletado) → `notify('success', 'Autocompletado Exitoso', 'El informe se rellenó con datos predeterminados.')`
- Línea 689 (validación SLA) → inline error en la grilla de fotos (no modal).
- Línea 757 (offline cache) → `notify('offline', 'Informe en Cola', 'Se subirá automáticamente al reconectar.')`.
- Línea 761 (carga exitosa) → `notify('success', 'Informe Subido', 'El informe se procesó y envió a aprobación.')`.

### 1.9 `src/components/ot/ModalAsignarTecnico.tsx`

| Hallazgo | Línea | Severidad |
|---|---|---|
| 4 llamadas `alert()` (líneas 189, 194, 248, 267, 271) — validaciones de regla de negocio y confirmaciones | Múltiple | Alta |
| Sin `alertState` | — | Alta |
| Modal ya usa `createPortal` — solo falta mover la notificación | — | OK base |

**Plan:** reemplazar `alert()` por `notify(...)` del parent o por un
`alertState` local. Los mensajes actuales con `✅ Asignaciones y
programaciones de equipos guardadas con éxito.` son excesivamente largos
para modal browser → acortar con el patrón canónico.

### 1.10 `src/components/ot/ModalAgregarLinea.tsx`

| Hallazgo | Línea | Severidad |
|---|---|---|
| 1 llamada `alert()` (línea 40) — OT marco inexistente | Múltiple | Media |

**Plan:** reemplazar por `notify('error', 'OT Marco no Encontrada', 'Registre primero la OT marco #${otMarcoNum}.')`.

### 1.11 `src/components/ot/ModalProgramarVisita.tsx`

| Hallazgo | Línea | Severidad |
|---|---|---|
| 7 llamadas `alert()` (líneas 260, 265, 270, 344, 348, 356, 360, 364) — validaciones y confirmaciones | Múltiple | Alta |
| Sin `alertState` | — | Alta |
| Validaciones deberían ser inline bajo cada campo (no modal) | — | Media |

**Plan:**
- Validación de campo (líneas 260-270, 356-364) → error inline rojo debajo del campo.
- Confirmación de éxito completado (línea 344, 348) → `notify('success', 'Servicio Programado', 'Se crearon ${N} OTs individuales.')`. El error `❌` (348) → `notify('error', 'Error al Guardar', 'No se pudo completar la programación.')`.

### 1.12 `src/components/ot/TablaOrdenesTrabajo.tsx`

| Hallazgo | Línea | Severidad |
|---|---|---|
| 2 llamadas `alert()` (líneas 56, 62) | Múltiple | Media |

**Plan:** similar a otros OT modals.

### 1.13 Otros descubiertos

| Archivo | Hallazgo | Severidad |
|---|---|---|
| `src/components/TechMonitoringDashboard.tsx` | Usa `ampliaciones` correctamente, layout bien — pero review de utilidades `text-[9px]` y hex crudos | Baja |
| `src/components/EquipoPickerModal.tsx` | `createPortal` duplicado (no shared `<Modal>`) | Media |
| `src/components/EquipoDetailDrawer.tsx` | Drawer right-side — patrón válido, pero inconsistente con serialized `animate-slide-in-right` (que no existe en CSS) | Media |
| `src/modulesConfig.tsx` | Badges `text-[9px]` | Baja |
| `src/App.tsx` | "Notifications bell" hardcoded, layout chrome disperso | Media |
| `src/components/dashboard/DashboardHeader.tsx` | Botón "Ir a Operaciones" con `bg-blue-600` (debería ser teal) | Baja |

### 1.14 Tailwind v4 utilities inválidas detectadas

| Utility | Razón | Acción |
|---|---|---|
| `w-8.5`, `h-8.5` | No existen en escala Tailwind v4 — silently no-op | Reemplazar por `w-9` / `w-10` |
| `gap-4.5`, `mb-4.5`, `pb-4.5` | Igual | Reemplazar por `gap-4` / `gap-5` |
| `text-[9px]`, `text-[10.5px]`, `text-[13px]` | Arbitrarios innecesarios (la escala `text-[10px]`, `text-xs` es suficiente) | Estandarizar a `text-[10px]` o `text-xs` |
| `border-slate-150` | No existe en escala | Reemplazar por `border-slate-200` |
| `animate-slide-in-right` | No definido en CSS | Agregar keyframe o eliminar |

---

## 2. Sistemas de Notificación — Comparación

| Sistema | Dónde | Visual | Cómo se cierra | Estado |
|---|---|---|---|---|
| **(A) `<ToastModal>` / `alertState`** canónico | `ClientesContratosView` | Modal blanco `bg-white rounded-3xl shadow-2xl` + icono circular + "Entendido" | Botón "Entendido" / clic fuera | ✅ Referencia |
| **(B) `window.alert()` nativo** | 11 archivos | Modal nativo browser, con emoji, sin branding | Botón OK del browser | ❌ Prohibido |
| **(C) Banner inline persistente** | `TecnicoView:1832`, `VentasView:1355`, `DashboardHeader`, `App.tsx` | Banners dentro del layout | No se cierran, son informativos | ⚠️ Aceptable para status persistente (conexión, offline), pero reemplazar por patrón unificado |

**Objetivo:** eliminar (B) completamente, mantener (A) como único patrón de
confirmación transitoria, y consolidar (C) solo para estados persistentes
(conexión / offline / Mr. Caín contexto).

---

## 3. Plan de Migración (Roadmap)

### Fase 1 — Componente shared `<ToastModal>` (1-2 días)
- Crear `src/components/shared/ToastModal.tsx` abstrayendo el patrón
  canónico de `ClientesContratosView`.
- Exportar `useToast()` hook con `notify(type, title, message)`.
- Eliminar el bloque `alertState` inline de `ClientesContratosView.tsx`
  e importar el shared.

### Fase 2 — Shared `<Modal>` y `<Drawer>` (1-2 días)
- Crear `src/components/shared/Modal.tsx` (modal centrado) y
  `src/components/shared/Drawer.tsx` (drawer lateral derecho).
- Portear primero `EquipoPickerModal`, `EquipoDetailDrawer` y todos los
  `ot/Modal*.tsx` para dejar de duplicar `createPortal`.

### Fase 3 — Eliminar `alert()` nativos (2-3 días)
- Por orden de criticidad:
  1. `TecnicoView.tsx` (5 alerts;高频uso en campo)
  2. `SupervisorView.tsx` (7 alerts; alta fricción)
  3. `UserManagementView.tsx` (6 alerts incluidas validaciones键盘)
  4. `ModalProgramarVisita.tsx` (7 alerts)
  5. `ot/ModalAsignarTecnico.tsx` (4 alerts)
  6. `VentasView.tsx` (4 alerts)
  7. `ClientesContratosView.tsx` (3 alerts restantes)
  8. `ot/ModalAgregarLinea.tsx`, `ot/TablaOrdenesTrabajo.tsx`, `ClienteView.tsx`
  9. `LoginView.tsx` (mensaje SSO informativo)

### Fase 4 — Limpieza de Design Tokens (1 día)
- Migrar `bg-[#00B594]` → `bg-teal-brand` en:
  - `DashboardHeader.tsx:89`
  - `ClientesContratosView.tsx:2853`
  - cualquier otra ocurrencia
- Migrar `bg-blue-600`/`bg-rose-500` inline → clases design system.
- Eliminar utilities Tailwind inválidas (`w-8.5`, `gap-4.5`, etc.) — revisar
  `border-slate-150` y reemplazar por `border-slate-200`.

### Fase 5 — Validaciones inline (1-2 días)
- Modales de OT (`ModalAgregarLinea`, `ModalProgramarVisita`,
  `ModalAsignarTecnico`) hoy usan `alert()` para validar campos requeridos.
  Migrar a error inline (`text-rose-600 text-xs mt-1`) bajo cada input.

### Fase 6 — Consolidar DataTable (opcional, futuro)
- Hoy cada vista tiene su `<table>` custom. Considerar un componente
  `<DataTable>` compartido con sort, paginación y estilos estándar. Defer si
  costo fuera alto.

---

## 4. Métricas de Aceptación

Al final de la migración:
- [ ] **0** llamadas `window.alert(...)` en todo `src/`.
- [ ] `<ToastModal>` shared reutilizado en 100% de vistas que necesiten
  notificaciones.
- [ ] `<Modal>` y `<Drawer>` shared reutilizan `createPortal` sin duplicación.
- [ ] 0 ocurrencias de `bg-[#00B594]`, `bg-blue-600` o hex crudos en botones
  (solo `bg-teal-brand` / `bg-rose-500` para peligro).
- [ ] 0 utilities Tailwind inválidas (`w-8.5`, etc.).
- [ ] Validaciones de form son inline, no `alert()`.
- [ ] Toda nueva vista cumple la Regla de Oro de [guia_ui_ux.md §10](./guia_ui_ux.md).

---

## 5. Referencias

- [Guía UI/UX](./guia_ui_ux.md) — design system y patrón canónico.
- [Architecture C4](./architecture_c4.md) — arquitectura general.
- `src/components/dashboard/*` — módulo de referencia.
- `src/components/ClientesContratosView.tsx:84-95, 2823-2866` — implementación de referencia de `alertState`.
