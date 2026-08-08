# Guion de Pruebas E2E: Flujo Integral de Usuario y Validación de Almacenamiento AWS S3

> **Fecha**: 2026-08-07  
> **Alcance**: Navegador Real (Playwright) + API / Base de Datos + Validación de AWS S3 (Contratos PDF, Fotos de Equipos, Fotos de Informes, Firma Digital, Pre-Signed URLs).  
> **Archivo de Prueba**: `tests/cloud-s3-e2e-workflow.spec.ts`

---

## 🎯 1. Objetivos de la Prueba

1. **User Journey Completo desde la Interfaz**:
   - Registro de Cliente con validación de cascada Ubigeo (País -> Provincia -> Distrito).
   - Registro de Contrato Comercial con subida y asignación de documento PDF.
   - Registro de Activo/Equipo en inventario con fotografía Base64 y subida a AWS S3.
   - Programación de Orden de Trabajo (OT) de servicio.
   - Ejecución de Informe Técnico con carga de fotos etiquetadas, foto panorámica y firma digital del cliente.
   - Aprobación de supervisión y gestión de facturación comercial.
2. **Validación de Almacenamiento y Seguridad AWS S3**:
   - Comprobación de que ningún archivo binario pesado quede como Base64 crudo en PostgreSQL.
   - Verificación de rutas proxy seguras (`/api/photos/*`, `/api/contracts/files/*`, `/api/equipos/files/*`).
   - Verificación de generación de **Pre-Signed URLs** temporales (`?presign=true`, vigencia de 15 min / 900s).
   - Comprobación del control de acceso RBAC por rol (Admin, Ventas, Supervisor, Técnico, Cliente).
   - Comprobación de limpieza de objetos huérfanos (`deleteFromS3`).

---

## 📋 2. Matriz de Pasos y Criterios de Aceptación

| Paso | Módulo | Acción del Usuario | Criterio de Aceptación |
|:---|:---|:---|:---|
| 1 | **Comercial** | Registro de Cliente con RUC y Ubigeo | Cliente registrado y visible en lista; sin errores de consola. |
| 2 | **Contratos** | Registro de Contrato Comercial | Contrato guardado con PDF en S3 (`contracts/{id}/...`); límite de 15MB validado. |
| 3 | **Inventario** | Registro de Equipo con Foto | Foto subida a S3 (`equipo/{id}/...`); URL proxy guardada en Postgres; límite de 8MB. |
| 4 | **Operaciones** | Programación de OT y Asignación | OT generada en estado `PROGRAMADA` vinculada al cliente y equipo. |
| 5 | **Técnico** | Ejecución de Servicio + Wizard | Subida de fotos de informe (`reports/OT-...`), foto panorámica y firma a S3. |
| 6 | **Supervisión** | Revisión y Aprobación | Informe pasa a `APROBADO`. |
| 7 | **Finanzas** | Facturación y Cierre | OT pasa a `FACTURADO`. |
| 8 | **Seguridad S3** | Invocación de Endpoints y Pre-Signed URLs | Generación de URLs firmadas con `getSignedUrl`; rechazo 401/403 a no autorizados. |

---

## 🎥 3. Registro de Evidencias

- **Video E2E**: Guardado automáticamente en `test-results/` (`.webm`).
- **Trace y Screenshots**: Almacenados en `test-results/` para auditoría visual.
