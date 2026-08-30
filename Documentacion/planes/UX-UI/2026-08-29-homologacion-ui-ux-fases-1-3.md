# PLAN: Homologación UI/UX — Fases 1 a 3 (ToastModal, Modal, Drawer, Eliminar 44 alerts)

**Fecha:** 2026-08-29  
**Tipo:** UX-UI  
**Prioridad:** 🟠 ALTA (44 `window.alert()` prohibidos en 11 archivos, 10/11 módulos no homologados)  
**Rama sugerida:** `feature/ui-ux-homologation-fases-1-3`  
**Estado:** ⏸️ **PENDIENTE** — Requiere ambientes AWS (EB dev/qa) encendidos para validación E2E. Retomar cuando infra disponible.

---

## Contexto

La auditoría integral (2026-08-29) y el `Documentacion/inventario_inconsistencias_ui.md` confirman:

- **44 llamadas `window.alert()`/`confirm()`** en **11 archivos** — **Prohibido por AGENTS.md §1**
- **6+ módulos con emojis en UI** — **Prohibido por AGENTS.md §2**
- **3+ vistas con hex crudos `bg-[#00B594]`** — **Prohibido por AGENTS.md §3**
- **≥4 utilidades Tailwind v4 inválidas** (`w-8.5`, `gap-4.5`, `text-[9px]`, `animate-slide-in-right`) — **Prohibido por AGENTS.md §4-5**
- **10/11 módulos NO cumplen patrón Dashboard** — **Regla de Oro `guia_ui_ux.md §10`**
- **3 sistemas de notificación coexistentes** — Objetivo: **solo `<ToastModal>` canónico**

El `inventario_inconsistencias_ui.md` ya define el **Plan de Migración en 6 fases**. Este plan cubre **Fases 1-3** (críticas).

---

## Alcance

| Fase | Entregable | Archivos Afectados | Prioridad |
|------|------------|-------------------|-----------|
| **Fase 1** | Componente shared `<ToastModal>` + hook `useToast()` | Nuevo: `src/components/shared/ToastModal.tsx`, `src/hooks/useToast.ts` | 🔴 Crítica |
| **Fase 2** | Componentes shared `<Modal>` + `<Drawer>` | Nuevo: `src/components/shared/Modal.tsx`, `src/components/shared/Drawer.tsx` | 🔴 Crítica |
| **Fase 3** | Eliminar 44 `alert()` nativos en 11 archivos | `SupervisorView`, `TecnicoView`, `UserManagementView`, `VentasView`, `ModalProgramarVisita`, `ModalAsignarTecnico`, `ClientesContratosView`, `ModalAgregarLinea`, `TablaOrdenesTrabajo`, `ClienteView`, `LoginView` | 🔴 Crítica |

**Fases 4-6** (Tokens, Validaciones inline, DataTable) → **Plan separado** tras completar 1-3.

---

## Criterios de Aceptación

- [ ] **0 llamadas `window.alert()`/`confirm()`/`prompt()`** en todo `src/`
- [ ] **`<ToastModal>` shared** reutilizado en 100% de vistas que necesiten notificaciones transitorias
- [ ] **`<Modal>` + `<Drawer>` shared** reutilizan `createPortal` sin duplicación (migran 10+ componentes)
- [ ] **Patrón canónico aplicado**: `notify(type, title, message)` con tipos `success`/`error`/`offline`/`info`
- [ ] **Mensajes estandarizados** según tabla `guia_ui_ux.md §5.2` (ej: "Registro Exitoso", "El recurso se guardó correctamente")
- [ ] **Tests E2E pasan**: flujos críticos muestran toasts correctos (login, guardar OT, aprobar informe, sync offline, errores)
- [ ] **Documentación actualizada**: `guia_ui_ux.md` §11 Roadmap → marcar Fases 1-3 completadas

---

## Desglose de Tareas

### Fase 1: Componente Shared `<ToastModal>` + `useToast()` (1-2 días)

#### 1.1 Crear `src/hooks/useToast.ts`
```ts
// Exporta: useToast() → { notify, toastState, closeToast }
// Tipos: AlertType = 'success' | 'error' | 'offline' | 'info'
// notify(type, title, message) → setea toastState.show = true
```

#### 1.2 Crear `src/components/shared/ToastModal.tsx`
- **Basado verbatim en** `ClientesContratosView.tsx:84-95, 2823-2866` (patrón canónico)
- **Portal** en `document.body` con `z-[9999]`, `bg-slate-900/60 backdrop-blur-xs`
- **Card**: `bg-white border border-slate-200 max-w-sm rounded-3xl p-5 shadow-2xl`
- **Header**: Icono circular (CheckCircle2/XCircle/Cloud) + título + label "GESTIA HUB & CONTROL DE CALIDAD"
- **Body**: Mensaje `text-xs text-slate-600`
- **Footer**: Botón "Entendido" con color según type (emerald/rose/slate/sky)
- **Accesibilidad**: `role="alert"`, `aria-live="polite"`, ESC para cerrar, click fuera cierra

