# ARQUITECTURA DEL SISTEMA — PROYECTO GESTIA (Modelo C4)

> **Única fuente de verdad arquitectónica.** Este documento describe la
> arquitectura **real y vigente** del sistema Gestia, alineada con la
> implementación actual (React 19 + Express 4 + PostgreSQL 15 + AWS).
> Cualquier cambio en infraestructura o componentes DEBE actualizarse aquí en
> la misma PR que introduce el cambio.
>
> **Versión:** 2.0 — Reescritura completa basada en auditoría del código y
> Terraform (2026-07-24). Reemplaza la versión anterior que mencionaba
> `db.json`, IndexedDB y SMTP/SES que ya no forman parte del sistema.

---

## 1. Nivel 1: Diagrama de Contexto (Context Diagram)

Panorama general: quién usa el sistema y con qué interactúa.

```mermaid
flowchart TD
    classDef person fill:#08427b,stroke:#052e56,color:#fff
    classDef system fill:#1168bd,stroke:#0b4884,color:#fff
    classDef external fill:#999999,stroke:#6b6b6b,color:#fff

    Admin["Administrador\n(Gestiona usuarios, clientes, contratos)"]:::person
    Ventas["Ejecutivo Ventas\n(OTs financiera, contratos, targets)"]:::person
    Tecnico["Técnico de Campo\n(Registra informes / offline)"]:::person
    Supervisor["Supervisor\n(Audita y aprueba informes)"]:::person
    Cliente["Cliente Final\n(Firma conformidad digital)"]:::person

    Gestia["Plataforma Gestia / Mafort IA\n(Sistema de Gestión de Mantenimiento)"]:::system
    Gemini["Google Gemini AI\n(Copiloto IA del Dashboard)"]:::external
    AWS["AWS Cloud\n(Infraestructura de despliegue)"]:::external

    Admin -- "Administra" --> Gestia
    Ventas -- "Crea OTs y contratos" --> Gestia
    Tecnico -- "Sincroniza informes" --> Gestia
    Supervisor -- "Revisa y aprueba" --> Gestia
    Cliente -- "Visualiza y firma" --> Gestia

    Gestia -- "Prompt IA (Copiloto)" --> Gemini
    Gestia -- "Desplegado en" --> AWS
```

**Actores (5 roles):**
| Actor | Permisos |
|---|---|
| Administrador | Usuarios, clientes, contratos, todas las OT, reportes, configuración |
| Ventas | Clientes, contratos comerciales, OT financiera, targets |
| Supervisor | Auditoría y aprobación de informes técnicos |
| Técnico | Portal offline, captura de informes con fotos/firma |
| Cliente | Portal de visualización y firma digital |

**Sistemas externos:**
- **Google Gemini AI** (`@google/genai`) — Copiloto IA en el Dashboard (key `GEMINI_API_KEY`).
- **AWS Cloud** — Toda la infraestructura productiva (ver [arquitectura_infraestructura_nube.md](./arquitectura_infraestructura_nube.md)).

---

## 2. Nivel 2: Diagrama de Contenedores (Container Diagram)

```mermaid
flowchart TD
    classDef person fill:#08427b,stroke:#052e56,color:#fff
    classDef container fill:#438dd5,stroke:#2e6295,color:#fff
    classDef db fill:#2d882d,stroke:#1a4d1a,color:#fff
    classDef external fill:#999999,stroke:#6b6b6b,color:#fff

    Usuarios["Usuarios (5 roles)"]:::person

    subgraph AWS ["AWS Cloud — Entorno Gestia"]
        direction TB
        Amplify["Frontend SPA\nReact 19 + Vite 6 + Tailwind 4\n(AWS Amplify)"]:::container
        CF["CloudFront\n(HTTPS + cache)"]:::external
        EB["Backend API REST\nNode.js 20 + Express 4 + Prisma 7\n(AWS Elastic Beanstalk EC2)"]:::container
        RDS[("PostgreSQL 15\n(RDS, db.t3.micro)")]:::db
        S3[("S3 Bucket\nFotos + PDFs (Glacier@90d)")]:::db
        Secrets[("Secrets Manager\nDB password + JWT secret")]:::db
    end

    Gemini["Google Gemini AI"]:::external

    Usuarios -- "HTTPS (browser)" --> Amplify
    Amplify -- "Build deploy (GitHub) " --> Amplify
    Amplify -- "/api/* (proxy) " --> CF
    CF -- "Foward" --> EB
    EB -- "Prisma (driver pg)" --> RDS
    EB -- "uploadBase64 / PDF" --> S3
    EB -- "Credenciales / JWT" --> Secrets
    EB -- "Generative AI (Copiloto)" --> Gemini
```

