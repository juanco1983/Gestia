# Reporte de QA: Almacenamiento Estricto en S3 y Enrutamiento de Contratos y Fotos

**Fecha:** 2026-08-15  
**Rama:** `fix/report-images-saving`  
**Estado:** ✅ **APPROVED (100% PASSED)**  

---

## 1. Resumen Ejecutivo
Se implementó la eliminación total de fallbacks a almacenamiento de disco local o Base64 en la base de datos Postgres. Toda foto de informe, firma de cliente, fotografía de equipo o contrato PDF requiere ahora la carga obligatoria a AWS S3. En caso de falla en la conexión o permisos con S3, la API responde con un mensaje de error HTTP 500 explícito para evitar comportamiento engañoso.

---

## 2. Resultados de las Pruebas E2E (Playwright en Navegador Real)

| # | Escenario de Prueba | Estado | Duración | evidencia Video |
|---|---|---|---|---|
| 1 | Validación de contratos PDF con endpoint `/api/contracts/files/` y token JWT | ✅ PASSED | 29.0s | `test-results/.../video.webm` |
| 2 | Renderizado de imágenes de supervisor con endpoints `/api/photos/` | ✅ PASSED | 13.8s | `test-results/.../video.webm` |

**Resumen:** 2/2 pruebas ejecutadas y aprobadas exitosamente (100%).

---

## 3. Evidencias Generadas
- **Guión de Prueba:** [`Documentacion/pruebas_e2e/2026-08-15-almacenamiento-s3-fotos-contratos.md`](file:///c:/Informes%20Mafort%20IA/Documentacion/pruebas_e2e/2026-08-15-almacenamiento-s3-fotos-contratos.md)
- **Especificación de Prueba Automatizada:** [`tests/almacenamiento-s3-fotos-contratos.spec.ts`](file:///c:/Informes%20Mafort%20IA/tests/almacenamiento-s3-fotos-contratos.spec.ts)
- **Grabaciones de Video:** Guardadas en `test-results/` (configuración `video: 'on'`).

---

## 4. Conclusión
El cambio cumple estrictamente con las reglas de negocio, elimina simulaciones engañosas y garantiza que S3 sea la **única fuente de verdad** para archivos y fotos.
