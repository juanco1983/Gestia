# Prompt optimizado — Migración de fotos a S3 + Sync atómico (Gestia)

> Análisis y correcciones incluidos. Pega el bloque de abajo directo en tu agente de código (Claude Code, Cursor, etc.)

## Resumen del análisis

El plan original tiene una estructura sólida (separar blobs de Postgres, proxy en vez de bucket público, sync atómico en vez de masivo), pero tenía vacíos de seguridad y consistencia de datos:

- **Seguridad**: el proxy `/api/photos/*` no tenía auth ni validación de path (riesgo de IDOR y path traversal), no había whitelist de MIME ni límite de tamaño al subir.
- **Consistencia**: no había idempotencia en el sync (riesgo de reportes duplicados), ni rollback si S3 sube la foto pero Postgres falla, ni migración (backfill) de las filas que ya tienen Base64.
- **Funcional**: eliminar localStorage globalmente rompe el flujo offline si el técnico no tiene contra qué OT crear un reporte sin conexión.
- **Infraestructura**: inyectar la dependencia dinámicamente en el script de deploy es frágil; mejor commitearla en `package.json`.

Todo esto ya está corregido en el prompt de abajo.

---

## Prompt para el agente de código

```
CONTEXTO: Backend Node/Express + React (Gestia). Migrar fotos de reportes de Base64
en Postgres a S3 (bucket gestia-dev-photos). Eliminar sync offline global; sync
atómico por reporte. Repo ya tiene deploy-backend.ps1, server.ts, App.tsx.

BACKEND (server.ts):
1. Instalar @aws-sdk/client-s3 vía package.json (NO inyectar en deploy-backend.ps1).
   Usar IAM role de Elastic Beanstalk, sin access keys en env vars.
2. uploadBase64ToS3(base64Str, otId, index):
   - Whitelist MIME: image/png, image/jpeg, image/webp. Rechazar otro tipo.
   - Límite: 8MB/imagen, 40MB/reporte total. Rechazar si excede.
   - Key: reports/OT-{otId}/{timestamp}-{index}.{ext}
3. POST /api/reports:
   - Requiere clientReportId (UUID generado en frontend) como idempotency key.
     Si ya existe reporte con ese UUID -> devolver el existente (upsert), no duplicar.
   - Sube fotos a S3 ANTES de insertar en Postgres. Si el insert falla, borrar
     los objetos S3 recién subidos (rollback manual).
   - Guardar solo paths relativos en columna fotos.
4. GET /api/photos/*:
   - Requiere sesión autenticada (mismo middleware que /api/reports).
   - Validar path contra regex ^reports/OT-[\w-]+/[\w.-]+$ antes de llamar S3.
     Rechazar con 400 si no matchea.
   - Verificar que el usuario tenga permiso sobre esa OT (no solo estar logueado).
   - STREAM la respuesta de S3 (no bufferear en memoria). Content-Type desde
     metadata de S3, no del request. Header X-Content-Type-Options: nosniff.
   - Cache-Control: private, max-age=3600.
5. Eliminar POST /api/sync.
6. Script de backfill (one-off, no en request path): leer filas con Base64 en
   fotos, subirlas a S3, actualizar columna con path relativo. Loguear progreso,
   idempotente (skip si ya es path, no Base64).

FRONTEND (App.tsx):
1. clients/contracts/ots/reports/ordenesTrabajo/contratosNuevos/targetVentas: [].
   Cargar de loadFromBackend al iniciar, sin fallback a localStorage.
2. EXCEPCIÓN: cachear en localStorage (clave gestia_ots_cache) el listado de OTs
   asignadas al técnico logueado, refrescado cada vez que hay red, para que
   pueda crear reportes offline contra una OT existente.
3. offlineQueue en localStorage (gestia_offline_queue) se mantiene.
4. Cada reporte en cola offline lleva un UUID propio (clientReportId) generado
   al crearse, no al sincronizar.
5. syncPendingReports(): recorre offlineQueue, POST atómico a /api/reports con
   clientReportId incluido, on success -> estado OT = "En Revisión" y remover
   de la cola. On failure -> mantener en cola, reintentar en próximo trigger.
6. Quitar toggle Conectado/Offline del header.

TESTS:
- Unit: uploadBase64ToS3 rechaza MIME/tamaño inválido.
- Integration: POST /api/reports con mismo clientReportId dos veces -> 1 solo
  registro en DB.
- Integration: GET /api/photos/../../etc -> 400, no 200.
- Integration: GET /api/photos/* sin sesión -> 401. Con sesión de otro cliente -> 403.
- Manual: reporte offline -> reconexión -> sync -> foto visible vía proxy.

NO HACER: no exponer bucket S3 públicamente, no usar presigned URLs (decisión
ya tomada), no cachear arrays de negocio completos en localStorage salvo la
excepción de OTs del técnico.
```
