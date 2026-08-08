# Plan de Corrección: Optimización, Carga y Limpieza de AWS S3

## 📌 1. Contexto y Problema
En la auditoría técnica de AWS S3 se identificaron las siguientes deficiencias críticas:
1. **Fotos de Equipos huérfanas en BD**: La función `uploadEquipoPhotoToS3` no era invocada en `POST /api/equipos` ni `PUT /api/equipos/:id`, guardando Base64 pesadas en PostgreSQL.
2. **Validación de Tamaño en Informes**: `uploadBase64ToS3` carecía de validación individual de tamaño por foto (máx. 10MB) y validación estricta de extensiones/MIME.
3. **Objetos Huérfanos en S3**: Al eliminar equipos (`DELETE /api/equipos/:id`) o ejecutar `wipe-operational-db`, los archivos permanecían en S3 generando sobrecostos.
4. **Optimización con Pre-Signed URLs**: Falta de endpoints para generar URLs firmadas temporales para lectura directa desde S3 sin sobrecargar el servidor EC2.

---

## 🎯 2. Criterios de Aceptación
- [x] Las fotos de equipos enviadas en Base64 se suben automáticamente a S3 (`equipo/{equipoId}/...`) y se guardan como rutas proxy en Postgres.
- [x] `uploadBase64ToS3` valida peso máximo de 10MB por fotografía y restringe formatos a (`image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`).
- [x] Al eliminar un equipo en `DELETE /api/equipos/:id`, todas sus fotos asociadas en S3 son eliminadas.
- [x] `POST /api/admin/wipe-operational-db` elimina los archivos de S3 de las OTs y equipos reseteados.
- [x] Endpoint de generación de URLs firmadas temporales (`getSignedUrl`) con redirección segura o streaming fallback.

---

## 🔧 3. Desglose de Cambios

### Archivo: `server.ts`
- **Imports**: Importar `getSignedUrl` de `@aws-sdk/s3-request-presigner`.
- **`uploadBase64ToS3`**: Agregar validación de tamaño (10MB) y tipos MIME válidos.
- **`POST /api/equipos` & `PUT /api/equipos/:id`**: Procesar el arreglo `fotos` llamando a `uploadEquipoPhotoToS3` para cada imagen Base64.
- **`DELETE /api/equipos/:id`**: Iterar sobre `equipo.fotos` y llamar a `deleteFromS3`.
- **`POST /api/admin/wipe-operational-db`**: Agregar borrado en cascada de objetos S3 asociados.
- **Pre-Signed URLs**: Soportar parámetro `?presign=true` o redirección 302 hacia URL firmada en `/api/photos/*`, `/api/contracts/files/*`, `/api/equipos/files/*`.

---

## 🔒 4. Verificación
- Pruebas unitarias/integración de subida de fotos de equipos y borrado.
- Ejecución de suite de Playwright sin errores de consola ni de endpoints.
