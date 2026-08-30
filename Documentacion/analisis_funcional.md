# Especificación de Análisis Funcional del Sistema — Gestia IA

**Versión:** 4.3.0  
**Fecha de Última Actualización:** 2026-08-30  
**Proyecto:** Gestia IA — Plataforma de Gestión de Mantenimiento Eléctrico, Climatización e Informes Técnicos  

---

## 1. Visión General del Sistema

Gestia IA es una plataforma web integral diseñada para optimizar y auditar los servicios de mantenimiento preventivo, correctivo y de emergencia de equipos industriales de potencia (UPS, Rectificadores, Bancos de Baterías, Climatización y Transformadores).

La solución abarca el ciclo de vida completo del servicio: desde la cotización y vinculación comercial con contratos marco, la programación y despacho de órdenes de trabajo (OT), la ejecución offline/online en campo por el técnico, la auditoría y control de calidad por el supervisor, hasta la aprobación final y firma de conformidad del cliente.

---

## 2. Matriz de Actores y Roles de Usuario

| Rol | Módulos Accesibles | Responsabilidades Principales |
|---|---|---|
| **Administrador** | Todos los módulos + Visitas, Tour, PWA (config) | Control total de configuración, usuarios, catálogo de equipos, contratos, métricas globales y auditoría. |
| **Ventas / Comercial** | Dashboard, Monitoreo, Gestión de OT, Clientes y Contratos, Ventas, Inventario + Visitas (creación), Tour | Registro de contratos marco, adendas, vinculación de OTs financieras, seguimiento de cotizaciones y facturación. |
| **Supervisor de Calidad** | Dashboard, Monitoreo, Supervisión, Inventario de Equipos + Visitas (lectura), Tour | Auditoría técnica de informes de campo, aprobación/rechazo de OTs, inspección de evidencias fotográficas en alta resolución. |
| **Técnico de Campo** | Dashboard, Monitoreo, Técnico (Bandeja y Formulario Wizard), Inventario + Visitas (bandeja), Tour, **PWA Offline** | Ejecución de mantenimientos en sitio, toma de lecturas eléctricas, captura de evidencias fotográficas rotuladas y envío a revisión. |
| **Cliente** | Dashboard, Monitoreo, Portal del Cliente + Visitas (lectura propia), Tour | Visualización en tiempo real del estado de sus equipos, descarga de informes aprobados en PDF/DOCX y firma digital de conformidad. |

---

## 3. Módulos Funcionales y Reglas de Negocio

### 3.1. Dashboard Principal (`DashboardView.tsx` & `RankingEquiposFallas.tsx`)

- **Ranking de Equipos con Incidencias (Top 5):** Muestra los 5 equipos con mayor volumen de fallas reales.
- **Redirección Directa a Incidencias:** Cada tarjeta de equipo del Ranking posee el botón **`Ver Incidencias →`** e interacción de clic que navega directamente a la ficha e historial de dicho equipo (`InventarioEquipoDrawer`).
- **Criterio Estricto de Detección de Fallas:**
  - Solo se contabilizan como fallas los informes con anomalías técnicas:
    - `bypassActivo = true`
    - `paso1_funcionamiento === 'bypass'`
    - Palabras clave en recomendaciones/observaciones: *falla, reemplazo, avería, sulfatación, ruido, sobrecalentamiento*
    - Estado del informe `OBSERVADA`
  - Se excluyen notas neutras o positivas (ej: *"equipo en óptimo estado de operación"*, *"operativo sin problemas"*).
  - Fuente: `DashboardView.tsx:52-58` + `RankingEquiposFallas.tsx`
- **Copiloto IA Panel:** Generación de narrativas de KPIs vía Google Gemini (`CopilotoIAPanel.tsx`). Prompt contextual con métricas actuales → Gemini → narrativa renderizada en panel.

> **Ref:** `architecture_c4.md §4.6` (Ranking redirección), `§4.10` (Copiloto IA), `data_dictionary.md §9` (Equipo), `guia_ui_ux.md §3` (patrón Dashboard)

### 3.2. Módulo Inventario de Equipos (`InventarioEquiposView.tsx`)

