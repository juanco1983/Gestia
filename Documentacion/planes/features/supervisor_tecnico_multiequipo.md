# Plan: Refactorización Multi-Equipo — Módulos Operaciones, Supervisor y Técnico (Plan V2 Fused)

Este plan detalla los cambios técnicos para reestructurar la gestión de Órdenes de Trabajo (OT) multi-equipo en los perfiles de **Operaciones**, **Supervisor** y **Técnico**, manteniendo total compatibilidad con las lógicas financieras y comerciales.

## Contexto y Nuevos Roles

Actualmente, una sola Orden de Trabajo puede contener **N equipos**. El sistema debe permitir la asignación independiente de técnicos y la generación de un informe técnico por equipo asignado.

De acuerdo a la evolución y restricciones del **Plan V2**, los roles quedan estructurados así:
1. **Operaciones (TechMonitoringDashboard):** Responsable único de visualizar OTs, programar fechas y horas, y asignar técnicos titulares/apoyos **individualmente para cada equipo** de la OT.
2. **Supervisor (SupervisorView):** Responsable único de revisar, observar o aprobar los informes técnicos individuales por equipo. No asigna ni programa técnicos.
3. **Técnico (TecnicoView):** Visualiza sus OTs y equipos asignados, reporta "En camino" y "Llegada a Sitio" globalmente por visita, y completa un informe técnico por cada equipo.

---

## Cambios en el Modelo de Datos

* **Cambio en `TechnicalReport`:** Se remueve el modificador `@unique` en el campo `otId`.
* **Identificador Compuesto:** Se crea una clave compuesta `@@unique([otId, equipoId])` en el modelo `TechnicalReport` para permitir tener múltiples informes (uno por equipo) bajo una única OT.
* **Modelo `OtEquipoAsignacion`:** Se crea una tabla de asignación específica para cada equipo de la OT, permitiendo asociar un técnico titular, técnico de apoyo, fecha, hora y fin de programación individualmente.

---

## Estructura de Cambios Propuesta

### 1. Base de Datos (`prisma/schema.prisma`)

#### `model TechnicalReport`
```prisma
model TechnicalReport {
  id                     String   @id
  otId                   String
  equipoId               String?  // null = legacy single-equipo report; populated = per-equipo report
  voltajeEntrada         Float    @default(0)
  voltajeSalida          Float    @default(0)
  indicadoresBateria     Json     @default("{}")
  observacionesDiagnostico String @default("")
  comentariosAdicionales String  @default("")
  firmaCliente           String?
  correccionesSupervisor String?
  creadoEn               String
  modificadoEn           String
  offlineDirty           Boolean?
  fotos                  Json     @default("[]")

  @@unique([otId, equipoId])
  @@index([otId])
}
```

#### `model OtEquipoAsignacion`
```prisma
model OtEquipoAsignacion {
  id               String   @id @default(cuid())
  otId             String
  equipoId         String
  tecnicoTitularId String?
  tecnicoTitular   String?
  tecnicoApoyoId   String?
  tecnicoApoyo     String?
  fecha            String?
  hora             String?
  horaFin          String?
  creadoEn         DateTime @default(now())

  @@unique([otId, equipoId])
  @@index([otId])
}
```

### 2. Backend (`server.ts`)

* **Nuevos endpoints:**
  * `GET /api/ot-equipo-asignaciones`: Retorna las asignaciones por equipo.
  * `POST /api/ot-equipo-asignaciones`: Registra o actualiza una asignación individual.
* **Modificación de upsert de reportes:** El backend utilizará la combinación de `otId` y `equipoId` para buscar y guardar el informe en lugar de usar únicamente `otId`.

### 3. Operaciones (`src/components/TechMonitoringDashboard.tsx`)

* **Asignación por Equipo:** Al presionar "Asignar a Técnico" o hacer clic en una OT, el modal `ModalAsignarTecnico` listará todos los equipos asociados a la OT.
* **ModalAsignarTecnico:** Permitirá configurar de forma independiente para cada equipo de la OT:
  * Técnico Titular (Líder)
  * Técnico Auxiliar/Apoyo
  * Fecha de Programación
  * Horario (Inicio y Fin)
* Al guardar, llamará a `POST /api/ot-equipo-asignaciones` por cada equipo configurado.

### 4. Supervisor (`src/components/SupervisorView.tsx`)

* Se elimina cualquier control de asignación o programación.
* **Revisión de Informes:** Muestra OTs que ya tienen informes técnicos para evaluar (`EN_REVISION` o `OBSERVADA`).
* Al seleccionar la OT, mostrará pestañas por cada equipo de la OT. Cada pestaña mostrará el informe técnico individual de ese equipo para que el supervisor lo apruebe o lo observe por separado.

### 5. Técnico (`src/components/TecnicoView.tsx`)

* **Estados de la OT:** Se activa el flujo completo de:
  * `PROGRAMADA`
  * `EN_CAMINO` (Botón "Salir al Cliente")
  * `EN_SITIO` (Botón "Llegada a Sitio")
* **Generación de Informes por Equipo:** Una vez en estado `EN_SITIO`, se habilitan botones individuales para generar/completar el informe técnico correspondiente a cada equipo asignado a ese técnico.
* **Claves de Borradores en LocalStorage:** El autoguardado de borradores utilizará la clave compuesta: `mafort_draft_${otId}_${equipoId}`.

---

## Plan de Verificación

* **Compilación:** `npm run build`
* **Migración de base de datos:** `npx prisma migrate dev --name multi-equipo-report`
* **Limpieza de base de datos local:** Eliminación física de registros transaccionales antiguos para prevenir choques de tipos con registros legados.
