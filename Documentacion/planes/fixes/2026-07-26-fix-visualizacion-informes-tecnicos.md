# Plan de Fix: Visualización de Informes Técnicos en Panel de Supervisor y Envío con Fotos

**Fecha:** 2026-07-26  
**Categoría:** `fixes`  
**Estado:** Completado  

## Contexto y Problema
El supervisor no podía visualizar los informes técnicos cargados por los técnicos para ciertas OTs. Además, al adjuntar fotos, la interfaz presentaba pantallas en blanco por cuota de `localStorage` y errores HTTP 500 en la invocación de `prisma.technicalReport.upsert()`.

## Causa Raíz
1. `getAssociatedReport` en `SupervisorView.tsx` retornaba prematuramente `undefined` cuando `equipoId` estaba presente pero no coincidía de forma exacta con `report.equipoId`.
2. Las imágenes Base64 de alta resolución sobrepasaban la cuota de 5MB de `localStorage.setItem` al auto-guardar borradores, provocando un error no capturado `QuotaExceededError`.
3. `uploadBase64ToS3` en `server.ts` fallaba en entorno local sin credenciales AWS S3, cancelando la transacción de inserción en la base de datos PostgreSQL.
4. `prisma.technicalReport.upsert()` requería `id` explícito en `create` y fallaba con `equipoId: null` en PostgreSQL por restricciones de índice único composite.

## Tareas
- [x] Refactorizar `getAssociatedReport` en `SupervisorView.tsx` con fallback garantizado y normalización de IDs.
- [x] Ajustar la búsqueda de informes en `TecnicoView.tsx` y `App.tsx`.
- [x] Implementar compresión automática de imágenes a 800×600 px en `src/utils/imageCompressor.ts`.
- [x] Proteger todas las llamadas a `localStorage.setItem` con bloques `try/catch`.
- [x] Implementar fallback de almacenamiento de imágenes local en `/uploads/` en `server.ts`.
- [x] Reemplazar `upsert` por `findFirst` + `update/create` explícito en `POST /api/reports` en `server.ts`.
- [x] Sincronizar `Documentacion/data_dictionary.md` y schema Prisma.
- [x] Validar con `npm run build` y push a la rama `fix/visualizacion-informe-tecnico`.

## Criterios de Aceptación
- [x] Al hacer clic en cualquier OT pendiente con reporte registrado, la vista de supervisor muestra inmediatamente el informe en pantalla con sus fotografías.
- [x] El técnico puede adjuntar fotografías sin congelamiento de pantalla ni excepciones de quota.
- [x] El servidor responde HTTP 201 y persiste correctamente los informes en PostgreSQL.