**Contenedores:**

| Contenedor | Tecnología | Localización | Descripción |
|---|---|---|---|
| Frontend SPA | React 19 + Vite 6 + Tailwind 4 | AWS Amplify (repo GitHub) | Interfaz de usuario. Sin router, conmutación por rol vía `useState` |
| CDN | CloudFront | AWS edge | HTTPS + redirect-to-https, cacheo estático |
| Backend API | Express 4 + Prisma 7 + bcrypt + JWT | Elastic Beanstalk (EC2 t3.micro, Node 20 AL2023) | Único `server.ts` (~3000 líneas) con ~85 endpoints REST |
| Base de datos | PostgreSQL 15 + Prisma ORM | RDS db.t3.micro, gp2 20GB | Schema con 19 modelos (ver [data_dictionary.md](./data_dictionary.md)) |
| Blob storage | S3 (fotos + PDFs) | bucket `gestia-dev-photos` | Ciclo de vida Glacier@90d, versionado, SSE-AES256 |
| Secrets | AWS Secrets Manager | `/gestia/{env}/db_password`, `/jwt_secret` | Credenciales RDS y JWT |

**Sin estado externo**: el legacy `db.json` y `IndexedDB` se eliminaron en la migración a S3. La persistencia offline se maneja en `localStorage` del técnico (drafts), sincronizados vía `/api/sync`.

---

## 3. Nivel 3: Diagrama de Componentes (Backend API)

Zoom al interior del único contenedor backend (`server.ts` ~3000 líneas, 25 componentes).

