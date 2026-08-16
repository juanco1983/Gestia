# Plan de Trabajo: Visor Lightbox de Evidencias en Módulo de Supervisor

**Fecha:** 2026-08-16  
**Categoría:** `features`  
**Estado:** `inProgress`  
**Mockup Asociado:** [`Documentacion/mockups/2026-08-16-supervisor-visor-fotos.html`](file:///c:/Informes%20Mafort%20IA/Documentacion/mockups/2026-08-16-supervisor-visor-fotos.html)  

---

## 1. Contexto y Problema

En el módulo **Supervisor → Panel de Revisión de Calidad** (`SupervisorView.tsx`), la sección **`REGISTRO FOTOGRÁFICO DE CONFORMIDAD`** muestra las miniaturas estáticas de las evidencias de campo.

El usuario ha solicitado implementar el **Visor Lightbox Modal de Foto Ampliada** en esta vista para que el supervisor pueda hacer clic en cualquier miniatura y ver la evidencia fotográfica en alta resolución antes de aprobar o solicitar correcciones.

---

## 2. Propuesta de Solución

1. **Integración de Visor Lightbox en `SupervisorView.tsx`:**
   - Asignar evento `onClick` a cada tarjeta de miniatura de la cuadrícula `REGISTRO FOTOGRÁFICO DE CONFORMIDAD`.
   - Al hacer clic, activar el estado `previewSupervisorPhoto` almacenando la URL en alta definición y el título del rótulo fotográfico.

2. **Modal Lightbox de Pantalla Completa:**
   - Renderizar el modal oscuro translúcido con visor centrado, título de la fotografía y botón de cierre `✕` o tecla `Esc`.

---

## 3. Criterios de Aceptación
- [ ] Hacer clic en cualquier foto de la sección *Registro Fotográfico de Conformidad* del Supervisor abre el modal con la imagen ampliada.
- [ ] Mantiene el 100% de las pruebas E2E de Playwright y compilación `npm run build`.
