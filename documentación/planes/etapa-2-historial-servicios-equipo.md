# Etapa 2 — Historial de Servicios del Equipo

## Objetivo
Trackear el ciclo de vida operativo de cada equipo, asociándolo a las OTs e informes técnicos ya generados.

---

## Componente 2.1: Base de Datos

### [MODIFY] prisma/schema.prisma

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

---

## Componente 2.2: Backend

### [MODIFY] server.ts

- **Automatismo de creación:**
  - Al cerrar/firmar una `OT` cuyo `equipoId` esté definido, el backend crea automáticamente una fila en `ServicioEquipo`:
    - `tipo` derivado de `ot.tipoMantenimiento`
    - `fecha` de `ot.horaInicioServicio` / `fechaProgramada`
    - `tecnicoTitular` del técnico asignado
    - `estado_post` derivado del `TechnicalReport.estado_final` o por defecto "Operativo"
    - `hallazgos` de `observacionesDiagnostico`
    - `recomendaciones` de `recomendaciones`

- **Endpoints nuevos:**
  - `GET /api/equipos/:id/servicios` → lista ordenada descendente por fecha
  - `PUT /api/equipos/:id/estado` → cambiar estado del equipo; al marcar "En observación" o "En reparación" desde un informe, queda registrado en el historial

---

## Componente 2.3: Frontend

### [MODIFY] EquipoDetailDrawer.tsx
- Reemplazar el placeholder de "Historial de Servicios" por:
  - **Timeline visual** (estilo línea de tiempo vertical, alineado con línea histórica de ampliaciones que ya existe en la ficha del contrato)
  - Cada card del timeline muestra: fecha, tipo de servicio, OT#, técnico, estado final, botón "Ver PDF informe" (reutilizar el endpoint seguro de informes existente)
  - Chip de estado actual del equipo en la parte superior del drawer calculado tras obtener la lista de servicios

### [MODIFY] Ficha del Contrato — Sección Equipos
- Agregar columna "Último servicio" en la tabla de equipos asociados (fecha del último `ServicioEquipo`)
- Click en número de visitas → filtra timeline a servicios de ese equipo

---

## Plan de Verificación — Etapa 2

1. **Schema:** `npx prisma db push` adiciona tabla `ServicioEquipo`
2. **Backfill suave:** Al cerrar una OT existente con `equipoId != null`, se crea su `ServicioEquipo`
3. **Visualización:** Abrir el `EquipoDetailDrawer` y ver el timeline completo con sus OTs/informes
4. **Actualización de estado:** Marcar equipo "En observación" → el último servicio sale con estado_post "En observación" y el equipo refleja estado "En observación" en su chip superior
5. **Sin pérdida de datos:** OTs históricas sin `equipoId` siguen funcionando, pero no generan servicio de equipo (esperado y correcto)
