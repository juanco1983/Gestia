# Plan de Trabajo: Reorganización de Gestión de OTs con Codificación Automática y Selección de Equipos por Contrato/Adenda

Este plan detalla los cambios para automatizar el código único de las Órdenes de Trabajo (OT) según el formato `OT-[contrato/adenda]-[correlativo]`, y permitir asociar la OT tanto a un contrato comercial como a una adenda (ampliación), listando dinámicamente los equipos vinculados a la opción seleccionada.

## Cambios Propuestos

### 1. Base de Datos (`prisma/schema.prisma`)
* **Modelo `OT`:** 
  * Agregar el campo opcional `adendaId String?` para registrar la adenda específica asociada a la OT (si se seleccionó una adenda).
  * Agregar el campo opcional `equipoId String?` (ya existe en la DB) para vincular el equipo específico a la OT técnica.

### 2. Tipos de TypeScript (`src/types.ts`)
* **Interfaz `OT`:**
  * Agregar `adendaId?: string` como propiedad opcional.

### 3. Backend (`server.ts`)
* **Endpoint `POST /api/ots`:**
  * Extraer `adendaId` del cuerpo de la solicitud.
  * Si se asocia un contrato o una adenda, deducir el costo estimado del saldo disponible del contrato comercial padre.
  * Guardar el objeto con los campos `contratoId`, `adendaId`, y `equipoId`.

### 4. Frontend (`src/components/VentasView.tsx`)
* **Inicialización de Formulario:**
  * Inhabilitar la edición manual del campo de código/ID de la OT.
  * Mantener una lista local de equipos de la base de datos para el cliente seleccionado (`fetch('/api/equipos?clienteId=...')` al seleccionar un cliente).
* **Campos del Formulario:**
  * Reemplazar el selector de contrato simple por un selector unificado o dinámico que permita elegir:
    1. **Contrato comercial directo** (ej. `Contrato: OM-CO-001`).
    2. **Adenda/Ampliación** (ej. `Adenda: OM-CO-001 - A1`).
  * Al seleccionar una opción:
    * **Generación del Código Automático de OT:**
      * Buscar cuántas OTs existen en la base de datos para ese contrato o adenda.
      * Generar el código en formato: `OT-[código de contrato o adenda]-[correlativo de 3 dígitos]`.
      * Por ejemplo, si se selecciona el contrato `OM-CO-001` y no tiene OTs, se genera `OT-OM-CO-001-001`.
      * Si se selecciona la adenda `A1` (código `OM-CO-001-A1`) y ya hay una OT, se genera `OT-OM-CO-001-A1-002`.
    * **Listado y Filtro de Equipos:**
      * Si se selecciona un contrato comercial directo: filtrar los equipos de ese cliente donde `equipo.contratoId === contratoId`.
      * Si se selecciona una adenda: filtrar los equipos mediante la relación pivote de la adenda (`equipo.adensasOrigen` contenga la adenda seleccionada).
      * Mostrar un selector de equipos con las opciones filtradas.
      * Al seleccionar un equipo: autocompletar la categoría (`tipoEquipo`), potencia (`potenciaKva`), y el `equipoId` de la OT.

---

## Plan de Verificación

### Pruebas Manuales
1. Crear una nueva OT, seleccionar un cliente, y verificar que los contratos y adendas se listen correctamente.
2. Seleccionar un contrato y validar que se autogenere el código único de la OT (ej: `OT-OM-CO-001-001`) y que se listen únicamente los equipos asignados a ese contrato marco.
3. Seleccionar una adenda y validar que se autogenere el código correspondiente (ej: `OT-OM-CO-001-A1-001`) y que se listen únicamente los equipos vinculados a esa adenda.
4. Crear la OT y verificar que se guarde correctamente en la base de datos con las asociaciones correctas (`contratoId`, `adendaId`, `equipoId`).
