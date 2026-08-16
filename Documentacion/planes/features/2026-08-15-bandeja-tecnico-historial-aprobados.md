# Plan de Trabajo: Separación de Bandeja de Trabajo y Historial de Informes Aprobados para el Técnico

**Fecha:** 2026-08-15  
**Categoría:** `features`  
**Estado:** `inProgress`  
**Mockup Asociado:** [`Documentacion/mockups/2026-08-15-bandeja-tecnico-historial.html`](file:///c:/Informes%20Mafort%20IA/Documentacion/mockups/2026-08-15-bandeja-tecnico-historial.html)  

---

## 1. Contexto y Problema

Actualmente en el portal del técnico (`TecnicoView.tsx`), la bandeja lateral de órdenes de trabajo agrupa todas las asignaciones sin distinguir si una orden ya fue aprobada por el supervisor. Esto genera dos inconvenientes:
1. **Saturación visual:** Las OTs con estado `Aprobada` permanecen en la lista diaria junto a las pendientes, abotagando el área de trabajo.
2. **Falta de historial estructurado:** El técnico no cuenta con una sección dedicada para consultar sus propios informes aprobados históricos.

---

## 2. Propuesta de Solución (Nivel UX/UI)

Implementar una navegación por pestañas (*Tabs*) en la barra lateral del portal del técnico:

1. **Pestaña "Pendientes de Atención" (Predeterminada):**
   - Muestra únicamente las Órdenes de Trabajo activas que requieren acción del técnico (`PROGRAMADO`, `EN_CAMINO`, `EN_SITIO`, `TRABAJO_EN_EJECUCION`, `EN_REVISION`, `INFORME_ENVIADO`).
   - Cuando el supervisor aprueba un informe (`OTStatus.APROBADA`), la orden desaparece automáticamente de esta bandeja activa.

2. **Pestaña "Historial de Aprobados" (Informes Finalizados):**
   - Muestra la lista de órdenes finalizadas y aprobadas asignadas al técnico.
   - Incluye un buscador rápido por código OT o Cliente.
   - Permite al técnico seleccionar cualquier informe aprobado para consultar su resumen técnico, visualizar el registro fotográfico cargado en S3 y previsualizar/descargar el informe en PDF.

---

## 3. Criterios de Aceptación
- [ ] La bandeja principal solo muestra OTs pendientes o en proceso.
- [ ] Las OTs en estado `APROBADA`, `FIRMADA`, `FACTURADA` o `CERRADA` se trasladan a la pestaña de "Historial de Aprobados".
- [ ] Al seleccionar una OT del Historial, el técnico puede visualizar el informe completo en modo lectura.
- [ ] El contador de insignias (*badges*) en cada pestaña refleja en tiempo real el número de ítems.
- [ ] El diseño cumple 100% con los tokens del Dashboard y `guia_ui_ux.md`.
