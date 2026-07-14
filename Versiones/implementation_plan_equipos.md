# Plan de Trabajo: Inventario de Equipos del Contrato e Historial de Servicios

Este plan detalla el diseño técnico y los pasos de desarrollo para implementar dos nuevos requerimientos en el módulo de Contratos Comerciales de Gestia:

1. **Etapa 1 — Equipos del Contrato:** Permitir incluir equipos eléctricos (UPS, transformadores, rectificadores, climatización, etc.) asociados a un contrato o a una adenda, sin inflar el formulario de creación de contrato.
2. **Etapa 2 — Historial de Servicios del Equipo:** Mantener un historial de servicios por equipo, en relación con las OTs e informes técnicos que se generen, así como un estado actualizable.

> [!IMPORTANT]
> **Decisiones de diseño acordadas:**
>
> - **Modelo de datos:** Un único modelo `Equipo` con un campo `especificaciones Json` para datos específicos por tipo (UPS → baterías/bypass; Transformador → tensión primaria, relación; etc.). Cero migraciones al agregar tipos de equipo.
>
> - **Transición con OTs existentes:** Las OTs actuales mantienen sus campos `tipoEquipo` y `potenciaKva` (strings). Se añade **únicamente** `equipoId String?` opcional en el modelo `OT`, de modo que las OTs históricas sigan funcionando y las nuevas se asocien a un equipo cuando exista. No se realiza backfill ni rupture.
>
> - **Asignación de equipos:** El modelo `Equipo` tiene `contratoId String?` **nullable**. Un equipo puede existir en almacén sin contrato, ser asignado a un contrato A, migrar después a un contrato B, y al terminar volver a estado "libre". Esto permits trackear la vida del equipo de forma fiel.
>
> - **Estrategia anti-inflación del formulario:** El formulario "Nuevo/Editar Contrato" **no recibe nuevos campos de equipo**. Toda la gestión de equipos vive en una nueva sección/pestaña dentro de la ficha de detalle del contrato (`ClientesContratosView`) y se invoca mediante modales accesorios (`EquipoPickerModal` → `EquipoDetailDrawer`), exactamente igual que ya sucede con las ampliaciones/adendas.

---

## Etapa 1 — Inventario de Equipos del Contrato

### Objetivo
Permitir asignar, crear y administrar equipos eléctricos asociados a un contrato o adenda, manteniendo el formulario de contrato simple.

### Componente 1.1: Base de Datos y Backend

#### [MODIFY] [prisma/schema.prisma](file:///c:/Informes%2520Mafort%2520IA/prisma/schema.prisma)

- **Nuevo modelo `Equipo`:**
  ```prisma
  model Equipo {
    id              String        @id @default(uuid())
    codigo          String        @unique           // ej: UPS-CL001, TR-CL0043
    tipo            String                           // UPS | Transformador | Rectificador | Climatización | Otro
    marca           String?
    modelo          String?
    serie           String?
    potenciaKva     Float?
    ubicacion       String?                         // sede / sala / cuarto técnico
    clienteId       String?                         // asociación suave a Client (para equipos en almacén asignados a cliente)
    contratoId      String?                         // nullable: equipos en almacén no tienen contrato
    contrato        ContratoNuevo? @relation(fields: [contratoId], references: [id], onDelete: SetNull)
    adensaOrigenId  String?                         // si el equipo entró por una adenda específica (para rastreabilidad)
    estado          String        @default("Operativo")  // Operativo | En reparación | En observación | Baja | En almacén
    fotos           Json?
    especificaciones Json?                           // datos flexibles por tipo de equipo
    creadoEn        DateTime      @default(now())
    actualizadoEn   DateTime      @updatedAt
    servicios       ServicioEquipo[]                // Etapa 2 — relación futura
  }
  ```

- **Modificación al modelo `ContratoNuevo`:**
  - Agregar relación inversa: `equipos Equipo[]`

