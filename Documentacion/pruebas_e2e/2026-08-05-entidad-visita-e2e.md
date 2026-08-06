# Guion de Prueba E2E Automatizada: Entidad Visita (Agrupación por Viaje)

**Fecha:** 2026-08-05  
**Módulo:** Operaciones & Técnico (`Visita`, `OT`, `ModalProgramarVisita`, `TecnicoView`, `TechMonitoringDashboard`)  
**Objetivo:** Verificar de extremo a extremo que la creación, agrupación, traslado logístico y ejecución de trabajos por equipo mediante la entidad `Visita` funciona correctamente en local antes del merge a `dev`.

---

## Pre-requisitos de Entorno Local
1. Base de datos PostgreSQL local sincroniada (`npx prisma db push`).
2. Servidor backend en ejecución (`npm run dev` o `node server.ts`).
3. Datos de prueba: Cliente existente, 3 Equipos con `ubicacion` definida, 1 Técnico Titular (`Juan Córdova`).

---

## Flujos de Prueba E2E a Ejecutar

### Flujo 1: Programación Multi-Equipo y Auto-Agrupación (Operaciones)
1. **Paso 1.1**: Entrar como perfil Operaciones. Abrir `ModalProgramarVisita`.
2. **Paso 1.2**: Seleccionar Cliente X y seleccionar 3 equipos (EQ-001, EQ-002, EQ-003) con ubicación definida.
3. **Resultado Esperado**: El sistema crea 1 registro `Visita` (`VIS-YYYY-NNNN`) + 3 registros `OT` vinculados (`visitaId`).
4. **Paso 1.3**: Intentar programar un cuarto equipo (EQ-004) para el mismo cliente, fecha y técnico.
5. **Resultado Esperado**: El modal detecta la Visita existente y muestra la sugerencia de auto-agrupación. Al seleccionar "Agregar a existente", vincula EQ-004 a la misma Visita `VIS-YYYY-NNNN`.
6. **Paso 1.4**: Intentar seleccionar un equipo sin `ubicacion`.
7. **Resultado Esperado**: El equipo aparece deshabilitado con alerta "Sin Ubicación definida".

### Flujo 2: Logística del Viaje y Ejecución de Trabajos (Técnico de Campo)
1. **Paso 2.1**: Entrar como perfil Técnico (`Juan Córdova`).
2. **Resultado Esperado**: El sidebar de `TecnicoView` muestra la card `VIS-YYYY-NNNN` agrupadora con las 3 OTs anidadas y barra de avance (0/3).
3. **Paso 2.2**: Presionar el botón **"Iniciar Ruta (En Camino)"** en la Visita.
4. **Resultado Esperado**: Estado de la Visita pasa a `EN_CAMINO` y se propaga en cascada a las 3 OTs hijas. Se registra `horaSalida`.
5. **Paso 2.3**: Presionar el botón **"Llegada al Sitio (Registrar Entrada)"** en la Visita.
6. **Resultado Esperado**: Estado de la Visita pasa a `EN_SITIO` y se propaga en cascada a las 3 OTs hijas. Se registra `horaLlegada`.
7. **Paso 2.4**: Seleccionar OT-1 y presionar **"Iniciar Trabajo"**.
8. **Resultado Esperado**: Solo OT-1 pasa a `TRABAJO_EN_EJECUCION`. La Visita pasa a `EN_EJECUCION` automáticamente.
9. **Paso 2.5**: Completar y enviar el informe técnico de OT-1.
10. **Resultado Esperado**: OT-1 pasa a `EN_REVISION`. El avance de la Visita se actualiza a (1/3 equipos).
11. **Paso 2.6**: Para OT-2, presionar "No Ejecutada" e ingresar motivo "Equipo sin acceso".
12. **Resultado Esperado**: OT-2 pasa a `NO_EJECUTADA`.
13. **Paso 2.7**: Completar y enviar el informe técnico de OT-3.
14. **Resultado Esperado**: OT-3 pasa a `EN_REVISION`. Como todos los OTs están completos o no ejecutados, la Visita pasa **automáticamente a COMPLETADA**.

### Flujo 3: Bloqueo de Informes y Control de Roles
1. **Paso 3.1**: Intentar abrir el informe de OT-1 estando en `EN_REVISION`.
2. **Resultado Esperado**: El informe abre en modo Solo Lectura (sin capacidad de edición ni guardado).
3. **Paso 3.2**: Entrar como Técnico de Apoyo (`Pedro Alva`).
4. **Resultado Esperado**: Visualiza la Visita y las OTs, puede editar el informe de OT pendiente, pero **no tiene botones de Iniciar Ruta ni Llegada al Sitio**.

---

## Criterios de Aceptación E2E para Aprobar Merge a `dev`
- [x] Pruebas de integración API/BD ejecutadas limpiamente (`/api/visitas` CRUD + cascada de estados).
- [x] Pruebas E2E de interfaz de usuario en navegador ejecutadas con **Playwright** (`npx playwright test`).
- [x] La compilación TypeScript (`npm run build`) pasa limpiamente.
- [x] La validación Prisma (`npx prisma validate`) y migración DB (`npx prisma db push`) son correctas.

---

## Ejecución de Pruebas Automatizadas con Playwright

**Comando de Ejecución:**
```bash
npm run test:playwright
# o directamente:
npx playwright test tests/visitas-workflow.spec.ts --reporter=list
```

**Archivo de Especificación Playwright:** [`tests/visitas-workflow.spec.ts`](file:///c:/Informes%20Mafort%20IA/tests/visitas-workflow.spec.ts)

