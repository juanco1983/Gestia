# PLAN: Fix 502 Bad Gateway en Ambiente Dev (Dependencias de Despliegue CI/CD)

**Fecha:** 2026-08-30
**Tipo:** fix
**Prioridad:** CRITICA (Bloquea disponibilidad de ambiente dev)
**Rama:** fix/dev-502-deploy-dependencies

---

## 1. Contexto

Tras la fusion del PR #179, el ambiente dev en AWS Elastic Beanstalk (gestia-backend-dev) dejo de responder y quedo mostrando el error HTTP 502 Bad Gateway.

### Analisis de Causa Raiz
1. Dependencias faltantes en package.json de produccion: app-deploy.yml omitia cors, express-rate-limit y @aws-sdk/s3-request-presigner.
2. Empaquetado incompleto de Prisma: Solo se copiaba schema.prisma.
3. Fallo en comando de inicio: Procfile ejecutaba prisma migrate deploy sin migraciones existentes para los nuevos modelos.
4. Timeout en Elastic Beanstalk: El servidor Node no inicio en puerto 5000.

---

## 2. Alcance de Cambios

- .github/workflows/app-deploy.yml: Agregar dependencias completas de produccion, copiar prisma/ completo, Procfile con prisma generate && prisma db push.
- deploy-backend.ps1: Sincronizar dependencias de produccion.
- Documentacion/arquitectura_infraestructura_nube.md: Actualizar especificacion de Procfile.

---

## 3. Criterios de Aceptacion

- [x] Dependencias de produccion completas en app-deploy.yml
- [x] Copia completa de prisma/ en eb-deploy-temp/
- [x] Procfile con prisma generate && prisma db push && node dist/server.cjs
- [x] Build y lint exitosos localmente
- [x] Rama fix/dev-502-deploy-dependencies pusheada a GitHub