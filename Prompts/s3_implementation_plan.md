# Plan de Implementación (Optimizado): Migración de Imágenes a AWS S3

**Versión:** 2.0 — Incorpora revisión de seguridad, resiliencia y costos sobre la propuesta original.

Este documento detalla el plan técnico para modificar la arquitectura actual del sistema Gestia, pasando de guardar imágenes pesadas en Base64 dentro de PostgreSQL a almacenarlas correctamente en un bucket de **AWS S3**, con acceso privado, manejo robusto de fallos, y control de costos.

## User Review Required

> [!IMPORTANT]
> Este cambio modifica la forma en que el backend procesa los reportes técnicos. Revisa los requerimientos previos, las decisiones de seguridad (bucket privado) y el plan de migración de datos existentes, y presiona **Proceed** si estás de acuerdo.

---

## Decisiones de diseño (resueltas respecto al plan original)

| Pregunta abierta original | Decisión adoptada | Justificación |
|---|---|---|
| Bucket público vs. privado | **Privado** + URLs firmadas (presigned, expiración corta) | Las fotos muestran infraestructura física en sedes de clientes (ej. bancos). Un bucket público con UUID impredecible sigue siendo recuperable si la URL se filtra en logs, capturas o PDFs compartidos. |
| Firma del cliente (`firmaCliente`) | **Se mantiene en PostgreSQL** | Es un trazo vectorial pequeño y además evidencia legal de conformidad — tiene sentido que viva junto al registro transaccional del reporte. |
| Credenciales AWS | **IAM Role en la instancia EB**, no keys estáticas en `.env` | Evita que credenciales terminen en logs, en `GET /api/db-dump`, o en un commit accidental. |

---

## Requisitos Previos (Por parte del Cliente/Infraestructura)

- Crear el bucket S3 con **acceso bloqueado por defecto** (Block Public Access = ON).
- Adjuntar un **IAM Role** a la instancia de Elastic Beanstalk con una política scoped únicamente a `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` sobre el ARN de ese bucket específico (no `s3:*` ni acceso a otros buckets de la cuenta).
- Variables de entorno necesarias (sin credenciales de acceso):
  - `AWS_REGION` (ej. `us-east-1`)
  - `AWS_S3_BUCKET_NAME`
  - `S3_SIGNED_URL_EXPIRY_SECONDS` (ej. `3600`)

---

## Proposed Changes

### 1. Dependencias del Backend

#### [MODIFY] `package.json`
- `@aws-sdk/client-s3` — comunicación con S3.
- `@aws-sdk/s3-request-presigner` — generación de URLs firmadas temporales.
- `uuid` — nombres de archivo únicos, evita colisiones.
- `sharp` — compresión/redimensionamiento de imágenes antes de subir (reduce costo de storage y payload de `/api/sync`).

---

### 2. Capa de Integración AWS S3

#### [NEW] `src/utils/s3Service.ts` (Backend)

Funciones a implementar:

**`compressImage(buffer)`**
- Redimensiona a un ancho máximo razonable (ej. 1600px) y recomprime a JPEG calidad ~75% usando `sharp`.
- Reduce el tamaño típico de una foto de celular (3-8MB) a ~300-800KB sin pérdida perceptible para fines de evidencia técnica.

**`validateImage(buffer, mimeType)`**
- Verifica el tipo de contenido real del buffer (no solo confiar en el prefijo `data:image/` del string recibido).
- Rechaza si excede un tamaño máximo configurable (ej. 10MB antes de comprimir).

**`uploadBase64ToS3(base64String, folderName)`**
1. Recibe el texto Base64 enviado desde la tablet/celular.
2. Valida el contenido (`validateImage`).
3. Convierte a buffer binario y comprime (`compressImage`).
4. Sube a S3 con `PutObjectCommand`, usando el bucket privado y un key con prefijo por carpeta + UUID (ej. `reports/{otId}/{uuid}.jpg`).
5. Retorna el **key de S3** (no la URL pública — el bucket es privado).

**`getSignedUrlForKey(key)`**
- Genera una URL firmada con expiración (`S3_SIGNED_URL_EXPIRY_SECONDS`) para mostrar la imagen en el frontend o en el PDF generado por `DocumentFormat`.
- Se llama al momento de servir el reporte (`GET /api/reports`), no al momento de guardar.

**`deleteFromS3(key)`**
- Borra un objeto por su key. Se usa en el flujo de limpieza (sección 5).

---

### 3. Refactorización del Backend (Controladores)

#### [MODIFY] `server.ts`

**Endpoint `POST /api/reports`:**
- Antes de `prisma.technicalReport.upsert`, iterar sobre `req.body.fotos`.
- Si el string comienza con `data:image/` (Base64 nuevo), llamar a `uploadBase64ToS3` y usar `Promise.allSettled` (no `Promise.all`) para no perder el reporte completo si una sola foto falla.
- Si alguna foto falla su subida:
  - Guardar el reporte con las fotos que sí se subieron correctamente + un campo de metadata `fotosFailedCount` o similar.
  - Devolver en la respuesta cuáles fotos fallaron, para que el frontend las reintente individualmente sin perder el resto del reporte.
- Reemplazar cada Base64 exitoso por su **key de S3** (no URL pública) en el JSON.
- Si el reporte reemplaza fotos existentes (flujo `Observada → Corregida`), registrar los keys antiguos para limpieza (ver sección 5).
- Guardar en PostgreSQL.

