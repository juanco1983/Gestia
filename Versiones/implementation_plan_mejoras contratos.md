# Plan de Trabajo: Mejoras de Contratos Comerciales, Montos, PDFs e Historial de Ampliaciones

Este plan detalla el diseño técnico y los pasos de desarrollo para implementar los nuevos requerimientos en el módulo de Contratos Comerciales de Gestia:
1. **Monto y Moneda del Contrato:** Campos de monto original y moneda (Soles/Dólares) al registrar un contrato.
2. **Tabla de Tipos de Contrato en BD:** Registrar los tipos de contrato solicitados en una nueva tabla de base de datos y cargarlos dinámicamente en el formulario.
3. **Contrato Digitalizado (PDF):** Carga y visualización de un archivo PDF digitalizado del contrato en AWS S3.
4. **Ampliación de Contratos y Adendas:** Registrar adendas que incluyan monto, vigencia (fechas) y archivo PDF de adenda. El monto de la ampliación se sumará al total del contrato y se mantendrá un historial detallado de todas las ampliaciones registradas.

> [!IMPORTANT]
> **Almacenamiento en AWS S3:** Tanto los contratos originales en formato PDF como los documentos de adendas/ampliaciones se procesarán y guardarán físicamente en el bucket de **AWS S3** (`gestia-dev-photos` o el configurado). La base de datos local y en la nube de PostgreSQL únicamente guardará las rutas/URLs relativas seguras para acceder a estos archivos.

---

## Cambios Propuestos

### Componente 1: Base de Datos y Backend

#### [MODIFY] [schema.prisma](file:///c:/Informes%2520Mafort%2520IA/prisma/schema.prisma)
- **Nuevo modelo `TipoContrato`:**
  ```prisma
  model TipoContrato {
    id   String @id @default(uuid())
    name String @unique
  }
  ```
- **Nuevo modelo `ContratoAmpliacion`:**
  ```prisma
  model ContratoAmpliacion {
    id             String        @id @default(uuid())
    contratoId     String
    contrato       ContratoNuevo @relation(fields: [contratoId], references: [id], onDelete: Cascade)
    monto          Float
    fecha_inicio   String
    fecha_fin      String
    adenda_pdf_url String?
    comentarios    String?
    creadoEn       DateTime      @default(now())
  }
  ```
- **Modificación al modelo `ContratoNuevo`:**
  - Agregar `monto_original Float?`
  - Agregar `moneda String?` (valores: `'PEN'` | `'USD'`)
  - Agregar `pdf_url String?`
  - Relación uno a muchos con `ContratoAmpliacion`: `ampliaciones ContratoAmpliacion[]`

#### [MODIFY] [server.ts](file:///c:/Informes%2520Mafort%2520IA/server.ts)
- **Carga inicial/Seeding:**
  - En la inicialización del servidor (o dentro de una función de arranque), verificar si la tabla `TipoContrato` está vacía. Si es así, sembrar los 9 tipos indicados: `'ALQUILER'`, `'MANTENIMIENTO'`, `'SERVICIO'`, `'SUMINISTRO'`, `'EMERGENCIA'`, `'INSTALACION'`, `'REPARACION'`, `'PROYECTO'`, `'ANULADO'`.
- **Ruta de Archivos Segura y Aislamiento en S3:**
  - **Aislamiento en S3:** Todo documento se almacenará en un directorio independiente del bucket utilizando el prefijo exclusivo `contracts/` (separado completamente de `reports/`).
    - Contratos: `contracts/<Contrato-ID>/contrato.pdf`
    - Adendas: `contracts/<Contrato-ID>/adenda-<Timestamp>.pdf`
  - **Endpoint Seguro `/api/contracts/files/*`:**
    - Agregar endpoint GET para servir estos PDFs directamente de S3 de manera privada, validando con regex que la ruta comience con `contracts/` y verificando que el usuario tenga rol de `Administrador`, `Ventas` o `Supervisor`.