```mermaid
flowchart TD
    classDef component fill:#85bbf0,stroke:#5b82b8,color:#000
    classDef internal fill:#a8d0e6,stroke:#5b82b8,color:#000,stroke-dasharray: 5 5
    classDef external fill:#438dd5,stroke:#2e6295,color:#fff
    classDef db fill:#2d882d,stroke:#1a4d1a,color:#fff
    classDef store fill:#f5a623,stroke:#c47e0e,color:#fff

    SPA["SPA Frontend (React)"]:::external
    DB[("PostgreSQL (Prisma)")]:::db
    S3[("S3")]:::store
    SM[("Secrets Manager")]:::db

    subgraph ServerTS ["Backend Node.js — server.ts (~3000 líneas)"]
        direction TB
        Auth["AuthMiddleware\n(JWT verify, public endpoints)"]:::component
        Users["UserController\n(/api/login, /api/users*, /api/logs)"]:::component
        Ubigeo["UbigeoController\n(/api/ubigeo/*)"]:::component
        Clients["ClientsController\n(/api/clients*)"]:::component
        Legacy["LegacyContractsController\n(/api/contracts* legacy)"]:::component
        Visitas["VisitasController\n(/api/visitas*, cascade a OTs)"]:::component
        OTs["OTController\n(/api/ots* atómico + OTLinea)"]:::component
        Reports["ReportsController\n(/api/reports* upsert + S3)"]:::component
        Sync["SyncController\n(/api/sync bulk offline)"]:::component
        OTLinea["OTLineaController\n(/api/ot-lineas* factura)"]:::component
        Contratos["ContratosController\n(/api/contratos-comerciales*)"]:::component
        Equipos["EquiposController\n(/api/equipos*, inventario)"]:::component
        Asign["OtEquipoAsignController\n(/api/ot-equipo-asignaciones*)"]:::component
        S3Helper["S3Helper\n(upload/delete/presigned)"]:::component
        AI["GeminiAdapter\n(Copiloto IA)"]:::component
        Seed["BootSeeders\n(seed ubigeo, tipos, fixes)"]:::component
        Health["HealthController\n(/health, /api/health)"]:::component
        VisitasCascade["VisitasCascade\n(interno)"]:::internal
        OTAutoFin["OTAutoFinanciera\n(interno, transacción atómica)"]:::internal
        PhotoProc["ReportPhotoProcessor\n(interno, Base64→S3)"]:::internal
        Sanitizer["ReportSanitizer\n(interno, whitelist campos)"]:::internal
        DeriveEstado["DeriveEstadoEquipo\n(interno, estado real)"]:::internal
        InventAgg["InventarioAggregator\n(interno, KPIs + paginación)"]:::internal
        EquipoPhoto["EquipoPhotoHandler\n(interno, upload S3)"]:::internal
        FileAuthZ["FileServingAuthZ\n(role-gated file access)"]:::internal
    end

    SPA -- "Bearer Token" --> Auth
    Auth -- "verify JWT" --> SM
    SPA -- "/api/*" --> Users
    SPA -- "/api/*" --> Clients
    SPA -- "/api/*" --> Contratos
    SPA -- "/api/*" --> Equipos
    SPA -- "/api/*" --> OTs
    SPA -- "/api/*" --> Reports
    SPA -- "/api/sync" --> Sync
    SPA -- "/api/*" --> OTLinea
    SPA -- "/api/visitas*" --> Visitas
    SPA -- "/api/health" --> Health

    Auth --> Users
    Users --> DB
    Ubigeo --> DB
    Clients --> DB
    Legacy --> DB
    Visitas --> DB
    Visitas --> VisitasCascade
    OTs --> DB
    OTs --> OTAutoFin
    Reports --> DB
    Reports --> PhotoProc
    Reports --> Sanitizer
    Sync --> DB
    OTLinea --> DB
    Contratos --> DB
    Equipos --> DB
    Equipos --> DeriveEstado
    Equipos --> InventAgg
    Equipos --> EquipoPhoto
    Asign --> DB
    S3Helper --> S3
    S3Helper --> FileAuthZ
    FileAuthZ --> S3
    AI -- "prompt Gemini" --> SPA
    Seed --> DB
    Health --> DB
```

**Componentes del backend (single-file `server.ts` ~3000 líneas):**

