# Plan de Trabajo: Redirección Directa a Incidencias y Corrección de Criterio de Fallas en Ranking

**Fecha:** 2026-08-16  
**Categoría:** `features`  
**Estado:** `inProgress`  
**Mockup Asociado:** [`Documentacion/mockups/2026-08-16-ranking-fallas-redireccion-y-criterio.html`](file:///c:/Informes%20Mafort%20IA/Documentacion/mockups/2026-08-16-ranking-fallas-redireccion-y-criterio.html)  

---

## 1. Contexto y Problema

El usuario realizó dos consultas sobre el cuadro **Ranking de Equipos con Incidencias (Top 5)**:
1. **Falsos Positivos de Fallas:** El cuadro contabilizaba como "falla" cualquier texto en `observacionesDiagnostico` (incluso cuando la nota decía *"El equipo se encontró en óptimo estado de operación"*).
2. **Redirección Interactiva a las Incidencias:** El usuario desea hacer clic en cualquier equipo de la lista para ir directamente a la ficha del equipo/informes técnicos y revisar exactamente las fallas reportadas.

---

## 2. Propuesta de Solución

1. **Refinamiento del Criterio de Falla (`RankingEquiposFallas.tsx`):**
   - Clasificar como **falla real** únicamente cuando el informe indique anomalías: `bypassActivo = true`, `paso1_funcionamiento === 'bypass'`, palabras clave de diagnóstico como *falla, reemplazo, crítico, avería, ruido, sobrecalentamiento, sulfatado, desgastado, descalibrado, anomalía, reparar* o cuando el estado de la OT sea `OBSERVADA`.
   - Excluir notas neutras/positivas como *"óptimo estado"*, *"sin anomalías"*, *"operación normal"*.

2. **Redirección Interactiva ("Ver Incidencias →"):**
   - Convertir cada tarjeta del Ranking en un elemento cliqueable que invoque `onNavigateToTab('InventarioEquipos')` o `onNavigateToTab('Monitoreo')` enviando el filtro o abriendo el detalle del equipo.

---

## 3. Criterios de Aceptación
- [ ] Hacer clic en cualquier equipo del Ranking redirige al usuario a la vista de Inventario o Centro de Operaciones para inspeccionar las incidencias.
- [ ] No contabilizar como fallas los informes con observaciones neutras o de óptimo funcionamiento.
- [ ] Mantiene el 100% de la suite de pruebas E2E y compilación `npm run build`.