- **Modificación al modelo `ContratoAmpliacion`:**
  - Agregar tabla pivote **opcional** para Trackear qué equipos entraron por cada adenda. Se elige modelo pivote explícito para mantener el histórico aunque un equipo se reasigne a otro contrato:
  ```prisma
  model EquipoAmpliacion {
    id           String            @id @default(uuid())
    adendaId     String
    adenda       ContratoAmpliacion @relation(fields: [adendaId], references: [id], onDelete: Cascade)
    equipoId     String
    equipo       Equipo            @relation(fields: [equipoId], references: [id], onDelete: Cascade)
    creadoEn     DateTime          @default(now())
  }
  ```
  - Agregar relación inversa en `ContratoAmpliacion`: `equiposAdenda EquipoAmpliacion[]`
  - Agregar relación inversa en `Equipo`: `adendasOrigen EquipoAmpliacion[]`

- **Modificación al modelo `OT` (transición suave):**
  - Agregar únicamente: `equipoId String?`
  - Mantener `tipoEquipo` y `potenciaKva` existentes por compatibilidad retroactiva.
  - Las OTs nuevas que tengan `equipoId` llenarán `tipoEquipo` y `potenciaKva` automáticamente derivándolos del `Equipo` relacionado al momento de la creación (lógica en backend), para compatibilidad de visualización con vistas legacy.

#### [MODIFY] [server.ts](file:///c:/Informes%2520Mafort%2520IA/server.ts)

- **Carga inicial / Seeding:**
  - Opcional: tipos de equipo sembrados como un modelo `TipoEquipo` (~5 filas: UPS, Transformador, Rectificador, Climatización, Otro), o como enum en constante compartida. Se elige **constante compartida** para Etapa 1 (más liviano), revisable a tabla en una etapa posterior si crece.

- **Nuevos Endpoints de API:**
  - `GET /api/equipos?contratoId=&clienteId=&estado=&tipo=` → lista filtrada.
  - `GET /api/equipos/:id` → ficha completa incl. `especificaciones`.
  - `POST /api/equipos` → crear equipo (puede recibir opcionalmente `contratoId`).
  - `PUT /api/equipos/:id` → editar campos (incluido `estado`).
  - `POST /api/contracts/:id/equipos` → asignar equipo(s) existentes a un contrato.
  - `POST /api/contracts/:contratoId/ampliaciones/:adendaId/equipos` → Trackear equipos incorporados por una adenda.
  - `DELETE /api/contracts/:contratoId/equipos/:equipoId` → desasignar (pasa `contratoId` a null, queda en almacén).

- **Ruta de Archivos Segura en S3 (fotos de equipos):**
  - Reutilizar el patrón existente de `reports/` con `equipo/` como key prefix:
    - Fotos: `equipo/<Equipo-ID>/foto-<Timestamp>.jpg`
  - Endpoint seguro `/api/equipos/files/*` validando rol `Administrador | Supervisor | Ventas`.

- **Lógica de derivación en OT:**
  - En el endpoint `POST /api/ots` (o el equivalente actual), si body incluye `equipoId`, el backend hace un lookup del equipo y completa automáticamente `tipoEquipo` y `potenciaKva` desde el equipo, salvo que vengan explícitos en el body.

---

### Componente 1.2: Modelado Frontend

#### [MODIFY] [src/types.ts](file:///c:/Informes%2520Mafort%2520IA/src/types.ts)
- Definir interfaz `Equipo`:
  ```typescript
  export interface Equipo {
    id: string;
    codigo: string;
    tipo: string;
    marca?: string;
    modelo?: string;
    serie?: string;
    potenciaKva?: number;
    ubicacion?: string;
    clienteId?: string;
    contratoId?: string;
    adendaOrigenId?: string;
    estado: 'Operativo' | 'En reparación' | 'En observación' | 'Baja' | 'En almacén';
    fotos?: any;
    especificaciones?: any;
    creadoEn?: string;
    actualizadoEn?: string;
    servicios?: ServicioEquipo[]; // Etapa 2
  }
  ```
- Definir interfaz `EquipoAmpliacion` (pivote).
- Actualizar interfaz `Contrato` para incluir `equipos?: Equipo[]`.
- Actualizar interfaz `ContratoAmpliacion` para incluir `equiposAdenda?: EquipoAmpliacion[]`.

