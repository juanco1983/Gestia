# Especificación y Análisis Funcional: Flujo E2E Completo de la Aplicación (Gestia IA)

## 📌 1. Objetivo
Garantizar el funcionamiento perfecto de la aplicación mediante la ejecución automatizada en el navegador (Playwright Chromium) de **un único flujo de negocio completo y realista de extremo a extremo**: desde la creación del cliente y contrato con país/ubicación y equipo asignado (`1 eq.`), pasando por la ejecución técnica en campo, llenado completo del informe, revisión/aprobación por el supervisor, hasta la facturación y cierre en Gestión de OTs.

---

## 🏢 2. Datos Unificados de Prueba (Entidad Única)

| Entidad | Valor de Prueba | Razón / Regla de Negocio |
|---|---|---|
| **Cliente** | `REPSOL DATA CENTER PERÚ S.A.C.` | Cliente corporativo único. |
| **RUC** | `20100123456` | RUC válido de 11 dígitos. |
| **País / Provincia / Distrito** | `Perú` / `Lima` / `San Isidro` | **Selección obligatoria de País** según directiva de usuario. |
| **Dirección Sede** | `Av. Rivera Navarrete 501, San Isidro` | Dirección con sede física. |
| **Contacto** | `Ing. Carlos Ramos` (`cramos@repsol.pe`, `987654321`) | Contacto principal. |
| **Contrato** | `Contrato Marco de Mantenimiento UPS 2026` | Contrato vinculado al cliente único. |
| **Monto / Servicio** | `$ 15,000 USD` / Mantenimiento Preventivo | Alcance financiero. |
| **Equipo Asignado** | Código: `EQ-UPS-001` • Tipo: `UPS` • Marca: `APC Schneider` • Modelo: `Symmetra PX 80KVA` • Serie: `SN-APC-80K-2026` • Potencia: `80 kVA` • Ubicación: `Piso 4 - Centro de Cómputo (Gabinete A-01)` | **Equipo asignado al contrato** (`1 eq.` en tarjeta). Ubicación física obligatoria (US-4). |
| **Visita Agrupadora** | Correlativo `VIS-2026-XXXX` | Agrupa el equipo en el viaje. |
| **Técnico Titular** | `Juan Córdova` (`juan.cordova@materiagris.pe`) | Ejecutor en campo. |
| **Supervisor** | `Supervisor General` (`supervisor@mafort.pe`) | Aprobador del informe. |
| **Factura Comercial** | `F001-00045890` (Monto: `$ 3,750.00 USD`) | Registro final en Gestión de OTs. |

---

## 🔄 3. Desglose Detallado del Flujo E2E Extremo a Extremo en Navegador Chromium

```mermaid
flowchart TD
    A[1. Admin: Registrar Cliente con País/Distrito] --> B[2. Admin: Crear Contrato Marco]
    B --> C[3. Admin: Asignar Equipo al Contrato (1 eq.)]
    C --> D[4. Admin: Programar Visita & OT en Operaciones]
    D --> E[5. Técnico: Traslado Logístico - En Camino / En Sitio]
    E --> F[6. Técnico: Llenar Informe Completo & Enviar a Revisión]
    F --> G[7. Supervisor: Revisar y Aprobar Informe Técnico]
    G --> H[8. Ventas/Admin: Gestión de OTs - Colocar Monto y N° Factura]
    H --> I[9. Proceso Completo Aprobado y Cerrado]
```

---

### 🔴 PASO 1: Registro del Cliente Único con País (Módulo Comercial)
1. Inicio de sesión como Administrador (`admin@mafort.pe`).
2. Navegación al módulo **`Comercial`** (`Clientes & Contratos`).
3. Clic en **`Registrar Cliente`**.
4. Llenado del formulario:
   - Razón Social: `REPSOL DATA CENTER PERÚ S.A.C.`
   - RUC: `20100123456`
   - **País**: Seleccionar `Perú`
   - **Provincia**: Seleccionar `Lima`
   - **Distrito**: Seleccionar `San Isidro`
   - Dirección: `Av. Rivera Navarrete 501`
   - Contacto: `Ing. Carlos Ramos` (`cramos@repsol.pe`, `987654321`)
5. Clic en **`Guardar Cliente`**.
6. **Criterio de Aceptación**: El cliente queda registrado en la base de datos Postgres con su país/distrito y código `CLI-2026-XXXX`.

---

### 🟢 PASO 2: Registro del Contrato Marco (Módulo Comercial)
1. En la vista Comercial, clic en la pestaña **`Contratos Activos`**.
2. Clic en el botón **`Registrar Contrato`**.
3. En el desplegable `Seleccionar Cliente`, elegir `REPSOL DATA CENTER PERÚ S.A.C.`.
4. Seleccionar Tipo de Contrato (Mantenimiento Preventivo), Descripción, Monto `$15,000 USD`, Fechas vigentes y Responsable Comercial.
5. Clic en **`Guardar Contrato`**.
6. **Criterio de Aceptación**: Se crea el contrato `#CN-CO-XXXX` vinculado al cliente.

---

