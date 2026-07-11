# ARQUITECTURA DEL SISTEMA — PROYECTO GESTIA (Modelo C4)

Este documento describe la arquitectura real y actual del proyecto Gestia, basándose en la implementación existente (React + Node.js + PostgreSQL), superando la especificación original que planteaba tecnologías diferentes.

Se utiliza el **Modelo C4** (Contexto, Contenedores, Componentes) para ofrecer vistas desde lo más general hasta lo más detallado.

---

## 1. Nivel 1: Diagrama de Contexto (Context Diagram)
*Muestra el panorama general: quiénes usan el sistema y con qué interactúan.*

```mermaid
flowchart TD
    %% Estilos
    classDef person fill:#08427b,stroke:#052e56,color:#fff
    classDef system fill:#1168bd,stroke:#0b4884,color:#fff
    classDef external fill:#999999,stroke:#6b6b6b,color:#fff

    %% Nodos
    Admin["Administrador / Ventas\n(Gestiona clientes y contratos)"]:::person
    Tecnico["Técnico de Campo\n(Registra en sitio / offline)"]:::person
    Supervisor["Supervisor Técnico\n(Audita reportes)"]:::person
    Cliente["Cliente Final\n(Firma conformidad)"]:::person

    Gestia["Plataforma Gestia\n(Sistema central de Mantenimiento)"]:::system
    Email["Servidor SMTP / AWS SES\n(Envío de correos)"]:::external

    %% Relaciones
    Admin -- "Agenda y monitorea" --> Gestia
    Tecnico -- "Sincroniza reportes" --> Gestia
    Supervisor -- "Revisa e inspecciona" --> Gestia
    Cliente -- "Visualiza y firma" --> Gestia
    
    Gestia -- "Envía notificaciones" --> Email
```

---

## 2. Nivel 2: Diagrama de Contenedores (Container Diagram)
*Muestra la arquitectura de alto nivel y las opciones tecnológicas (Frontend vs Backend).*

```mermaid
flowchart TD
    %% Estilos
    classDef person fill:#08427b,stroke:#052e56,color:#fff
    classDef container fill:#438dd5,stroke:#2e6295,color:#fff
    classDef db fill:#2d882d,stroke:#1a4d1a,color:#fff
    classDef boundary fill:none,stroke:#666,stroke-width:2px,stroke-dasharray: 5 5

    Usuarios["Usuarios (Todos los roles)"]:::person

    subgraph Nube ["AWS / Nube Gestia"]
        direction TB
        SPA["SPA Frontend\n(React, Vite, IndexedDB)"]:::container
        API["Backend API REST\n(Node.js, Express)"]:::container
        DB[("PostgreSQL\n(Prisma ORM)")]:::db
        Storage[("Almacenamiento db.json\n(Temporal / Semilla)")]:::db
        
        SPA -- "Llamadas JSON / Sincronización" --> API
        API -- "Consultas y Transacciones" --> DB
        API -- "Lectura / Escritura" --> Storage
    end

    Usuarios -- "Interactúa vía Navegador" --> SPA
```

---

## 3. Nivel 3: Diagrama de Componentes (Backend API)
*Zoom al interior del contenedor Node.js (server.ts) para entender cómo procesa la lógica pesada.*

```mermaid
flowchart TD
    %% Estilos
    classDef component fill:#85bbf0,stroke:#5b82a8,color:#000
    classDef external fill:#438dd5,stroke:#2e6295,color:#fff
    classDef db fill:#2d882d,stroke:#1a4d1a,color:#fff

    SPA["SPA Frontend (React)"]:::external
    DB[("PostgreSQL (Prisma)")]:::db

    subgraph ServerTS ["Backend Node.js (server.ts)"]
        direction TB
        Auth["Auth Middleware\n(JWT, bcrypt)"]:::component
        Sync["Sync Controller\n(Bulk-upsert Offline)"]:::component
        OTLogic["OT & Financial Logic\n(Deduce saldo de contrato)"]:::component
        Report["Report Builder\n(Procesa JSON/Base64 fotos)"]:::component
    end

    SPA -- "Envía Token" --> Auth
    SPA -- "POST /api/sync" --> Sync
    SPA -- "POST/PUT /api/ots" --> OTLogic
    SPA -- "POST /api/reports" --> Report

    Auth -- "Verifica usuario" --> DB
    Sync -- "Prisma $transaction" --> DB
    OTLogic -- "Actualiza saldo de Contrato" --> DB
    Report -- "Guarda reporte y fotos" --> DB
```

---

## 4. Flujo de Sincronización Offline Crítico (Secuencia)
Dado que los técnicos pueden entrar a sótanos sin internet, la aplicación depende de este flujo.

```mermaid
sequenceDiagram
    autonumber
    actor T as Técnico (App React)
    participant F as Frontend State (Local)
    participant B as Backend (API Sync)
    participant DB as Base de Datos (Prisma)

    T->>F: Llenado de formulario en sótano (Sin Red)
    F->>F: Marca registro como `offlineDirty: true`
    T->>F: Técnico sale del sótano (Recupera Red)
    F->>B: POST /api/sync (Envía registros con offlineDirty=true)
    
    note over B: El backend intercepta los datos
    B->>B: Ejecuta Mapeo de Diccionario de Datos (ej. n_factura a numeroFactura)
    B->>B: Elimina datos anómalos o no registrados
    
    B->>DB: Ejecuta Prisma Transaction (Todo o nada)
    DB-->>B: Confirma escritura
    
    B-->>F: Devuelve Status 200 OK
    F->>F: Limpia flag `offlineDirty: false` (Sincronizado)
    T-->>T: Ve check verde de sincronización exitosa
```
