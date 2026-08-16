# Guión de Pruebas E2E: Almacenamiento Estricto en S3 para Fotos de Informes y Contratos PDFs

## Contexto y Objetivo
Validar que las imágenes registradas en los informes técnicos de campo y los archivos de contratos PDF cargados en el módulo Comercial:
1. Se procesen mediante la API de AWS S3 utilizando la instancia `s3` inicializada correctamente.
2. No guarden datos binarios ni cadenas Base64 pesadas dentro de las columnas de la base de datos Postgres.
3. Devuelvan únicamente URLs estructuradas (`/api/photos/reports/OT-...` y `/api/contracts/files/contracts-...`) que sean atendidas por el servidor backend de Node.js sin recargar la aplicación SPA.

---

## Escenarios de Prueba Automatizados

### Escenario 1: Inicialización y Subida de Fotografía a S3 sin Errores
- **Dado:** Que el servidor backend procesa una petición POST `/api/reports` con fotografías de campo.
- **Cuando:** La función `uploadBase64ToS3` recibe la imagen base64.
- **Entonces:** Debe invocar `s3.send(PutObjectCommand)` sin lanzar `ReferenceError: s3 is not defined` y retornar el prefijo oficial `/api/photos/reports/OT-...`.

### Escenario 2: Enrutamiento e Inspección de Contratos PDF
- **Dado:** Que un usuario en el módulo Comercial hace clic en "Ver Contrato Digitalizado (PDF)".
- **Cuando:** El botón genera el enlace hacia el contrato.
- **Entonces:** La URL generada debe ser `/api/contracts/files/contracts-XXX/archivo.pdf?token=...` y la respuesta HTTP debe ser `Content-Type: application/pdf`, evitando redirigir a la SPA (`index.html`).

---

## Criterios de Aceptación
- [x] La variable `const s3 = new S3Client(...)` está definida e instanciada correctamente a nivel global en `server.ts`.
- [x] Ningún informe guarda imágenes Base64 brutas en la base de datos Postgres cuando S3 está activo.
- [x] Los contratos y fotos son atendidos transparentemente por la CDN y el backend.