- **Ficha Técnica Consolidada:** Muestra el catálogo de equipos asignados a clientes y sedes.
- **Columna Dedicada Marca:** Muestra la marca del equipo (ej: *APC, Eaton, Emerson, Schneider*).
- **Columna Dedicada Estado del Contrato:**
  - 🟢 **`Vigente`**: Contrato activo cuya fecha de fin es igual o posterior a la fecha actual.
  - 🔴 **`Vencido`**: Contrato cuya fecha de fin ya expiró.
  - ⚪ **`Sin Contrato`**: Equipo no asociado a un contrato marco o adenda activa.
- **Cálculo de Visitas Históricas:** Combina dinámicamente el conteo de OTs ejecutadas e informes técnicos consolidados en Postgres (`Math.max(otsCount, reportsCount)`).
- **Derivación Estado Equipo (`deriveEstadoEquipo`, `server.ts:1955-1969`):**
  - Input: `equipo.estado` + último informe técnico (`TechnicalReport`)
  - Reglas de derivación (orden de prioridad):
    1. Si `bypassActivo = true` OR `equipoEnBypass = true` OR `revisionNormas.estadoOperativo = false` → **`En observación`**
    2. Si `recomendaciones` contiene palabras clave: *falla, reemplazo, avería, sulfatación, ruido, sobrecalentamiento* → **`En observación`**
    3. Default → **`Operativo`**
- **KPIs de Respuesta:** Total, Operativos (%), En Mantenimiento, Próximas Visitas.
- **Ficha Técnica Drawer (`InventarioEquipoDrawer`):** Historial de servicios, informes técnicos, visitas futuras programadas.

> **Ref:** `architecture_c4.md §4.5` (DeriveEstado), `§3 componente 23`, `data_dictionary.md §9` (Equipo), `guia_ui_ux.md §4.4` (Drawer pattern)

### 3.3. Módulo Supervisión y Auditoría (`SupervisorView.tsx` & `TechMonitoringDashboard.tsx`)

- **Panel de Revisión de Calidad:** Espacio de auditoría rápida de lecturas (Voltaje Entrada/Salida, Bypass, Estado Baterías) y diagnóstico técnico.
- **Visor Lightbox Modal de Foto Ampliada:** Al hacer clic sobre cualquier miniatura del *Registro Fotográfico de Conformidad* (18 slots de evidencia), la imagen se despliega en un modal centrado a pantalla completa en alta definición.
- **Regla de Limpieza de Observaciones al Aprobar:** Al hacer clic en **"Aprobar Informe"**, la OT cambia a estado 🟢 **`Aprobada`** y se borra la nota previa de corrección (`correccionesSupervisor = ""`, `server.ts:898-902`).
- **TechMonitoringDashboard:** Vista consolidada de métricas en tiempo real (OTs pendientes, en progreso, aprobadas, rechazadas, técnicos activos, sincronizaciones offline).

> **Ref:** `architecture_c4.md §4.7` (Lightbox + limpieza), `§3 componente 8`, `data_dictionary.md §5` (TechnicalReport), `guia_ui_ux.md §5` (ToastModal para notificaciones)

### 3.4. Módulo Visitas (Nuevo)

**Propósito:** Gestión de visitas técnicas programadas con OTs hijas automáticas.

**Flujo Principal:**
1. **Ventas** crea Visita → `POST /api/visitas` (código único, cliente, ubicación, fecha/hora, técnico titular/apoyo, contrato/adenda opcional)
2. Backend genera **OTs hijas automáticas** (una por equipo/servicio) vinculadas a `visitaId`
3. **Técnico** ve Visita en bandeja (`TecnicoView`) → Ejecuta OTs hijas → Completa Informes
4. **Supervisor** audita y aprueba Informes

**Reglas de Negocio:**
- **Cascade Estado:** Al cambiar Visita a `En Camino` / `En Sitio` / `Completada` → OTs hijas actualizan estado automáticamente (`server.ts:669-674`, `VisitasCascade`).
- **OTs Hijas:** Una visita puede tener múltiples OTs (una por equipo/servicio programado).
- **Estados Visita:** `Programada` → `En Camino` → `En Sitio` → `En Ejecución` → `Completada`.
- **Vinculación:** `visitaId` en OT + `contratoId`/`adendaId` opcionales.
- **Eliminación:** No permitida si tiene OTs hijas ejecutadas.

**Endpoints:** `GET/POST/PUT /api/visitas`, `GET /api/visitas/:id/ots`
**Roles:** Ventas (crea), Técnico (ejecuta), Supervisor (lectura), Admin (todo), Cliente (lectura propia)
**UI:** `VentasView.tsx` (creación), `Monitoreo` (calendario/lista), `TecnicoView` (bandeja)