#### 1.3 Integrar en `App.tsx` (provider global)
```tsx
// En App.tsx, al final del return:
<ToastModal />
```

#### 1.4 Migrar `ClientesContratosView.tsx`
- Eliminar bloque `alertState` inline (líneas 84-95, 2823-2866)
- Importar `useToast` y usar `notify(...)`
- Verificar que 3 `alert()` restantes (líneas 867, 881, 886) usan `notify()`

#### 1.5 Test manual: Login → Dashboard → acción éxito/error → toast aparece

### Fase 2: Componentes Shared `<Modal>` + `<Drawer>` (1-2 días)

#### 2.1 Crear `src/components/shared/Modal.tsx`
- **Props**: `isOpen`, `onClose`, `title`, `children`, `size?` (`sm`/`md`/`lg`/`full`), `footer?`
- **Basado en patrón** `guia_ui_ux.md §4.4` (modal centrado)
- **Animación**: `animate-fade-in` (ya en `src/index.css`)
- **Accesibilidad**: `<dialog open>` nativo, `aria-modal`, `aria-labelledby`, ESC + click fuera

#### 2.2 Crear `src/components/shared/Drawer.tsx`
- **Props**: `isOpen`, `onClose`, `title`, `children`, `position?` (`right`/`left`), `size?` (`sm`/`md`/`lg`/`full`)
- **Basado en patrón** `guia_ui_ux.md §4.4` (drawer lateral derecho)
- **Animación**: `animate-slide-in-right` → **añadir keyframe en `src/index.css`** (no existe)

#### 2.3 Migrar componentes existentes (prioridad alta):
| Componente Actual | Migrar a | Archivo |
|-------------------|----------|---------|
| `EquipoPickerModal.tsx` | `<Modal>` | `src/components/EquipoPickerModal.tsx` |
| `EquipoDetailDrawer.tsx` | `<Drawer>` | `src/components/EquipoDetailDrawer.tsx` |
| `InventarioEquipoDrawer.tsx` | `<Drawer>` | `src/components/InventarioEquipoDrawer.tsx` |
| `ModalAgregarLinea.tsx` | `<Modal>` | `src/components/ot/ModalAgregarLinea.tsx` |
| `ModalAsignarTecnico.tsx` | `<Modal>` | `src/components/ot/ModalAsignarTecnico.tsx` |
| `ModalComentarios.tsx` | `<Modal>` | `src/components/ot/ModalComentarios.tsx` |
| `ModalCrearOtMarco.tsx` | `<Modal>` | `src/components/ot/ModalCrearOtMarco.tsx` |
| `ModalDetalleEquipos.tsx` | `<Modal>` | `src/components/ot/ModalDetalleEquipos.tsx` |
| `ModalEditarLinea.tsx` | `<Modal>` | `src/components/ot/ModalEditarLinea.tsx` |
| `ModalProgramarVisita.tsx` | `<Modal>` | `src/components/ot/ModalProgramarVisita.tsx` |
| `ConfirmModal.tsx` | **Ya existe** (usar) | `src/components/shared/ConfirmModal.tsx` |

#### 2.4 Eliminar `createPortal` duplicado en cada componente migrado
#### 2.5 Test: Cada modal/drawer abre, cierra (ESC, click fuera, botón), renderiza children

### Fase 3: Eliminar 44 `alert()` Nativos (2-3 días)

**Orden de prioridad** (según `inventario_inconsistencias_ui.md §3`):

#### 3.1 `TecnicoView.tsx` (5 alerts + banner offline) — **Prioridad 1** (uso en campo, alta fricción)
| Línea | Actual | Reemplazo `notify()` |
|-------|--------|---------------------|
| 259 | `alert('💾 Borrador guardado offline')` | `notify('offline', 'Borrador Guardado', 'Se guardará localmente y se sincronizará al recuperar la conexión.')` |
| 579 | `alert('✅ Autocompletado exitoso...')` | `notify('success', 'Autocompletado Exitoso', 'El informe se rellenó con datos predeterminados.')` |
| 584 | `alert('⚡ Validación SLA...')` | **Error inline** en grilla fotos (no toast) |
| 757 | `alert('⚠️ Informe en cola offline')` | `notify('offline', 'Informe en Cola', 'Se subirá automáticamente al reconectar.')` |
| 761 | `alert('✅ Carga exitosa')` | `notify('success', 'Informe Subido', 'El informe se procesó y envió a aprobación.')` |
| 1832 | Banner inline "Offline" | Mantener como status persistente (no toast) |

