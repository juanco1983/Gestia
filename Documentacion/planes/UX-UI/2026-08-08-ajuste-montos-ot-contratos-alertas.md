# Plan de Trabajo: Ajuste de Montos en Gestión de OT, Presupuesto de Contratos y Alertas

**Fecha:** 2026-08-08  
**Tipo:** UX-UI / Feature / Finanzas  
**Rama:** `feature/ajuste-montos-ot-contratos`  
**Estado:** `COMPLETED`  

---

## 1. Contexto y Objetivos

El usuario reportó inconsistencias y falta de claridad en los montos exhibidos dentro del módulo de Gestión de Órdenes de Trabajo (OT) y su relación con los Contratos Comerciales y Adendas:
1. La tabla principal de cuotas no diferenciaba con claridad el monto neto (sin IGV) del total con IGV, lo que causaba confusión al comparar con lo facturado.
2. Al ver/editar una cuota, no se visualizaba el estado global del contrato vigente (Monto Base + Adendas) ni el saldo remanente disponible.
3. El panel de alertas financieras generaba advertencias basadas en un "OT Marco" estático en lugar de auditar el presupuesto consolidado del Contrato Comercial y sus Adendas vinculadas.
4. Existían etiquetas visuales redundantes en la tabla (como repetición del nombre del cliente y badges operacionales en la columna de OT Line).
5. Se corrigió el error de apertura y visualización de contratos digitalizados (`/api/contracts/files/*`) asegurando compatibilidad con S3 en AWS y pre-signed URLs.

---

## 2. Alcance de las Modificaciones

| Componente | Archivo | Modificación |
|---|---|---|
| **Tabla de OTs** | `src/components/ot/TablaOrdenesTrabajo.tsx` | - Columna `Monto Cuota (Sin IGV)` y `Total (Con IGV)`.<br>- Deduplicación de Razón Social y Empresa.<br>- Eliminación de etiqueta redundante `Marco: #...`.<br>- Tarjetas de KPI superiores calculadas con IGV. |
| **Modal Detalle/Edición** | `src/components/ot/ModalEditarLinea.tsx` | - Panel de Presupuesto del Contrato: `Base` + `Suma Adendas` = `Total Vigente` (Sin y Con IGV).<br>- Barra de progreso con % de consumo y Saldo Disponible.<br>- Desglose de cuota actual vs. otras cuotas. |
| **Panel de Alertas** | `src/components/ot/PanelAlertas.tsx` | - Principio de Gestión por Excepción: solo alerta contratos con exceso o consumo \(\ge 85\%\).<br>- Panel colapsable/expandible.<br>- Si 100 contratos están en orden, el panel se oculta para no estorbar. |
| **Vista Principal OT** | `src/components/OrdenesTrabajoView.tsx` | - Cálculo de auditoría de contratos (`contractWarnings`).<br>- Pase de `contratosComerciales` y `tipoCambio` a submódulos. |
| **Servidor y Archivos** | `server.ts` | - Decodificación de URI para URLs seguras de contratos en S3 / uploads.<br>- Eliminación de rutas duplicadas. |
| **Contratos View** | `src/components/ClientesContratosView.tsx` | - Manejo robusto de URLs de visualización de PDFs (Base64, S3, Blob, Uploads). |

---

## 3. Criterios de Aceptación

- [x] Monto de cuota visible en neto (sin IGV) y total con 18% IGV claramente identificado.
- [x] Detalle de cuota calcula consumo acumulado del contrato y muestra saldo disponible en tiempo real.
- [x] Panel de alertas no satura con 100 contratos; solo lista contratos con incidencias presupuestales reales.
- [x] Los contratos digitalizados se visualizan sin error `400 Formato de archivo o ruta inválidos`.
- [x] 0 errores de TypeScript (`tsc --noEmit`).

---

## 4. Desglose de Tareas

- [x] `completed` Homologación de cálculo `Monto Base + Adendas` = `Total Contrato Vigente`.
- [x] `completed` Actualización de columnas de tabla y tarjetas de estadísticas en `TablaOrdenesTrabajo.tsx`.
- [x] `completed` Rediseño del panel financiero de `ModalEditarLinea.tsx`.
- [x] `completed` Filtrado por excepción y colapsado en `PanelAlertas.tsx`.
- [x] `completed` Corrección de decodificación de rutas de archivos en `server.ts` y `ClientesContratosView.tsx`.
- [x] `completed` Verificación de tipos TypeScript y pruebas locales.