### 🟡 PASO 3: Asignación de Equipo al Contrato (`1 eq.`) (Módulo Comercial)
1. En la lista de Contratos Activos, abrir el detalle o hacer clic en **`Asignar Equipo`** (`+ Añadir Equipo`).
2. Registrar/Asociar el equipo `EQ-UPS-001`:
   - Código: `EQ-UPS-001`
   - Tipo: `UPS`
   - Marca: `APC Schneider`
   - Modelo: `Symmetra PX 80KVA`
   - Serie: `SN-APC-80K-2026`
   - Potencia: `80 kVA`
   - **Ubicación Física**: `Piso 4 - Centro de Cómputo (Gabinete A-01)`
3. Clic en **`Guardar Equipo`**.
4. **Criterio de Aceptación**: El contador de la tarjeta del contrato en la UI se actualiza de `0 eq.` a **`1 eq.`**.

---

### 🔵 PASO 4: Programación de Visita y OTs (Módulo Operaciones)
1. Navegar al módulo **`Operaciones`** (`Monitoreo Operativo`).
2. En la tarjeta del contrato (que muestra **`1 eq.`**), hacer clic en el botón **`PROGRAMAR`**.
3. Se despliega el **`ModalProgramarVisita`** (5 pasos):
   - **Paso 1**: Selección de contrato.
   - **Paso 2**: Checklist de equipos. Verificar que `EQ-UPS-001` muestra su ubicación `Piso 4 - Centro de Cómputo` y seleccionarlo.
   - **Paso 3**: Fecha y hora programada (`08:30`).
   - **Paso 4**: Asignar Técnico Titular (`Juan Córdova`).
   - **Paso 5**: Clic en **`Generar Órdenes y Programar`**.
4. **Criterio de Aceptación**: Se genera la Visita `VIS-2026-XXXX` agrupando la OT correspondiente.

---

### 🟠 PASO 5: Ejecución Logística del Viaje (Portal del Técnico)
1. Inicio de sesión como Técnico Titular (`juan.cordova@materiagris.pe`).
2. En el portal del Técnico, seleccionar la tarjeta de Visita `VIS-2026-XXXX`.
3. Clic en **`Iniciar Ruta (En Camino)`** -> Estado de Visita y OT pasa a `En Camino`.
4. Clic en **`Llegada al Sitio (Registrar Entrada)`** -> Estado de Visita y OT pasa a `En Sitio`.
5. **Criterio de Aceptación**: Tiempos de traslado registrados en BD.

---

### 🟣 PASO 6: Llenado COMPLETO del Informe Técnico y Envío al Supervisor
1. El técnico selecciona la OT de `EQ-UPS-001` y hace clic en **`Iniciar Trabajo`**.
2. **Llena el Informe Técnico de forma completa**:
   - **Datos Generales**: Placa, marca, modelo, serie, potencia `80 kVA`, ubicación.
   - **Mediciones Eléctricas**: Voltaje Entrada L1-L2-L3 (380V/220V), Frecuencia (60Hz), Voltaje Salida, Corriente Baterías.
   - **Inspección Visual / Baterías**: Limpieza de gabinete, cables, ventiladores operativos.
   - **Diagnóstico y Observaciones**: "Mantenimiento preventivo ejecutado según protocolo. Sistema operativo y sin anomalías."
   - **Recomendaciones**: "Realizar prueba de banco de baterías en la siguiente visita programada."
   - **Estado Final**: `Operativo`.
3. Hace clic en **`Enviar a Revisión al Supervisor`**.
4. **Criterio de Aceptación**: La OT pasa a estado **`EN_REVISION`** y el informe queda bloqueado en solo lectura para el técnico.

---

### 🟢 PASO 7: Revisión y Aprobación por el Supervisor (Portal Supervisor)
1. Cerrar sesión e iniciar sesión como Supervisor (`supervisor@mafort.pe`).
2. Navegar al módulo de **`Supervisión`**.
3. Seleccionar el informe pendiente de la OT de `EQ-UPS-001`.
4. Auditar las mediciones, observaciones y fotos del informe.
5. Hacer clic en **`Aprobar Informe Técnico`** (con opción de comentarios de aprobación).
6. **Criterio de Aceptación**:
   - El informe pasa a estado **`APROBADO`**.
   - La OT pasa a estado **`COMPLETADA` / `APROBADA`**.

---

### 💰 PASO 8: Cierre Comercial y Facturación (Módulo Gestión de OTs)
1. Cerrar sesión e iniciar sesión como Administrador / Ventas.
2. Navegar al módulo **`Gestión de OTs`** (`GestionOTs`).
3. Buscar la OT / línea del servicio de `REPSOL DATA CENTER PERÚ S.A.C.`.
4. Verificar que la OT muestra el informe con el estado correcto (**`APROBADO`** / **`EJECUTADO`**).
5. Editar la línea e ingresar los datos financieros finales:
   - **Monto Ejecutado**: `$ 3,750.00 USD` (o S/ equivalente).
   - **Número de Factura**: `F001-00045890`
   - **Estado Financiero**: `FACTURADO` / `COMPLETADO`.
6. Guardar cambios.
7. **Criterio de Aceptación Final**: La OT queda en estado facturado con número de comprobante registrado, completando el 100% del ciclo de negocio de la aplicación.

---

## 📹 4. Evidencias Visuales Obligatorias
- Grabación de Video WebM: `Documentacion/evidencias/definitivas/video-flujo-e2e-completo-aplicacion.webm`.
- Traza de Playwright: `test-results/.../trace.zip`.
- QA Report APPROVED.
