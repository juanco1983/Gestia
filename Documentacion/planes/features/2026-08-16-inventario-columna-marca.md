# Plan de Trabajo: Columna Marca en el Módulo de Inventario de Equipos

**Fecha:** 2026-08-16  
**Categoría:** `features`  
**Estado:** `inProgress`  
**Mockup Asociado:** [`Documentacion/mockups/2026-08-16-inventario-columna-marca.html`](file:///c:/Informes%20Mafort%20IA/Documentacion/mockups/2026-08-16-inventario-columna-marca.html)  

---

## 1. Contexto y Problema

Actualmente en el módulo de Inventario de Equipos (`InventarioEquiposView.tsx`), la marca y el modelo del equipo se mostraban concatenados en una sola columna. Esto dificultaba la lectura clara de la marca del fabricante (ej. APC, FORTMAN, TRIPPLITE) y no permitía visualizarla de manera dedicada en la tabla principal.

---

## 2. Propuesta de Solución (Nivel UX/UI)

1. **Nueva Columna "Marca":**
   - Insertar la columna `<th className="text-left px-4 py-3">Marca</th>` entre el Código y el Modelo.
   - Mostrar la marca del equipo (ej. APC, Eaton, Fortman) con tipografía destacada en tono `text-slate-700 font-semibold`.
   - Si un equipo carece de marca registrada, se mostrará el marcador `–`.

2. **Columnas de la Tabla Principal de Inventario:**
   - `Código` | **`Marca`** *(NUEVA)* | `Modelo` | `Serie` | `Voltaje Últ. Info.` | `Empresa` | `Estado` | `Informes` | `Acción`

---

## 3. Criterios de Aceptación
- [ ] La tabla de Inventario de Equipos muestra la columna "Marca" de forma independiente.
- [ ] Se mantiene la armonía estética del Dashboard y tokens de `guia_ui_ux.md`.
- [ ] Mantiene compatibilidad con la búsqueda por texto y paginación.
