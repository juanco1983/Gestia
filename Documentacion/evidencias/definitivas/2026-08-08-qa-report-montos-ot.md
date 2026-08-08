# QA Report: Montos de OT, Presupuesto de Contratos y Alertas

**Fecha:** 2026-08-08  
**Rama:** `feature/ajuste-montos-ot-contratos`  
**Skill:** `qa-engineer`  
**Estado:** **APPROVED**  

---

## 1. Archivos Afectados

- `src/components/ot/TablaOrdenesTrabajo.tsx`
- `src/components/ot/ModalEditarLinea.tsx`
- `src/components/ot/PanelAlertas.tsx`
- `src/components/OrdenesTrabajoView.tsx`
- `src/components/ClientesContratosView.tsx`
- `server.ts`

---

## 2. Pruebas Ejecutadas

| Nivel | Prueba | Resultado |
|---|---|---|
| **Lint / TypeCheck** | `npx tsc --noEmit` | **0 errores** (Passed) |
| **Producción Bundle** | `npm run build` (Vite + esbuild) | **Éxito (0 errores)** |
| **Integración / API** | Rutas `/api/contracts/files/*` con decode y S3/local | **Passed** |
| **Lógica Financiera** | Cálculo `Base + Adendas = Total Vigente`, consumo y saldo | **Passed** |
| **UI / Visual** | Limpieza de etiquetas, deduplicación de empresa, columnas sin/con IGV | **Passed** |

---

## 3. Cobertura

- **Cubierto:**
  - Montos sin y con IGV en tabla y estadísticas de OTs.
  - Cálculo consolidado de Contrato + Adendas.
  - Alertas por excepción (solo anomalías reales).
  - Apertura de PDFs sin fallos de regex en backend.
- **Riesgos:** Ninguno. Sin dependencias externas ni cambios en schema de Prisma.

---

## 4. Dictamen Final

**Status:** **APPROVED**  
Listo para commit y push al repositorio remoto.
