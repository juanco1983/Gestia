# Plan de Trabajo: Columna Estado de Contrato (Vigente / Vencido) en Inventario de Equipos

**Fecha:** 2026-08-16  
**Categoría:** `features`  
**Estado:** `inProgress`  
**Mockup Asociado:** [`Documentacion/mockups/2026-08-16-inventario-columna-contrato-vigente.html`](file:///c:/Informes%20Mafort%20IA/Documentacion/mockups/2026-08-16-inventario-columna-contrato-vigente.html)  

---

## 1. Contexto y Problema

El usuario ha solicitado agregar una columna dedicada en el módulo de Inventario de Equipos (`InventarioEquiposView.tsx`) para identificar rápidamente el **Estado del Contrato** de cada equipo (Vigente vs Vencido / Sin Contrato).

---

## 2. Propuesta de Solución

1. **Lógica de Estado de Contrato:**
   - Si el equipo tiene contrato asociado (`eq.contrato`):
     - Si `fechaFin` es mayor o igual a la fecha actual (`hoy`): **`Vigente`** (Badge verde `bg-emerald-50 text-emerald-700`).
     - Si `fechaFin` es menor a la fecha actual: **`Vencido`** (Badge rojo `bg-rose-50 text-rose-700`).
     - Si no especifica fechas pero tiene contrato: **`Vigente`**.
   - Si el equipo no tiene contrato asociado: **`Sin Contrato`** (Badge gris `bg-slate-50 text-slate-500`).

2. **Ubicación en la Tabla:**
   - `Código` | `Marca` | `Modelo` | `Serie` | **`Contrato`** *(NUEVA COLUMNA)* | `Voltaje Últ. Info.` | `Empresa` | `Estado` | `Informes` | `Acción`

---

## 3. Criterios de Aceptación
- [ ] La columna "Contrato" aparece en la tabla principal de inventario.
- [ ] Cada equipo exhibe su badge visual correspondiente (`Vigente`, `Vencido` o `Sin Contrato`).
- [ ] Mantiene el 100% de los tests E2E de Playwright pasando y compilación limpia con `npm run build`.
