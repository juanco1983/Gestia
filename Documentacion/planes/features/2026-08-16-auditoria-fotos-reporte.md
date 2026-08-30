# Plan de Trabajo: Corrección de Visualización de Evidencias Fotográficas en Panel de Auditoría

**Fecha:** 2026-08-16  
**Categoría:** `features`  
**Estado:** ⏸️ **PENDIENTE** — Requiere ambientes AWS (EB dev/qa) encendidos para validación E2E y mockup. Retomar cuando infra disponible.  
**Mockup Asociado:** [`Documentacion/mockups/2026-08-16-auditoria-fotos-reporte.html`](file:///c:/Informes%20Mafort%20IA/Documentacion/mockups/2026-08-16-inventario-columna-marca.html)  

---

## 1. Contexto y Problema

En el módulo **Operaciones → Centro de Operaciones → Todos los Informes → Opción Auditar (Panel de Auditoría)** en `TechMonitoringDashboard.tsx`, la vista de *Evidencias Fotográficas* intentaba renderizar las fotos pasando la expresión `src={pic.url || pic}`.

Dado que cada elemento de `fotosLabeled` es un objeto `{ slotName, base64, description }` o requiere la ruta S3 `/api/photos/${cleanOtId}/${slotIdx}`, la propiedad `src` evaluaba a `"[object Object]"`, rompiendo la carga de las imágenes y mostrando iconos de imagen rota.

---

## 2. Propuesta de Solución

1. **Función Resolutora de URLs `getPhotoSrc(pic, otId, idx)`:**
   - Evaluar si `pic` incluye `base64`, `url` o es una cadena.
   - En caso de requerir el recurso desde S3 / backend, construir la URL canónica del endpoint `/api/photos/${cleanOtId}/${idx + 1}`.
   - Soportar alternativamente el arreglo legacy `report.fotos` si `fotosLabeled` está ausente.

2. **Modal / Vista Previa Interactiva de la Evidencia:**
   - Permitir hacer clic en cualquier miniatura de la auditoría para abrir la imagen ampliada en un modal lightbox.

---

## 3. Criterios de Aceptación
- [ ] Las miniaturas de las 18 evidencias fotográficas se muestran nítidamente en el Panel de Auditoría sin iconos de imagen rota.
- [ ] Se soporta la carga tanto desde base64 directo como desde el proxy S3 `/api/photos/...`.
- [ ] Mantiene el 100% de la suite de pruebas E2E y compilación `npm run build`.