**Endpoint `GET /api/reports` (y donde se sirvan fotos al frontend/PDF):**
- Por cada key de S3 almacenado, generar una URL firmada con `getSignedUrlForKey` antes de responder.
- No cachear las URLs firmadas más allá de su expiración.

**Endpoint `POST /api/sync` (Sincronización Offline):**
- Misma lógica de validación + compresión + `Promise.allSettled`.
- Definir explícitamente la política de fallos parciales: un reporte con fotos fallidas se marca con `offlineDirty: true` solo para esas fotos específicas, permitiendo reintento incremental en la siguiente sincronización, sin bloquear el resto del batch.

---

### 4. Capa de Base de Datos

#### [NO MODIFY] `prisma/schema.prisma`
- El campo `fotos: Json` no cambia de tipo. Pasa de almacenar Base64 a almacenar **keys de S3** (ej. `reports/OT-MAY-001/a1b2c3d4.jpg`), no URLs completas, ya que el bucket es privado y las URLs se generan dinámicamente al servir.

#### [NEW] Script de backfill — `scripts/migrate-existing-photos-to-s3.ts`
- Recorre todos los `TechnicalReport` existentes en producción cuyo campo `fotos` aún contenga strings `data:image/...`.
- Para cada uno: valida, comprime, sube a S3, reemplaza el valor por el key, y actualiza el registro.
- Corre en lotes pequeños (ej. 20 registros a la vez) con backoff entre lotes para no saturar RDS ni la cuenta de S3.
- Loggea un reporte final: cuántos registros migrados, cuántos fallidos (para revisión manual), y espacio liberado estimado en PostgreSQL.
- **Se ejecuta una sola vez, de forma controlada, antes de considerar cerrado el proyecto** — sin esto, la base queda con dos formatos mezclados indefinidamente.

---

### 5. Limpieza de objetos huérfanos

Cuando un reporte reemplaza una foto (corrección de un técnico tras rechazo del supervisor), el objeto anterior en S3 queda huérfano si no se borra explícitamente.

**Opción A (recomendada para simplicidad inicial):** al reemplazar una foto en `POST /api/reports`, llamar a `deleteFromS3` sobre el key anterior inmediatamente después de confirmar que el nuevo se subió con éxito.

**Opción B (más resiliente, mayor esfuerzo):** en vez de borrar de forma síncrona, marcar los keys antiguos en una tabla de "pendientes de borrado" y correr un job periódico (o una S3 Lifecycle Rule) que los limpie después de N días — útil si se necesita posibilidad de rollback.

Para el alcance actual, Opción A es suficiente dado el volumen esperado.

---

## Estimación de costos (referencia)

Con compresión aplicada (~300-800KB por foto) y el volumen actual documentado (10-15 técnicos, ~15 reportes/día), el costo incremental de S3 se mantiene por debajo de $1-2/mes en los primeros meses — el storage, PUT/GET requests y egress (dentro del tier gratuito de 100GB/mes agregado) no representan un riesgo para el presupuesto actual. RDS y EC2 seguirán siendo los costos dominantes de la infraestructura.

---

## Open Questions (resueltas — incluidas por trazabilidad)

1. ~~¿Bucket público o privado?~~ → **Privado**, con URLs firmadas.
2. ~~¿Firma del cliente también a S3?~~ → **No**, permanece en PostgreSQL.

## Nuevas preguntas abiertas de esta versión

1. **Expiración de URLs firmadas:** ¿1 hora es suficiente para el flujo de revisión de un supervisor, o el reporte debería regenerar la URL cada vez que se abre (más seguro, ligeramente más lento)?
2. **Backfill:** ¿Se ejecuta en un horario de bajo tráfico (madrugada) o se coordina una ventana de mantenimiento?
3. **Limpieza de huérfanos:** ¿Opción A (borrado inmediato) es aceptable, o se prefiere un período de gracia (Opción B) por si se necesita revertir una corrección?

---

## Verification Plan

### Automated Tests
- Enviar una imagen Base64 de prueba a `/api/reports` y verificar que la respuesta almacene un key de S3 (no Base64, no URL pública directa).
- Simular un fallo de subida de una de varias fotos en un mismo reporte y confirmar que el reporte se guarda con las fotos exitosas y reporta cuáles fallaron (verifica `Promise.allSettled`).
- Verificar que `GET /api/reports` devuelva URLs firmadas válidas y que expiren correctamente pasado el tiempo configurado.
- Probar el script de backfill contra una base de datos de staging con registros Base64 de ejemplo.

### Manual Verification
- Levantar el entorno con el IAM Role configurado (sin credenciales estáticas) y confirmar que el backend puede subir/leer/borrar del bucket.
- Iniciar sesión como Técnico, llenar un reporte y adjuntar una imagen desde la interfaz; confirmar en la consola de S3 que el bucket permanece privado (Block Public Access activo) y que el objeto aparece con el tamaño comprimido esperado.
- Simular el flujo `Observada → Corregida` reemplazando una foto y confirmar que el objeto anterior se borra de S3.
- Revisar PostgreSQL (tabla `TechnicalReport`) para confirmar que solo se guardan keys, nunca Base64 ni URLs públicas persistentes.
- Correr el script de backfill contra un respaldo de producción y validar el reporte final de migración antes de aplicarlo al ambiente real.
