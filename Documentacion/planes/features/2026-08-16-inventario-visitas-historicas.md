# Plan de Trabajo: Corrección de Contador de Visitas Históricas en Inventario de Equipos

**Fecha:** 2026-08-16  
**Categoría:** `features`  
**Estado:** `inProgress`  
**Mockup Asociado:** [`Documentacion/mockups/2026-08-16-inventario-visitas-historicas.html`](file:///c:/Informes%20Mafort%20IA/Documentacion/mockups/2026-08-16-inventario-visitas-historicas.html)  

---

## 1. Contexto y Problema

En el panel lateral de detalle de un equipo (`InventarioEquipoDrawer.tsx`), la tarjeta **Visitas Históricas** siempre mostraba `(0)` y `"Sin visitas registradas"`, incluso cuando el equipo ya contaba con informes técnicos emitidos u Órdenes de Trabajo atendidas. 

El cálculo previo en `server.ts` intentaba acceder a la propiedad inoficial `eq.servicios` que siempre evaluaba a `undefined`, ocasionando que el contador resultara en `0`.

---

## 2. Propuesta de Solución

1. **Cálculo Backend (`server.ts`):**
   - Calcular `visitasHistoricasCount` sumando el número de informes técnicos emitidos asociados al equipo (`eqReportsSorted.length`) y las Órdenes de Trabajo atendidas de dicho equipo.
   - `visitasHistoricasCount = Math.max(historicalOtsCount, eqReportsSorted.length);`

2. **Interfaz de Usuario (`InventarioEquipoDrawer.tsx`):**
   - Renderizar la tarjeta **Visitas Históricas (N)** con el conteo real de servicios realizados.
   - Mostrar una insignia o detalle con el resumen de informes técnicos y visitas acumuladas.

---

## 3. Criterios de Aceptación
- [ ] La tarjeta de **Visitas Históricas** refleja exactamente la suma de informes técnicos y OTs atendidas para ese equipo.
- [ ] Si el equipo tiene al menos 1 informe o servicio, el contador muestra `(1)` o superior y detalla la cantidad de servicios realizados.
- [ ] Se mantienen las pruebas E2E y compilación `npm run build` al 100%.
