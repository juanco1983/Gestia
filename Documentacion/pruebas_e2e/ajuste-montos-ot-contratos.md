# Guion de Pruebas de Integración y E2E: Montos de OT y Contratos

**Fecha:** 2026-08-08  
**Rama:** `feature/ajuste-montos-ot-contratos`  
**Objetivo:** Validar la visualización y consistencia de montos sin/con IGV, cálculo del presupuesto vigente del contrato y apertura de documentos PDF.

---

## 1. Escenarios de Prueba

### Escenario 1: Visualización de Cuotas en la Tabla de OTs
1. Navegar a **Gestión de OTs**.
2. **Verificar:**
   - La columna **"Monto Cuota"** indica claramente `(Sin IGV)` y muestra el sub importe neto (ej: `$2,500.00`).
   - La columna **"Total"** indica claramente `(Con IGV)` y muestra el valor con 18% IGV (ej: `$2,950.00`).
   - La columna **OT Line** muestra únicamente el código de la cuota (ej: `OM-CO-001-1`), sin la etiqueta `Marco: #90001` ni `Técnica: Informe Aprobado`.
   - La columna **Razón Social** no duplica el nombre del cliente si es idéntico al de la empresa.

### Escenario 2: Panel de Control Presupuestal en el Modal de Edición
1. En cualquier cuota, hacer clic en el botón **"Editar"** o **"Ver"**.
2. **Verificar:**
   - Aparece el panel superior de **Control de Presupuesto del Contrato**.
   - Se detalla:
     - `Contrato Base (sin IGV)`
     - `Suma Adendas (sin IGV)`
     - `Total Contrato Vigente (sin IGV / con IGV)`
   - Se renderiza la barra de progreso con el porcentaje real consumido y el **Saldo Disponible**.
   - Se visualiza el desglose de: `Esta cuota (sin IGV)` | `Esta cuota (con IGV)` | `Otras cuotas`.

### Escenario 3: Principio de Excepción en el Panel de Alertas
1. Con contratos normales y dentro de presupuesto:
   - **Verificar:** El panel de alertas no lista los 100 contratos normales; se mantiene limpio o sólo lista los que tengan excesos reales o consumo \(\ge 85\%\).
   - El botón **Contraer / Expandir** funciona correctamente.

### Escenario 4: Visualización de Contratos Digitalizados (PDF)
1. Ir al módulo **Clientes y Contratos** y seleccionar un contrato.
2. Hacer clic en **"Ver Contrato Digitalizado (PDF)"**.
3. **Verificar:** No emite error `400 Formato de archivo o ruta inválidos`, abriendo el visor de PDF correctamente tanto con S3 como en almacenamiento local.

---

## 2. Resultados de Ejecución

| Escenario | Tipo | Resultado |
|---|---|---|
| Escenario 1 | Visual / UI | **APROBADO** |
| Escenario 2 | Lógica Financiera | **APROBADO** |
| Escenario 3 | Excepción y Alertas | **APROBADO** |
| Escenario 4 | API / S3 / Backend | **APROBADO** |