- **Nuevos Endpoints de API:**
  - `GET /api/tipo-contratos`: Devuelve los tipos de contrato almacenados en la base de datos.
  - `POST /api/contracts/:id/ampliaciones`: Registra una nueva ampliación para un contrato, procesando el PDF de adenda y guardándolo bajo el mismo directorio aislado en S3 (`contracts/<Contrato-ID>/`), y devolviendo el historial.

---

### Componente 2: Modelado Frontend

#### [MODIFY] [types.ts](file:///c:/Informes%2520Mafort%2520IA/src/types.ts)
- Actualizar la interfaz `Contrato` para incluir `monto_original`, `moneda`, `pdf_url` y `ampliaciones?: ContratoAmpliacion[]`.
- Definir la interfaz `ContratoAmpliacion`:
  ```typescript
  export interface ContratoAmpliacion {
    id: string;
    contratoId: string;
    monto: number;
    fecha_inicio: string;
    fecha_fin: string;
    adenda_pdf_url?: string;
    comentarios?: string;
    creadoEn: string;
  }
  ```

---

### Componente 3: Interfaz de Usuario y Formularios

#### [MODIFY] [ClientesContratosView.tsx](file:///c:/Informes%2520Mafort%2520IA/src/components/ClientesContratosView.tsx)
- **Carga de Tipos de Contrato:**
  - Cargar la lista de tipos de contrato desde `GET /api/tipo-contratos` al iniciar el componente.
- **Formulario de Nuevo Contrato / Edición:**
  - Campos agregados:
    - *Monto del Contrato* (numérico).
    - *Moneda* (selector con "Soles (S/.)" -> `PEN` y "Dólares ($)" -> `USD`).
    - *Adjuntar Contrato en PDF* (campo de archivo con validación de tipo `.pdf`).
  - Cambiar el selector de Tipo de Contrato para que se llene dinámicamente con los datos de la base de datos en lugar de opciones estáticas.
- **Ficha de Detalle del Contrato (Visualización):**
  - **Monto y Moneda:** Mostrar el monto del contrato original.
  - **Monto Total con Ampliaciones:** Si el contrato tiene ampliaciones, sumar los montos y mostrar el total acumulado en pantalla de forma desglosada: `Monto Original + S/ X.XX en Ampliaciones = Total S/ Y.YY`.
  - **Contrato Digitalizado:** Si `pdf_url` existe, mostrar un botón con un icono de PDF que abra el archivo en una nueva pestaña de forma segura utilizando la API.
  - **Historial de Ampliaciones / Adendas:**
    - Renderizar una sección dedicada al historial de ampliaciones con formato de línea de tiempo o lista.
    - Cada fila del historial mostrará: el número de adenda, el monto, las fechas de vigencia, comentarios y un link para abrir el PDF de la adenda.
  - **Botón "Registrar Ampliación":**
    - Abre un modal secundario para rellenar los datos de la ampliación: *Monto*, *Fecha de Inicio*, *Fecha de Fin*, *Comentarios* y *Adjuntar Adenda (PDF)*.

---

## Plan de Verificación

### Pruebas de Compilación
- Ejecutar `npm run build` localmente para garantizar que no existan errores de TypeScript ni de empaquetado.

### Pruebas de Integración y Migración
- Ejecutar `npx prisma db push` para aplicar los cambios a la base de datos local y comprobar que la tabla `TipoContrato` y `ContratoAmpliacion` se creen correctamente.
- Validar el proceso de guardado local (Offline) asegurando que guarde correctamente las ampliaciones asociadas al contrato.

### Verificación Manual
- Crear un nuevo contrato ingresando Monto, Moneda (USD) y adjuntando un archivo PDF de ejemplo.
- Abrir la ficha del contrato y validar la descarga del PDF.
- Registrar dos ampliaciones con montos diferentes y comprobar que:
  - El monto total mostrado en la ficha se actualice sumando el monto original y los de las ampliaciones.
  - El historial muestre ambas adendas con su información y PDFs correspondientes.