| # | Componente | Líneas Aprox | Endpoints Clave | Responsabilidad |
|---|------------|--------------|-----------------|-----------------|
| 1 | `AuthMiddleware` | 128–141 | `/api/*` (global) | JWT verify, público/protegido, fallback `?token=` |
| 2 | `UserController` | 145–369 | `/api/login`, `/api/users*`, `/api/logs*`, `/api/db-dump`, `/api/admin/wipe-operational-db` | Auth, CRUD users, activity log, admin ops |
| 3 | `UbigeoController` | 429–512 | `/api/ubigeo/*` | Catálogo Perú (Pais/Provincia/Distrito) + seed automático |
| 4 | `ClientsController` | 514–583 | `/api/clients*` | CRUD Clientes + código auto-generado |
| 5 | `LegacyContractsController` | 585–602 | `/api/contracts*` (legacy) | Contratos anuales heredados (solo lectura) |
| 6 | `VisitasController` | 604–681 | `/api/visitas*`, `/api/visitas/:id/ots` | CRUD Visitas + cascade estado a OTs hijas |
| 7 | `OTController` | 683–996 | `/api/ots*` | CRUD OT + creación atómica OT+Financiera+descuenta saldo contrato |
| 8 | `ReportsController` | 998–1196 | `/api/reports*` | Upsert único por `(otId,equipoId)`, fotos→S3, auto-sync OTLinea |
| 9 | `SyncController` | 1402–1750 | `/api/sync` | Bulk upsert offline (reports, OTs, visitas, clients, contratos, equipos) |
| 10 | `OTLineaController` | 1107–1237 | `/api/ordenes-trabajo*`, `/api/ot-lineas*` | Línea financiera, auto-factura, lock FACTURADO, estatus bitácora |
| 11 | `ContratosController` | 1813–1954 | `/api/contratos-comerciales*`, `/api/contratos/*/ampliaciones*` | ContratoNuevo + Ampliaciones, PDFs→S3, presupuesto/saldo |
| 12 | `EquiposController` | 1506–1664 + 2161–2350 | `/api/equipos*`, `/api/inventario-equipos` | Catálogo equipos, fotos S3, inventario paginado + KPIs + deriveEstado |
| 13 | `OtEquipoAsignController` | 1412–1505 | `/api/ot-equipo-asignaciones*` | Pivote OT↔Equipo con técnicos asignados |
| 14 | `S3Helper` | 24–96, 1239–1410 | `/api/photos/*`, `/api/contracts/files/*`, `/api/equipos/files/*` | uploadBase64, delete, presigned URLs, role-gated file serving |
| 15 | `GeminiAdapter` | ~2300+ | `/api/ai/*` (embebido) | Copiloto IA Dashboard: prompts → Gemini, KPI narratives |
| 16 | `BootSeeders` | 371–427, arranque | — | `ensureUbigeoData`, `seedTipoContratos`, `runDataFixes` |
| 17 | `HealthController` | 120–126 | `/api/health`, `/health` | Health check + DB status |
| 18 | `VisitasCascade` | 669–674 | Interno | Actualiza estado OTs hijas al cambiar estado Visita |
| 19 | `OTAutoFinanciera` | 707–872 | Interno | Transacción atómica: OT + OTLinea + descuenta saldo contrato |
| 20 | `ReportPhotoProcessor` | 1009–1060 | Interno | Base64→S3, rollback on error, firma/panorama/labeled/flat |
| 21 | `ReportSanitizer` | 1062–1082 | Interno | `VALID_REPORT_FIELDS` whitelist para Prisma |
| 22 | `DeriveEstadoEquipo` | 1955–1969 | Interno | Calcula estado real equipo desde último informe + gabinete + normas |
| 23 | `InventarioAggregator` | 1971–2159 | `/api/inventario-equipos` | Agrega equipos + informes + visitas + KPIs + paginación |
| 24 | `EquipoPhotoHandler` | 2222–2264 | `/api/equipos` POST | Subida fotos equipo→S3, código auto-generado |
| 25 | `FileServingAuthZ` | 1198–1399 | `/api/photos/*`, `/api/contracts/files/*`, `/api/equipos/files/*` | Role-gated access: Admin/Ventas/Supervisor/Tecnico(propio)/Cliente(suyo) |

---

## 4. Flujos Críticos (Secuencia)

### 4.1 Login + Auth (Access + Refresh Tokens)

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant SPA as Frontend React
    participant API as Backend Express
    participant DB as PostgreSQL
    participant SM as Secrets Manager

    U->>SPA: Ingresa email + password
    SPA->>API: POST /api/login {email, password}
    API->>SM: Lee JWT_SECRET
    API->>DB: SELECT User WHERE email
    DB-->>API: User (con hash bcrypt)
    API->>API: bcrypt.compare + verifica estado Activo
    API->>API: signAccessToken({id,email,role}, 15min) + signRefreshToken({id}, 7d)
    API->>API: hashRefreshToken(refreshToken) → bcrypt
    API->>DB: UPDATE User SET refreshTokenHash = hash
    API-->>SPA: {accessToken, refreshToken, user}
    SPA->>SPA: localStorage['gestia_access_token'] + localStorage['gestia_refresh_token'] + carga Dashboard
    
    Note over SPA,API: Access token expira en 15min → auto-refresh
    SPA->>API: POST /api/auth/refresh {refreshToken}
    API->>DB: SELECT User WHERE id (desde refreshToken)
    API->>API: verifyRefreshToken(refreshToken, user.refreshTokenHash)
    API->>API: signAccessToken(nuevo, 15min) + signRefreshToken(nuevo, 7d)
    API->>DB: UPDATE User SET refreshTokenHash = nuevoHash
    API-->>SPA: {accessToken, refreshToken}