---

### Componente 1.3: Interfaz de Usuario

Patrón: el [Modal Crear/Editar Contrato] **se queda intacto**. Toda la nueva UI vive en la ficha de detalle del contrato y sus modales accesorios, replicando el patrón ya usado para ampliaciones.

#### [MODIFY] [src/components/ClientesContratosView.tsx](file:///c:/Informes%2520Mafort%2520IA/src/components/ClientesContratosView.tsx)
- **Ficha de Detalle del Contrato (Visualización):**
  - Agregar una nueva pestaña/ sección **"Equipos Asociados"** (al lado de "Ampliaciones"):
    - Tabla con columnas: Código | Tipo | Marca/Modelo | Serie | Potencia | Estado | Acciones
    - Botón **"Asignar Equipo"** → abre `EquipoPickerModal`.
    - Click en fila → abre `EquipoDetailDrawer` lateral (drawer).
    - Cada equipo con `adendaOrigenId != null` muestra un chip "Entró por Adenda #X".
- **Sección "Ampliaciones":**
  - En cada fila de adenda, mostrar chips de equipos que entraron por ella (los que tienen `adendaOrigenId == adenda.id`), desde la tabla pivote `EquipoAmpliacion`.

#### [NEW] src/components/EquipoPickerModal.tsx
- Modal invocado desde `ClientesContratosView` (pestaña Equipos), y desde el modal de nueva adenda.
- Dos modos:
  - **Buscar existente**: autocomplete por `codigo`, `serie`, o `tipo + marca` (solo muestra equipos con `contratoId == null` o `contratoId == contratoActual`).
  - **Crear nuevo al vuelo** (mini-form con 4 campos base: Código, Tipo, Marca/Modelo, Serie; desplegable avanzado para especificaciones yextras).
- Al confirmar: si es existente → `POST /api/contracts/:id/equipos`. Si es nuevo → `POST /api/equipos` con `contratoId` desde ya, devuelve equipo, lo añade a la lista.

#### [NEW] src/components/EquipoDetailDrawer.tsx
- Panel lateral (drawer) a la derecha mostrando ficha completa de un equipo.
- Secciones:
  - **Datos base:** código, tipo, marca, modelo, serie, potencia, ubicación.
  - **Estado actual** (editable, dropdown) — actualiza con `PUT /api/equipos/:id`.
  - **Especificaciones Json**: render dinámico por tipo (badge de tipo → schema visual simple).
  - **Fotos**: galería (thumbnails → descarga segura vía endpoint `/api/equipos/files/*`).
  - **Origen:** muestra "Asignado a contrato X" o "Entró por Adenda Y del contrato Z" o "En almacén".
  - **[Etapa 2] Historial de Servicios:** timeline con: Fecha | Tipo (Preventivo/Correctivo) | OT | Técnico | Estado post | Hallazgos | (ver PDF informe).
- Botones:
  - "Editar" → abre `EquipoEditorModal`.
  - "Liberar del contrato" → `DELETE /api/contracts/:contratoId/equipos/:equipoId` (queda en almacén).
  - "Dar de baja" → cambia `estado=Baja`.

#### [MODIFY] Modal de Nueva Adenda
- Al pie del modal de creación de adenda (ya existente), agregar sección opcional **"Equipos incorporados por esta adenda"** con el mismo `EquipoPickerModal` invocado en modo "asignación a adenda". Crea filas en `EquipoAmpliacion` al guardar la adenda.

---

### Plan de Verificación — Etapa 1
1. **Migración/schema:** `npx prisma db push` valido. Tablas `Equipo` y `EquipoAmpliacion` creadas; columna `equipoId` agregada a `OT`; `ContratoNuevo` con relación `equipos`.
2. **Sin-changes en form principal:** Confirmar que el modal `Crear Contrato` no recibe nuevos campos (regresión 0). El scroll actual del modal (commit `0b9d552`) sigue funcionando.
3. **FlujoCrear equipo y asignar:**
   - Crear contrato → abrir ficha → pestaña "Equipos" → "Asignar Equipo" → modo "Crear nuevo al vuelo" → rellenar 4 campos → guardar → aparecer en tabla.
