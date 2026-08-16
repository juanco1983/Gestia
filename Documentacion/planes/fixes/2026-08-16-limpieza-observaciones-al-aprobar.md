# Plan de Trabajo: Limpieza de Observaciones de Supervisor al Aprobar Informe

**Fecha:** 2026-08-16  
**Categoría:** `fixes`  
**Estado:** `inProgress`  
**Mockup Asociado:** [`Documentacion/mockups/2026-08-16-limpieza-observaciones-al-aprobar.html`](file:///c:/Informes%20Mafort%20IA/Documentacion/mockups/2026-08-16-limpieza-observaciones-al-aprobar.html)  

---

## 1. Contexto y Problema

El usuario consultó: *"¿por qué cuando el informe ya es aprobado por el supervisor sigue saliendo igual observado?"*.

Al inspeccionar el flujo:
- Cuando una OT o Informe era rechazado por el supervisor, se registraba la cadena de correcciones en `report.correccionesSupervisor`.
- Si posteriormente el técnico corregía el informe y el **Supervisor hacía clic en "Aprobar Informe"**, la OT cambiaba a estado `Aprobada`, pero **la propiedad `correccionesSupervisor` no se limpiaba en el objeto del informe ni en la base de datos Postgres**.
- Como consecuencia, el informe aprobado conservaba el texto residual de la observación anterior en el Panel de Auditoría y paneles informativos.

---

## 2. Propuesta de Solución

1. **`SupervisorView.tsx` (`handleApproveReport`):**
   - Al aprobar el informe, invocar `onUpdateReport` reseteando `correccionesSupervisor: ''` (limpieza explícita del campo).

2. **`server.ts` (`PUT /api/ots/:id`):**
   - Al recibir la actualización del estado a `Aprobada`, `Firmada` o `Conformidad Firmada`, ejecutar una actualización en cascada para limpiar `correccionesSupervisor = ""` en la tabla `technicalReport` de Prisma/Postgres.

---

## 3. Criterios de Aceptación
- [ ] Al aprobar un informe en el módulo de Supervisor, se actualiza el estado a `Aprobada` y se borran de inmediato las notas de observación anteriores.
- [ ] Mantiene el 100% de la suite de pruebas E2E y compilación `npm run build`.