```

### 4.2 Captura de Informe Técnico Offline

```mermaid
sequenceDiagram
    autonumber
    actor T as Técnico
    participant F as Frontend (localStorage)
    participant B as Backend API
    participant S3 as AWS S3
    participant DB as PostgreSQL

    T->>F: Llenado en sitio sin señal (sótano)
    F->>F: Draft persistido en localStorage
    F->>F: Marca offlineDirty = true
    T->>F: Recupera señal
    F->>B: POST /api/sync {reports:[...]}
    B->>B: Procesa fotos Base64
    B->>S3: uploadBase64ToS3(fotos)
    S3-->>B: URLs S3
    B->>DB: Upsert TechnicalReport WHERE @@unique([otId, equipoId])
    B->>DB: $transaction (sync OT, descuenta saldo contrato)
    DB-->>B: OK
    B-->>F: 200 OK con estado sincronizado
    F->>F: limpia offlineDirty + draft
```

### 4.3 Creación de OT + OT Financiera Atómica

```mermaid
sequenceDiagram
    autonumber
    actor V as Ventas
    participant SPA as Frontend
    participant API as Backend
    participant DB as PostgreSQL

    V->>SPA: Crea OT técnica
    SPA->>API: POST /api/ots
    API->>DB: $transaction {<br/>  1. INSERT OT<br/>  2. INSERT OrdenTrabajoLinea (cuota comercial)<br/>  3. UPDATE ContratoNuevo.saldo_disponible_usd -= costo_estimado<br/>}
    DB-->>API: success
    API-->>SPA: 201 OT + otFinancieraId
```

### 4.4 Visita → OTs Hijas → Informes

```mermaid
sequenceDiagram
    autonumber
    actor V as Ventas
    participant SPA as Frontend
    participant API as Backend
    participant DB as PostgreSQL

    V->>SPA: Crea Visita (cliente, fecha, equipos)
    SPA->>API: POST /api/visitas
    API->>DB: INSERT Visita + genera OTs hijas por equipo/servicio
    API-->>SPA: 201 Visita + OTs hijas
    Note over SPA,API: Técnico ejecuta OTs → Informes
    SPA->>API: POST /api/reports (por OT)
    API->>DB: Upsert TechnicalReport @@unique(otId,equipoId)
    API-->>SPA: 201 Report
    Note over SPA,API: Supervisor aprueba
    SPA->>API: PUT /api/ots/:id {estado: "Aprobada", correccionesSupervisor: ""}
    API->>DB: UPDATE OT + limpieza observaciones
```

### 4.5 Inventario — Derive Estado Equipo

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (Supervisor/Ventas)
    participant SPA as Frontend
    participant API as Backend
    participant DB as PostgreSQL

    U->>SPA: Abre Inventario Equipos
    SPA->>API: GET /api/inventario-equipos
    API->>API: InventarioAggregator (agrega equipos + informes + visitas)
    API->>API: DeriveEstadoEquipo (último informe + gabinete + normas)
    alt bypassActivo OR equipoEnBypass OR normas.estadoOperativo=false
        API->>API: estado = "En observación"
    else recomendaciones con fallas/reemplazo/avería/sulfatación/ruido/sobrecalentamiento
        API->>API: estado = "En observación"
    else
        API->>API: estado = "Operativo"
    end
    API-->>SPA: Lista equipos con estado derivado + KPIs
```