4. **FlujoAdenda que añade equipos:**
   - Abrir modal de nueva adenda → seleccionar equipos existentes → guardar → equipos quedan con `adendaOrigenId` y aparecen en la pestaña Equipos con el chip correspondiente.
5. **Flujo Liberar equipo:**
   - Liberar equipo → pasa a `contratoId=null` → ya aparece en el picker para asignarlo a otro contrato.
6. **Transición OT:** Crear OT con `equipoId` → el backend rellena `tipoEquipo`/`potenciaKva` automáticamente → las vistas legacy muestran equipo como antes.
7. **Sin pérdida de datos históricos:** Filas de `OT` existentes con `equipoId=null` siguen funcionando sin cambios.

---

## Etapa 2 — Historial de Servicios del Equipo

### Objetivo
Trackear el ciclo de vida operativo de cada equipo, asociándolo a las OTs/informes ya generados.

### Componente 2.1: Base de Datos

#### [MODIFY] prisma/schema.prisma
- **Nuevo modelo `ServicioEquipo`:**
  ```prisma
  model ServicioEquipo {
    id               String   @id @default(uuid())
    equipoId         String
    equipo           Equipo   @relation(fields: [equipoId], references: [id], onDelete: Cascade)
    otId             String                           // referencia suave a la OT existente (no FK hasta refactor OT)
    fecha            String
    tipo             String                           // Preventivo | Correctivo | Predictivo | Instalación
    estado_post      String                           // cómo quedó: Operativo | En observación | Pendiente
    tecnicoTitular   String
    hallazgos        String?
    recomendaciones String?
    fotos            Json?
    creadoEn         DateTime @default(now())
  }
  ```
- Agregar relación inversa en `Equipo`: `servicios ServicioEquipo[]`

### Componente 2.2: Backend

#### [MODIFY] server.ts
- **Automatismo de creación:**
  - Al cerrar/firmar una `OT` cuyo `equipoId` esté definido, el backend crea automáticamente una fila en `ServicioEquipo` (tipo derivado de `ot.tipoMantenimiento`, fecha de `ot.horaInicioServicio`/`fechaProgramada`, técnico titular, estado_post derivado del `TechnicalReport.estado_final` o por defecto "Operativo", hallazgos de `observacionesDiagnostico`, recomendaciones de `recomendaciones`).
  - Endpoint `GET /api/equipos/:id/servicios` → lista ordenada desc por fecha.
  - Endpoint `PUT /api/equipos/:id/estado` → cambiar estado del equipo; al marcar "En observación" o "En reparación" desde un informe, queda registrado en el historial.

### Componente 2.3: Frontend

#### [MODIFY] EquipoDetailDrawer.tsx (que ya tiene la sección placeholder)
- Reemplazar el placeholder de "Historial de Servicios" por:
  - **Timeline visual** (estilo línea de tiempo vertical, alineado con línea histórica de ampliaciones que ya existe en la ficha del contrato).
  - Cada card del timeline muestra: fecha, tipo de servicio, OT#, técnico, estado final, botón "Ver PDF informe" (reutilizar el endpoint seguro de informes existente).
  - Chip de estado actual del equipo en la parte superior del drawer calculado tras obtener la lista de servicios.

#### [MODIFY] Ficha del Contrato — Sección Equipos
- Agregar columna "Último servicio" en la tabla de equipos asociados (fecha del último `ServicioEquipo`).
- Click en número de visitas -> filtra timeline a servicios de ese equipo.

### Plan de Verificación — Etapa 2
1. **Schema:** `npx prisma db push` adiciona taba `ServicioEquipo`.
2. **Backfill suave:** Al cerrar una OT existente con `equipoId != null`, se crea su `ServicioEquipo`.
3. **Visualización:** Abrir el `EquipoDetailDrawer` y ver el timeline completo con sus OTs/informes.
4. **Actualización de estado:** Marcar equipo "En observación" → el último servicio sale con estado_post "En observación" y el equipo refleja estado "En observación" en su chip superior.
5. **Sin pérdida de datos:** OTs históricas sin `equipoId` siguen funcionando, pero no generan servicio de equipo (esperado y correcto).