#### 3.2 `SupervisorView.tsx` (7 alerts + emojis) — **Prioridad 2**
| Línea | Actual | Reemplazo |
|-------|--------|-----------|
| 82 | `alert('❌ ALERTA: Informe ya aprobado')` | `notify('error', 'Acción Restringida', 'El informe ya fue aprobado previamente.')` |
| 86 | `alert('✅ Informe aprobado...')` | `notify('success', 'Informe Aprobado', 'Se envió la notificación al cliente para firma.')` |
| 94 | `alert('❌ No se puede cancelar...')` | `notify('error', 'Acción Restringida', 'No se puede cancelar un informe ya aprobado.')` |
| 98 | `alert('⚠️ Debe redactar nota...')` | `notify('error', 'Validación Requerida', 'Debe redactar una nota de corrección.')` |
| 112 | `alert('✅ Enviado a corrección...')` | `notify('success', 'Enviado a Corrección', 'El informe regresó al técnico con las anotaciones.')` |
| 130 | `alert('❌ ALERTA: Informe no redactado')` | `notify('error', 'Informe no Redactado', 'Técnico aún no redacta el informe.')` |
| 926 | `alert('❌ OT Inactiva...')` | `notify('error', 'OT Inactiva', 'La OT ya no está activa en el sistema.')` |

#### 3.3 `UserManagementView.tsx` (6 alerts + emojis) — **Prioridad 3**
- Validaciones de form → **Error inline** (rojo bajo cada campo)
- Éxito guardado → `notify('success', 'Usuario Creado', 'El usuario se ha creado correctamente.')`
- Eliminar → Usar `<ConfirmModal>` (ya existe) + `notify('success', 'Usuario Eliminado', ...)`

#### 3.4 `ModalProgramarVisita.tsx` (7 alerts) — **Prioridad 4**
- Validaciones campos (líneas 260-270, 356-364) → **Error inline**
- Éxito → `notify('success', 'Servicio Programado', 'Se crearon ${N} OTs individuales.')`
- Error → `notify('error', 'Error al Guardar', 'No se pudo completar la programación.')`

#### 3.5 `ModalAsignarTecnico.tsx` (4 alerts) — **Prioridad 5**
- Validaciones → Error inline
- Éxito → `notify('success', 'Asignación Exitosa', 'Las asignaciones y programaciones se guardaron correctamente.')`

#### 3.6 `VentasView.tsx` (4 alerts + banner inline) — **Prioridad 6**
- Reemplazar alerts + banner por `notify()`
- Banner inline (línea 1355) → Evaluar si es status persistente (mantener) o transitorio (toast)

#### 3.7 `ClientesContratosView.tsx` (3 alerts restantes) — **Prioridad 7**
- Líneas 867, 881, 886 → `notify()` apropiado

#### 3.8 `ModalAgregarLinea.tsx` (1 alert) + `TablaOrdenesTrabajo.tsx` (2 alerts) — **Prioridad 8**
- `notify('error', 'OT Marco no Encontrada', 'Registre primero la OT marco #${otMarcoNum}.')`

#### 3.9 `ClienteView.tsx` (1 alert + emoji 🎉) + `LoginView.tsx` (1 alert SSO) — **Prioridad 9**
- `ClienteView:138` → `notify('success', 'Firma Exitosa', 'El SLA ha sido firmado y el informe archivado.')`
- `LoginView:250` → Mensaje inline en form (no toast) o `notify('info', 'SSO Azure AD', 'Será redirigido a Microsoft para autenticación.')`

#### 3.10 Verificación global: `grep -r "window.alert\|window.confirm\|window.prompt" src/` → **0 resultados**

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| `<ToastModal>` rompe layout en móviles | Baja | 🟡 Medio | Test en viewport móvil; `max-w-sm` + `p-4` en container |
| Migración `<Modal>`/`<Drawer>` rompe z-index o focus | Media | 🟡 Medio | Usar `<dialog>` nativo; test focus trap; `z-[9999]` consistente |
| Técnicos offline no ven toast (sin conexión) | Media | 🟠 Alto | `offline` type usa `bg-sky-50` + icono Cloud; guardar en `localStorage` cola de notificaciones + mostrar al reconectar |
| `animate-slide-in-right` no existe en CSS | Cierta | 🟢 Bajo | Añadir en `src/index.css`: `@keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }` |
| Tests E2E fallan por selectores nuevos | Media | 🟡 Medio | Actualizar selectores en `tests/` usando `data-testid` en componentes shared |

---

## Dependencias

- **Bloqueante:** Ninguna (independiente de fix seguridad y C4)
- **Paralelizable:** Fase 1 y 2 pueden ir en paralelo (diferentes archivos); Fase 3 requiere Fase 1 completada
- **Orden:** 1 → 2 → 3 (o 1+2 en paralelo → 3)

---

## Estimación Total: **4-6 días** (1-2 devs)

---

## Referencias

- `Documentacion/inventario_inconsistencias_ui.md` — Auditoría completa + plan 6 fases
- `Documentacion/guia_ui_ux.md §5` — Patrón canónico `<ToastModal>` / `<ConfirmModal>`
- `Documentacion/guia_ui_ux.md §4.4` — Patrones Modal/Drawer
- `src/components/ClientesContratosView.tsx:84-95, 2823-2866` — Implementación referencia
- `src/components/shared/ConfirmModal.tsx` — Ya existe, reutilizar
- `src/index.css` — Design tokens + keyframes
- `AGENTS.md §1-6` — Reglas UI/UX no negociables