### 4.6 Ranking Fallas → Redirección Ficha Equipo

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant SPA as Frontend
    participant API as Backend
    participant DB as PostgreSQL

    U->>SPA: Dashboard → RankingEquiposFallas
    SPA->>API: GET /api/inventario-equipos (con fallas)
    API->>DB: Query equipos con fallas (criterio estricto)
    Note right of API: Criterio: bypassActivo, paso1=bypass,<br/>palabras clave (falla,reemplazo,avería,<br/>sulfatación,ruido,sobrecalentamiento),<br/>estado OBSERVADA
    API-->>SPA: Ranking ordenado por fallas
    U->>SPA: Click "Ver Incidencias" en equipo
    SPA->>API: GET /api/inventario-equipos/:id (drawer)
    API->>DB: Historial servicios + informes + visitas futuras
    API-->>SPA: InventarioEquipoDrawer (ficha técnica)
```

### 4.7 Supervisor — Lightbox Foto + Limpieza Observaciones

```mermaid
sequenceDiagram
    autonumber
    actor S as Supervisor
    participant SPA as Frontend
    participant API as Backend
    participant DB as PostgreSQL

    S->>SPA: Panel Auditoría → click miniatura
    SPA->>SPA: Lightbox modal (imagen ampliada)
    S->>SPA: "Aprobar Informe"
    SPA->>API: PUT /api/ots/:id {estado: "Aprobada", correccionesSupervisor: ""}
    API->>DB: UPDATE OT SET estado='Aprobada', correccionesSupervisor=''
    API->>DB: UPDATE TechnicalReport (si aplica)
    API-->>SPA: 200 OK
    SPA->>SPA: Toast "Informe Aprobado" + navega a lista
```

### 4.8 Tour Guiado — Onboarding

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario Nuevo
    participant SPA as Frontend
    participant LS as localStorage

    U->>SPA: Primera vez en Dashboard
    SPA->>LS: Check gestia_tour_completed_<rol>
    alt no completado
        SPA->>SPA: driver.js steps (src/tour/steps.ts)
        SPA->>SPA: Highlights UI por rol (Admin/Ventas/Técnico/Supervisor/Cliente)
        U->>SPA: Completa pasos
        SPA->>LS: SET gestia_tour_completed_<rol>=true
    else completado
        SPA->>SPA: No muestra tour
    end
```

### 4.9 PWA Técnico — Offline Draft → Sync

```mermaid
sequenceDiagram
    autonumber
    actor T as Técnico
    participant SPA as Frontend (TecnicoView)
    participant SW as Service Worker
    participant LS as localStorage
    participant API as Backend
    participant DB as PostgreSQL

    T->>SPA: Abre Wizard Informe (sin señal)
    SW->>SW: Cache static assets (vite-plugin-pwa)
    T->>SPA: Llena formulario + fotos
    SPA->>LS: Save draft (gestia_offline_queue)
    SPA->>SPA: offlineDirty = true
    Note over T,API: Recupera conexión
    SPA->>API: POST /api/sync {reports, ots, visitas, ...}
    API->>API: Bulk upsert + Base64→S3 fotos
    API->>DB: Transaction (reports + OTs + visitas)
    API-->>SPA: 200 OK estado sincronizado
    SPA->>LS: Clear draft + offlineDirty = false
```

### 4.10 Copiloto IA — KPI Narratives

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (Admin/Ventas/Supervisor)
    participant SPA as Frontend (Dashboard)
    participant AI as CopilotoIAPanel
    participant API as Backend
    participant GM as Google Gemini

    U->>SPA: Dashboard → Click "Copiloto IA"
    SPA->>AI: Prompt contextual (KPIs + filtros actuales)
    AI->>API: POST /api/ai/generate {prompt, context}
    API->>API: GeminiAdapter.buildPrompt(kpiData)
    API->>GM: generateContent(prompt)
    GM-->>API: Narrative text
    API-->>AI: {narrative}
    AI->>SPA: Render narrative en panel
