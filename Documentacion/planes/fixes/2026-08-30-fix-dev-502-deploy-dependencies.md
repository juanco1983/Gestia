# PLAN: Fix 502 Bad Gateway y Autenticacion en Ambiente Dev

**Fecha:** 2026-08-30
**Tipo:** fix
**Prioridad:** CRITICA
**Rama:** fix/dev-502-deploy-dependencies

---

## 1. Contexto

Tras la fusion del PR #179, se identificaron dos incidentes criticos:
1. Ambiente dev en 502 Bad Gateway por dependencias faltantes en CI/CD (cors, express-rate-limit, @aws-sdk/s3-request-presigner) y Procfile con prisma migrate deploy.
2. Error No autorizado al intentar loguearse: authenticateToken evaluaba req.path (/login) en vez de la ruta completa montada en /api, bloqueando el endpoint publico /api/login.

---

## 2. Alcance de Cambios

- .github/workflows/app-deploy.yml: Dependencias completas en package.json de produccion, copia completa de prisma/, Procfile con prisma generate && prisma db push.
- deploy-backend.ps1: Sincronizacion de dependencias y empaquetado de prisma/.
- server.ts: isPublicEndpoint y authenticateToken corregidos para reconocer req.originalUrl y req.baseUrl; CORS ampliado para soportar origenes de Amplify; /api/login retorna token y accessToken.
- src/components/LoginView.tsx: Compatibilidad con data.token y data.accessToken.

---

## 3. Criterios de Aceptacion

- [x] Dependencias de produccion completas en CI/CD
- [x] Procfile con prisma generate && prisma db push
- [x] /api/login y endpoints publicos no bloqueados por authenticateToken
- [x] Origenes de Amplify y localhost permitidos en CORS
- [x] Build y lint limpios localmente
- [x] Rama fix/dev-502-deploy-dependencies subida a GitHub