---

## Workflow de Branches, Commits y Despliegue

Acordado con el usuario:

- **Granularidad:** Una rama feature por etapa.
  - `feature/equipos-etapa-1` → cubre Componentes 1.1, 1.2 y 1.3 de la Etapa 1.
  - `feature/equipos-etapa-2` → cubre Componentes 2.1, 2.2 y 2.3 de la Etapa 2.
- **Rama base:** `origin/dev` (las features se crean desde aquí, no desde main ni desde la rama actual con cambios pendientes).
- **Commits:** se hacen en **local únicamente** hasta recibir conformidad del usuario.
- **Push a GitHub:** se ejecuta `git push -u origin feature/equipos-etapa-X` **solo cuando el usuario lo ordene** expresamente ("ya está, push").
- **Pull Request:** lo abre manualmente el usuario desde GitHub hacia `dev` (no se crea con `gh pr create`).
- **Despliegue:** su pipeline de GitHub Actions despliega automáticamente al mergear a `dev`.

### Orden de ejecución sugerido
1. Crear `feature/equipos-etapa-1` desde `origin/dev`.
2. Implementar Componente 1.1 (schema + endpoints backend) → commitear en local.
3. Notificar para que el usuario pruebe la migración y los endpoints.
4. Implementar Componente 1.2 (types.ts) → commitear en local.
5. Implementar Componente 1.3 (ClientesContratosView + EquipoPickerModal + EquipoDetailDrawer + ajuste modal adenda) → commitear en local.
6. Pedir conformidad. Si OK → `git push -u origin feature/equipos-etapa-1`. El usuario abre PR → merge → deploy a dev.
7. Tras merge de Etapa 1, sincronizar `dev` y crear `feature/equipos-etapa-2` desde el nuevo `origin/dev`. Repetir para los Componentes 2.1-2.3.

---

## Consideraciones de Diseño y Migración

1. **Por qué el `especificaciones` Json en lugar de tablas hijas por tipo:**
   - Permite añadir tipos de equipo (e.g. Genset, Aire Acondicionado de precisión, Switchgear) sin migración.
   - Para validación por tipo, se mantendrá un repositorio de "esquemas JSON" en `/src/equipmentSchemas/{ups.ts, transformador.ts, ...}` con TypeScript types opcionales (no obligatorios en BD).
2. **Por qué FK nullable en `Equipo.contratoId`:**
   - Permite un catálogo de inventario real: cuando un contrato vence, los equipos no se eliminan; quedan "En almacén" con `contratoId=null` hasta ser reasignados.
3. **Manejo de onDelete:**
   - `Equipo.contrato` con `onDelete: SetNull`: si se borra un contrato, los equipos se desasignan (no se borran — valen $$$).
   - `EquipoAmpliacion` con `onDelete: Cascade` en `adendaId`: si se borra la adenda, se desvinculan los equipos de esa adenda; el equipo no se borra.
4. **Seguridad y aislamiento en S3:**
   - Reutiliza el bucket actual. Key prefix único `equipo/` sin mezclar con `reports/` ni `contracts/`.
5. **Compatibilidad con el scroll actual del modal:**
   - El modal de contrato no recibe campos nuevos, por lo que el fix de scroll existente (commit `0b9d552`) sigue siendo válido.
6. **Offline / save local:**
   - Si `ClientesContratosView` tiene lógica Offline (ver `online`/`offlineDirty` en `TechnicalReport`), los equipos también deben persistir localmente: si hay un IndexedDB/localStorage actual, extenderlo con una tabla `equipos` y `servicios_equipo`.
7. **Trazabilidad:**
   - Cada equipo con `codigo` único → permite que el PDF del informe técnico eventual muestre el equipo por su código (mejora respecto al texto libre actual `tipoEquipo + potenciaKva`).