```

---

## 5. Decisiones Arquitectónicas Clave

1. **Single-server monolith**: un único `server.ts` con todos los endpoints (~85) y helpers. No hay capa de servicios, ni controllers folder. Trade-off: simplicidad inicial + deuda de mantenimiento.
2. **Sin router en el frontend**: `App.tsx` conmuta vistas por `useState(currentRole)`. Las rutas se definen en `src\modulesConfig.tsx`. Permite SSR-free deploy en Amplify estático.
3. **Prisma `migrate deploy` en producción**: el deploy CI ejecuta `prisma migrate deploy` (Procfile). Migraciones versionadas en `prisma/migrations/`. **Resuelto (2026-08-29)**.
4. **`localStorage` para offline**: los técnicos persisten drafts en `gestia_offline_queue`. No hay IndexedDB. Sync vía `/api/sync` endpoint bulk.
5. **S3 como blob storage**: fotos de informes (`reports/`), PDFs de contratos (`contracts/`), fotos de equipos (`equipo/`). URLs guardadas en columnas del schema; nunca Base64 en DB.
6. **JWT Access + Refresh Tokens**: Access 15min + Refresh 7d con revocación en BD (`User.refreshTokenHash`). Endpoints `/api/auth/refresh`, `/api/auth/logout`. **Resuelto (2026-08-29)**.
7. **Rate Limiting + CORS**: 100 req/min `/api/*`, 200 req/min `/api/sync`. CORS con `ALLOWED_ORIGINS` env. **Resuelto (2026-08-29)**.
8. **No hay jobs programados**: no cron, no queues. Las tareas (`seedTipoContratos`, `runDataFixes`, `ensureUbigeoData`) se ejecutan al arranque del servidor.
9. **PWA Scope**: Solo rol Técnico (`VITE_PWA_TECNICO=1` en dev/qa, 0 en prod). Service Worker `src/sw.ts` + `vite-plugin-pwa`.

---

## 6. Deuda Técnica Arquitectónica

| Item | Impacto | Riesgo | Estado |
|---|---|---|---|
| `server.ts` monolítico (~3000 líneas) | Mantenibilidad | Alto al escalar | 🟡 Vigente |
| `prisma db push --accept-data-loss` en prod | Pérdida de datos silenciosa | Crítico | ✅ **Resuelto** (migrate deploy) |
| JWT sin refresh ni revocación | UX de sesión | Medio | ✅ **Resuelto** (access/refresh + revocación) |
| `authenticateToken` silenciosamente pasa si no hay token | Seguridad | Medio | ✅ **Resuelto** (401 en endpoints protegidos) |
| No hay rate limiting | Abuso de API | Bajo (uso interno) | ✅ **Resuelto** (100/200 req/min) |
| Boot seeders en cold start | Lentitud en deploy | Bajo | 🟡 Vigente |
| Relaciones soft FK (sin `@relation`) en la mayoría de modelos | Integridad referencial | Medio | 🟡 Vigente |
| Typo `adensasOrigen` propagado | Limpieza cosmética | Bajo | 🟡 Vigente |
| Inconsistencia UI/UX entre módulos | UX | Alto | 🟡 Vigente (ver [inventario_inconsistencias_ui.md](./inventario_inconsistencias_ui.md)) |
| **Nueva**: Monolito creciendo (~3000 líneas) | Mantenibilidad | Alto | 🟡 Vigente |
| **Nueva**: `GeminiAdapter` embebido (no componente separado) | Separación de responsabilidades | Medio | 🟡 Vigente |

---

## 7. Referencias

- [Diccionario de Datos Maestro](./data_dictionary.md) — modelo de datos (19 modelos Prisma).
- [Arquitectura e Infraestructura en la Nube](./arquitectura_infraestructura_nube.md) — Terraform, CI/CD, AWS modules.
- [Guía UI/UX](./guia_ui_ux.md) — design system, tokens, componentes compartidos.
- [Inventario de Inconsistencias UI](./inventario_inconsistencias_ui.md) — hallazgos por módulo y plan de homologación.
- `prisma/schema.prisma` — fuente de verdad del modelo de datos.
- `server.ts` — fuente de verdad del backend.
- `infra/` — fuente de verdad de la infraestructura.