> **Ref:** `architecture_c4.md §4.4` (Visita cascade), `§3 componente 6`, `data_dictionary.md §4` (Visita), `guia_ui_ux.md §3` (patrón Dashboard)

### 3.5. Módulo Tour Guiado (Nuevo)

**Propósito:** Onboarding interactivo por rol para nuevos usuarios.

**Tecnología:** `driver.js` v1.8.0 + pasos definidos en `src/tour/steps.ts`

**Flujos por Rol:**
| Rol | Pasos del Tour |
|---|---|
| **Administrador** | Dashboard → Usuarios → Clientes → Contratos → Configuración |
| **Ventas** | Dashboard → Comercial → Clientes → Contratos → Ventas |
| **Técnico** | Dashboard → Técnicos (Bandeja) → Wizard Informe → Sync |
| **Supervisor** | Dashboard → Supervisión → Inventario |
| **Cliente** | Dashboard → Portal Cliente |

**Persistencia:** `localStorage` key `gestia_tour_completed_<rol>` = `true` (evita repetir).

**UI:** Botón "Iniciar Tour" en `DashboardHeader` + auto-start en primera visita.

**Accesibilidad:** Skip tour, navegación por teclado, ARIA labels en steps.

> **Ref:** `architecture_c4.md §4.8` (Tour flow), `guia_ui_ux.md §3` (patrón Dashboard)

### 3.6. Módulo PWA Técnico Offline (Nuevo)

**Propósito:** Ejecución de mantenimientos en campo sin conexión, sincronización automática al recuperar red.

**Alcance:** **Solo rol Técnico** (flag `VITE_PWA_TECNICO=1` en dev/qa, `0` en prod).

**Arquitectura:**
- **Service Worker:** `src/sw.ts` + `vite-plugin-pwa` → Cache static assets + API GET críticas.
- **Offline Storage:** `src/offline/db.ts` (IndexedDB via `idb`) + `localStorage` drafts (`gestia_offline_queue`).
- **Sync Engine:** `src/offline/sync.ts` → Cola operaciones → `POST /api/sync` bulk upsert.

**Flujo Offline:**
1. Técnico abre `TecnicoView` → SW cachea assets.
2. Llena Wizard Informe → Guarda draft en `localStorage` (`gestia_offline_queue`).
3. Marca `offlineDirty = true` en reporte.
4. Recupera conexión → `sync.ts` detecta → `POST /api/sync` `{reports, ots, visitas, clients, contratos, equipos}`.
5. Backend procesa fotos Base64→S3, upsert BD, retorna estado sincronizado.
6. Frontend limpia `offlineDirty` + draft.

**Reglas:**
- **Solo Técnico** accede a PWA (middleware verifica rol en `App.tsx`).
- **Fotos:** Base64 en draft → S3 en sync (límite 10MB/foto).
- **Conflictos:** Server-side merge (última escritura gana + log en `UserActivityLog`).
- **Indicador UI:** Badge "Offline" en `DashboardHeader` + banner en `TecnicoView`.

**Endpoints:** `/api/sync` (bulk), `/api/photos/*` (serve), health check SW.

> **Ref:** `architecture_c4.md §4.9` (PWA sync), `§3 componentes 9,15`, `data_dictionary.md §5` (TechnicalReport), `guia_ui_ux.md §3` (patrón Dashboard)

---

## 4. Regla Estricta de Mantenimiento de la Documentación

> [!IMPORTANT]
> **Toda nueva funcionalidad, cambio en las reglas de negocio, modificación en flujos UI/UX o alteración del esquema de datos DEBE actualizar la documentación correspondiente en `Documentacion/` (incluyendo este documento de Análisis Funcional) en el mismo Commit y PR hacia `dev`.**

---

## 5. Referencias Cruzadas

| Documento | Secciones Relacionadas |
|---|---|
| `architecture_c4.md` | §3 (Componentes 6,9,15,23), §4.4-4.10 (Flujos Visita, DeriveEstado, Ranking, Lightbox, Tour, PWA, Copiloto) |
| `data_dictionary.md` | §4 (Visita), §5 (TechnicalReport), §9 (Equipo), §10 (Ubigeo) |
| `guia_ui_ux.md` | §3 (Patrón Dashboard), §4.4 (Modal/Drawer), §5 (ToastModal/ConfirmModal) |
| `inventario_inconsistencias_ui.md` | Estado actual UI por módulo + plan homologación |