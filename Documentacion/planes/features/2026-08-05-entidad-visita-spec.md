# Spec: Entidad Visita — Agrupación de OTs por Viaje/Ubicación

> 🎨 **Mockup Visual Interactivo:** [`Documentacion/mockups/2026-08-05-entidad-visita-mockup.html`](file:///c:/Informes%20Mafort%20IA/Documentacion/mockups/2026-08-05-entidad-visita-mockup.html)

## Assumptions

Antes de proceder, estas son las suposiciones con las que trabajo:

1. Aplicación web SPA (React 19 + Vite 6) con API REST (Express 4 + Prisma 7)
2. Base de datos PostgreSQL 15 en AWS RDS
3. La `Visita` es un **nuevo modelo Prisma** (no agrupación virtual)
4. El sync offline vía `localStorage` + `POST /api/sync` se extiende para incluir Visitas
5. La máquina de estados existente de OT **no cambia** para operaciones individuales
6. La Visita solo gestiona logística de viaje (EN_CAMINO, EN_SITIO), no trabajo por equipo
7. `Equipo.ubicacion` se validará como **obligatorio** antes de programar una visita
8. El sidebar de `TecnicoView` se rediseñará para agrupar OTs por Visita
9. Tanto el técnico titular como el de apoyo pueden llenar informes
10. Los informes se **bloquean** cuando la OT está en `EN_REVISION` o estados posteriores (nadie edita)

→ Corrígeme ahora o procedo con estas.

---

## Objective

### ¿Qué construimos?
Una entidad **`Visita`** que representa el viaje físico de un técnico a una ubicación del cliente, agrupando múltiples Órdenes de Trabajo (OTs) que se ejecutarán en esa misma visita.

### ¿Por qué?
Actualmente cada OT tiene su propia máquina de estados de viaje (EN_CAMINO → EN_SITIO), lo que obliga al técnico a registrar "Iniciar Ruta" N veces para N equipos en la misma ubicación. Esto es operativamente absurdo y genera datos inconsistentes.

### ¿Quién es el usuario?
| Rol | Interacción con Visita |
|-----|----------------------|
| **Operaciones** | Programa visitas (auto-creación al programar OTs). Ve visitas en monitoreo. |
| **Técnico** | Gestiona viaje a nivel Visita. Ejecuta trabajo a nivel OT individual. |
| **Supervisor** | Revisa informes por OT (sin cambio), pero ve contexto de la Visita. |
| **Cliente** | Sin cambio (firma informes individuales). |

### User Stories

**US-1: Programar visita multi-equipo**
> Como Operaciones, quiero que al programar N equipos para el mismo cliente/ubicación/fecha/técnico, el sistema cree automáticamente UNA visita que agrupe las N OTs, para que el técnico tenga un solo viaje en su cola.

**Criterios de Aceptación:**
- Al seleccionar N equipos en `ModalProgramarVisita`, se crea 1 Visita + N OTs vinculadas
- La Visita tiene código auto-generado `VIS-YYYY-NNNN`
- Cada OT tiene `visitaId` apuntando a la Visita
- La clave de agrupación es: `clientId + ubicación del equipo + fechaProgramada + tecnicoTitularId`

**US-2: Auto-agrupar OTs programadas en momentos distintos**
> Como Operaciones, quiero que al programar una OT para un cliente/fecha/técnico donde ya existe una Visita programada, el sistema me sugiera agregarla a la Visita existente.

**Criterios de Aceptación:**
- El sistema busca Visitas con mismo `clientId + ubicación + fecha + tecnicoTitularId` en estado `PROGRAMADA`
- Si encuentra, muestra sugerencia: "Ya existe VIS-XXXX. ¿Agregar a esta visita?"
- El usuario decide: agregar a existente o crear nueva
- Solo busca visitas en `PROGRAMADA` (no EN_CAMINO ni posterior)

**US-3: Gestionar viaje como técnico**
> Como Técnico, quiero ver mis visitas agrupadas en el sidebar, y controlar "Iniciar Ruta" y "Llegada al Sitio" UNA sola vez por visita, para luego trabajar equipo por equipo.

**Criterios de Aceptación:**
- Sidebar muestra Visitas como cards, con OTs hijas anidadas
- "Iniciar Ruta" opera sobre la Visita → cascada a todas las OTs hijas (EN_CAMINO)
- "Llegada al Sitio" opera sobre la Visita → cascada a todas las OTs hijas (EN_SITIO)
- "Iniciar Trabajo" / "Llenar Informe" / "Finalizar" opera por OT individual
- Solo el técnico titular puede controlar estados de viaje
- El técnico de apoyo ve la Visita pero solo puede llenar/editar informes
- Visita pasa a COMPLETADA automáticamente cuando todas las OTs activas tienen informe

**US-4: Equipos sin ubicación no se pueden programar**
> Como sistema, debo exigir que `Equipo.ubicacion` esté poblado antes de poder incluir un equipo en una visita programada.

**Criterios de Aceptación:**
- Validación en `ModalProgramarVisita`: equipos con `ubicacion` vacía muestran alerta y no se pueden seleccionar
- Tooltip o mensaje indicando "Este equipo no tiene ubicación definida. Actualícelo antes de programar."

**US-5: Manejar OT no ejecutada en campo**
> Como Técnico, quiero poder marcar una OT como "No Ejecutada" con un motivo, cuando un equipo es inaccesible en sitio, para que la Visita no quede bloqueada.

**Criterios de Aceptación:**
- Nuevo estado `NO_EJECUTADA` en `OTStatus`
- Botón "No Ejecutada" disponible cuando OT está en `EN_SITIO` o `TRABAJO_EN_EJECUCION`
- Motivo obligatorio (campo de texto)
- OT en `NO_EJECUTADA` no bloquea la completación de la Visita
- Operaciones recibe notificación/ve la OT para reprogramarla

**US-6: OTs individuales (legacy/emergencias)**
> Como sistema, las OTs sin `visitaId` (creadas manualmente, emergencias, legacy) siguen funcionando con el flujo individual actual sin cambios.

**Criterios de Aceptación:**
- OTs con `visitaId = null` muestran botones de viaje directos (flujo actual)
- En TecnicoView se muestran al final como "OTs Individuales"
- No se rompe ninguna funcionalidad existente

**US-7: Visitas de diferentes contratos**
> Como Operaciones, quiero poder agrupar en una misma Visita OTs de diferentes contratos/adendas del mismo cliente, porque el técnico hace un solo viaje.

**Criterios de Aceptación:**
- La Visita NO tiene `contratoId` propio — es puramente logística
- Cada OT mantiene su `contratoId`/`adendaId` individual
- Diferentes contratos, misma ubicación/fecha/técnico = misma Visita

**US-8: Bloqueo de informes en revisión**
> Como sistema, los informes técnicos deben estar bloqueados (solo lectura) cuando la OT está en `EN_REVISION` o estados posteriores, hasta que el supervisor los devuelva.

**Criterios de Aceptación:**
- Informe en modo solo lectura cuando OT está en `EN_REVISION`, `APROBADA`, `FIRMADA`, `FACTURADA`, `CERRADA`
- Ni el titular ni el apoyo pueden editar
- Si el supervisor `OBSERVA`, la OT vuelve a `OBSERVADA` y el informe se desbloquea

---

## Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS 4, lucide-react, motion
- **Backend**: Node.js 20, Express 4, Prisma 7
- **Base de datos**: PostgreSQL 15 (AWS RDS)
- **Estado**: `useState` en `App.tsx` (sin Redux/Zustand)
- **Offline**: `localStorage` queue + `POST /api/sync`

## Commands

```bash
Build:     npm run build
Dev:       npm run dev
DB Push:   npx prisma db push
DB Validate: npx prisma validate
```

## Project Structure

```
prisma/schema.prisma           → Nuevo modelo Visita + campo visitaId en OT
src/types.ts                   → Nuevo enum VisitaStatus + interface Visita + campo en OT
server.ts                      → 4 endpoints nuevos + lógica cascada
src/App.tsx                    → State visitas + handlers + propagación
src/components/
  ├── TecnicoView.tsx          → Rediseño sidebar agrupado + botones por nivel
  ├── TechMonitoringDashboard.tsx → Tracking visitas
  ├── OrdenesTrabajoView.tsx   → Badge/columna visita asociada
  └── ot/
      └── ModalProgramarVisita.tsx → Crear Visita al programar + auto-agrupar
Documentacion/
  ├── data_dictionary.md       → Documentar modelo Visita
  └── architecture_c4.md       → Actualizar con nuevo modelo
```

## Code Style

Seguir las convenciones existentes del proyecto. Ejemplo de endpoint y cascada:

```typescript
// server.ts — PUT /api/visitas/:id (con cascada)
app.put('/api/visitas/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const visita = await prisma.visita.update({
      where: { id },
      data
    });

    // Cascada: si el estado cambió a EN_CAMINO o EN_SITIO, actualizar OTs hijas
    if (data.estado === VisitaStatus.EN_CAMINO || data.estado === VisitaStatus.EN_SITIO) {
      await prisma.oT.updateMany({
        where: { visitaId: id },
        data: {
          estado: data.estado,
          ...(data.estado === VisitaStatus.EN_CAMINO && { horaSalida: data.horaSalida }),
          ...(data.estado === VisitaStatus.EN_SITIO && { horaLlegadaSitio: data.horaLlegada })
        }
      });
    }

    res.json(visita);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando visita' });
  }
});
```

**Convenciones clave:**
- Prisma: snake_case para campos mapeados, camelCase para campos directos
- API: RESTful, JSON, sin versionado de URL
- Frontend: componentes funcionales con hooks, estado en `App.tsx`
- Notificaciones: `<ToastModal>` para éxito/error, `<ConfirmModal>` para acciones destructivas
- Sin `window.alert()` — nunca

## Testing Strategy

- **Verificación primaria**: `npm run build` (compilación TypeScript sin errores)
- **Verificación de schema**: `npx prisma validate`
- **Tests manuales**: Flujo completo programar → viaje → trabajo → informe por cada escenario

## Boundaries

### Always Do
- Crear Visita al programar OTs vía `ModalProgramarVisita`
- Validar `Equipo.ubicacion` antes de programar
- Cascada de estados de viaje (Visita → OTs hijas)
- Bloquear informes en `EN_REVISION` o posterior
- Mantener retrocompatibilidad con OTs sin `visitaId`
- Usar `<ToastModal>` / `<ConfirmModal>` para notificaciones
- Actualizar `data_dictionary.md` y `architecture_c4.md`
- Seguir tokens de diseño de `guia_ui_ux.md`

### Ask First
- Cambios al schema Prisma (modelo Visita, campo visitaId)
- Modificaciones a `POST /api/sync` (offline)
- Cambios al enum `OTStatus` (agregar `NO_EJECUTADA`)

### Never Do
- Romper el flujo individual de OTs legacy (sin visitaId)
- Usar `window.alert()` o `window.confirm()`
- Commitear directo a `dev` o `main`
- Eliminar funcionalidad existente del TecnicoView sin reemplazo

---

## Reglas de Negocio Consolidadas

| # | Regla |
|---|-------|
| R1 | Siempre se crea Visita, incluso con 1 OT |
| R2 | Clave de agrupación: `clientId + Equipo.ubicacion + fechaProgramada + tecnicoTitularId` |
| R3 | Auto-detección de visita existente con **sugerencia** al usuario (no forzado) |
| R4 | Diferentes técnicos titulares = visitas separadas |
| R5 | Diferentes tipos de servicio pueden estar en la misma visita |
| R6 | Diferentes contratos pueden estar en la misma visita |
| R7 | Solo se agregan OTs a visitas en estado `PROGRAMADA` |
| R8 | Cancelar OT la desvincula; si queda vacía, la visita se cancela |
| R9 | Reprogramar OT la mueve a otra visita (existente o nueva) |
| R10 | Solo el técnico titular controla estados de viaje de la Visita |
| R11 | Titular y apoyo pueden llenar informes |
| R12 | Informes bloqueados en `EN_REVISION` o posterior |
| R13 | Visita se completa automáticamente cuando todos los OTs activos tienen informe o son `NO_EJECUTADA` |
| R14 | OTs sin visita (`visitaId = null`) funcionan con flujo legacy individual |
| R15 | `Equipo.ubicacion` obligatorio antes de programar — equipos sin ubicación no seleccionables |

---

## Success Criteria

- [ ] **SC-1**: Modelo `Visita` existe en Prisma schema con todos los campos definidos
- [ ] **SC-2**: Campo `visitaId` existe en modelo `OT` (nullable)
- [ ] **SC-3**: `ModalProgramarVisita` crea 1 Visita + N OTs vinculadas al programar
- [ ] **SC-4**: Si existe Visita compatible al programar, el sistema sugiere agrupar
- [ ] **SC-5**: Equipos sin `ubicacion` no son seleccionables en el wizard de programación
- [ ] **SC-6**: TecnicoView muestra Visitas como cards con OTs anidadas
- [ ] **SC-7**: "Iniciar Ruta" en Visita → cascada EN_CAMINO a todas las OTs hijas
- [ ] **SC-8**: "Llegada al Sitio" en Visita → cascada EN_SITIO a todas las OTs hijas
- [ ] **SC-9**: Trabajo e informe se gestionan individualmente por OT
- [ ] **SC-10**: Visita pasa a COMPLETADA automáticamente al completar todos los OTs
- [ ] **SC-11**: OTs legacy (sin visitaId) siguen funcionando con flujo individual
- [ ] **SC-12**: `npm run build` compila sin errores

## Open Questions

Ninguna — todas las preguntas han sido resueltas con el usuario.
