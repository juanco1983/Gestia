# ARQUITECTURA DE INFRAESTRUCTURA NUBE — GESTIA IA

> **Única fuente de verdad infra.** Terraform, CI/CD, EB, Secrets.
> Versión: 1.0 — 2026-08-30

---

## 1. Resumen Arquitectura AWS (Nivel alto)

| Aspecto | Detalle |
|---------|---------|
| **Cuenta AWS** | `325580897755` (root) |
| **Región** | `us-east-1` (N. Virginia) |
| **Ambientes** | **dev**, **qa**, **prod** — separados por EB environment + RDS + S3 bucket |
| **VPC** | 10.0.0.0/16 — 2 AZs (`us-east-1a`, `us-east-1b`), subnets públicas (EB) + privadas (RDS) |
| **Conectividad** | IGW → Route Table pública; RDS solo accesible desde SG del backend |
| **DNS/HTTPS** | CloudFront delante de EB (certificado AWS gestionado) + Amplify para frontend SPA |

---

## 2. Terraform — Módulos y Resources

Estructura: `infra/modules/<modulo>/` + `infra/environments/<env>/`

| Módulo | Ubicación | Resources Clave |
|--------|-----------|-----------------|
| **networking** | `infra/modules/networking/` | VPC (10.0.0.0/16), 2 public subnets, 2 private subnets, IGW, Route Tables (pública/privada), associations |
| **database** | `infra/modules/database/` | `aws_db_subnet_group`, `aws_db_instance` (PostgreSQL 15, `db.t3.micro`, gp2 20GB, storage_encrypted=true, backup_retention=0 en dev, multi_az=false, deletion_protection=false, skip_final_snapshot=true) |
| **storage** | `infra/modules/storage/` | S3 bucket `${project}-${env}-photos`, versioning enabled, SSE-AES256, lifecycle: transition to Glacier @ 90d, noncurrent_version_expiration @ 30d, CORS para presigned URLs, public access block |
| **backend** | `infra/modules/backend/` | EB Application + Environment (`SingleInstance`, `t3.micro`, Node.js 20 AL2023), CloudFront Distribution (origin=EB CNAME, HTTPS redirect, cache disabled for API), env vars: `NODE_ENV`, `PORT=5000`, `DATABASE_URL`, `JWT_SECRET`, `S3_BUCKET_NAME`, `AWS_REGION` |
| **security** | `infra/modules/security/` | SG Backend (80/443 from 0.0.0.0/0, 3001 self), SG RDS (5432 from backend SG), IAM Role EC2 (BeanstalkWebTier, WorkerTier, SecretsManager:GetSecretValue, S3:PutObject/GetObject/DeleteObject/ListBucket), Instance Profile, IAM Role Service (EnhancedHealth, ManagedUpdates), Secrets Manager: `/gestia/{env}/db_password`, `/gestia/{env}/jwt_secret` |
| **frontend** | `infra/modules/frontend/` | Amplify App (build_spec Vite), Branch dev (auto-build), custom_rules: `/api/*` proxy a backend_url, SPA rewrite a `/index.html`, env vars: `VITE_API_URL`, `NODE_ENV` |

### 2.1 Variables por Ambiente (terraform.tfvars / variables.tf)

| Variable | dev | qa | prod |
|----------|-----|-----|------|
| `vpc_cidr` | 10.0.0.0/16 | 10.0.0.0/16 | 10.0.0.0/16 |
| `az_count` | 2 | 2 | 2 |
| `instance_class` | db.t3.micro | db.t3.micro | db.t3.micro |
| `allocated_storage` | 20 | 20 | 20 |
| `backup_retention` | 0 | 7 | 7 |
| `multi_az` | false | false | true |
| `deletion_protection` | false | false | true |
| `instance_type` | t3.micro | t3.micro | t3.micro |
| `health_system_type` | basic | basic | enhanced |
| `custom_domain_name` | "" | "" | (pendiente) |

---

## 3. CI/CD — GitHub Actions Workflows

| Workflow | Archivo | Trigger | Descripción |
|----------|---------|---------|-------------|
| **App Deploy** | `.github/workflows/app-deploy.yml` | push dev/qa/main + workflow_dispatch | Build (`npm run build`) → EB deploy (dev/qa/prod). Procfile: `prisma migrate deploy && node dist/server.cjs` |
| **Terraform Plan** | `.github/workflows/terraform-plan.yml` | PR a dev/main + paths `infra/**` | `terraform init/fmt/validate/plan` → comenta plan en PR. Usa OIDC + secrets `TF_VAR_*` |
| **Terraform Apply** | `.github/workflows/terraform-apply.yml` | push dev/qa/main + paths `infra/**` | `terraform init/plan/apply -auto-approve` (dev/qa); `main` requiere approval (`environment: production`) |
| **EC2 Power Control** | `.github/workflows/ec2-power-control.yml` | workflow_dispatch (manual) | Start/Stop EC2 de EB (dev/qa/prod). Suspende/Resume AutoScaling processes. **Úsalo antes de deploy si ambiente está apagado** |

### 3.1 Detalle: App Deploy (`.github/workflows/app-deploy.yml`)

- **Jobs**: `build-and-deploy` (ubuntu-latest)
- **Steps**: checkout → setup node 22 → npm ci → prisma generate → build (Vite + esbuild) → package zip (dist/, prisma/, .ebextensions/, .platform/, package.json prod, Procfile) → upload S3 → create EB app version → update/create EB environment
- **Environments**: dev → `gestia-backend-dev`, qa → `gestia-backend-qa`, main → `gestia-backend-prod` (GitHub Environment `production`)
- **PWA flag**: `VITE_PWA_TECNICO=1` en dev/qa, `0` en prod
- **Procfile generado**: `web: npx prisma migrate deploy && npx prisma generate && node dist/server.cjs`

### 3.2 Detalle: Terraform Plan (`.github/workflows/terraform-plan.yml`)

- **Trigger**: PR a `dev` o `main` con cambios en `infra/**`
- **Secrets**: `TF_VAR_DB_PASSWORD`, `TF_VAR_JWT_SECRET`, `TF_VAR_GITHUB_TOKEN`
- **Output**: Plan comentado en PR (truncado a 60k chars)
- **Dir**: `infra/environments/dev` (si base_ref=dev) o `infra/environments/prod` (si base_ref=main)

### 3.3 Detalle: Terraform Apply (`.github/workflows/terraform-apply.yml`)

- **Trigger**: push a `dev`, `qa`, `main` con cambios en `infra/**`
- **Dir mapping**: dev→dev, qa→qa, main→prod
- **Auto-approve**: dev/qa sí; main no (requiere approval manual en GitHub Environment `production`)
- **Outputs**: Muestra URLs y outputs de Terraform al final

### 3.4 Detalle: EC2 Power Control (`.github/workflows/ec2-power-control.yml`)

- **Inputs manuales**: `action` (STOP/START), `environment` (dev/qa/prod)
- **Lógica STOP**: Suspende ASG processes → `aws ec2 stop-instances` → wait stopped
- **Lógica START**: Resume ASG processes → `aws ec2 start-instances` → wait running
- **Importante**: Si STOP, deploy falla. Ejecutar START antes de merge/deploy.

---

## 4. Elastic Beanstalk — Configuración

### 4.1 `.ebextensions/`

| Archivo | Propósito |
|---------|-----------|
| `cleanup.config` | Limpieza disco: npm cache, logs, tmp, journalctl, yum cache, nginx logs (evita ENOSPC en t3.micro) |
| `swap.config` | Crea swapfile 2GB si no existe (mitiga OOM en t3.micro 1GB RAM) |

### 4.2 `.platform/`

| Archivo | Propósito |
|---------|-----------|
| `.platform/nginx/conf.d/proxy.conf` | `client_max_body_size 50M` (subida fotos Base64), `proxy_max_temp_file_size 0` |

### 4.3 `Procfile`

```procfile
web: npx prisma migrate deploy && npx prisma generate && node dist/server.cjs
```

> **Actualizado post-fix seguridad (2026-08-29)**: Antes era `prisma db push --accept-data-loss`. Ahora usa migraciones versionadas y seguras.

---

## 5. Variables de Entorno y Secrets

| Variable | Origen | Ambientes | Descripción |
|----------|--------|-----------|-------------|
| `DATABASE_URL` | Secrets Manager `/gestia/{env}/db_password` + RDS endpoint (inyectada por Terraform en EB setting) | dev/qa/prod | PostgreSQL connection string |
| `JWT_SECRET` | Secrets Manager `/gestia/{env}/jwt_secret` (inyectada por Terraform) | dev/qa/prod | Firma tokens access/refresh (rotar cada 90d) |
| `AWS_REGION` | GitHub env / EB config / Terraform var | us-east-1 | Región AWS |
| `S3_BUCKET_NAME` / `AWS_S3_BUCKET` | Terraform output / EB config | dev/qa/prod | Bucket fotos/PDFs (`gestia-{env}-photos`) |
| `GEMINI_API_KEY` | GitHub Secrets | dev/qa/prod | Google Gemini AI (Copiloto IA Dashboard) |
| `VITE_PWA_TECNICO` | GitHub Actions (build) | 1=dev/qa, 0=prod | Habilita PWA Service Worker solo técnico |
| `NODE_ENV` | EB config | production | Modo Express |
| `PORT` | EB config | 5000 | Puerto backend |
| `VITE_API_URL` | Terraform (Amplify env var) | dev/qa/prod | URL backend (CloudFront HTTPS) para frontend |

### 5.1 Secrets Manager

- **Paths**: `/gestia/dev/db_password`, `/gestia/dev/jwt_secret`, `/gestia/qa/...`, `/gestia/prod/...`
- **Acceso**: IAM Role EC2 (`beanstalk_ec2`) tiene policy `secretsmanager:GetSecretValue` sobre `arn:aws:secretsmanager:*:*:secret:gestia/{env}/*`
- **Rotación**: Manual actual. Deuda: automatizar rotación cada 90d.

---

## 6. Estrategia de Deployment

| Fase | Rama | Ambiente | Acción |
|------|------|----------|--------|
| **Desarrollo** | `dev` | `gestia-backend-dev` | Push → Auto-deploy (App Deploy + Terraform Apply si hay cambios infra) |
| **QA** | `qa` | `gestia-backend-qa` | Push/merge → Auto-deploy |
| **Producción** | `main` | `gestia-backend-prod` | PR → approval manual → Deploy |

### 6.1 Flujo de Build & Deploy (App)

1. `npm run build` → `dist/` (frontend) + `dist/server.cjs` (backend bundled)
2. `esbuild` para `seedUbigeo.cjs` y `seedCleanDb.cjs`
3. Empaquetado: `deploy.zip` con `dist/`, `prisma/`, `.ebextensions/`, `.platform/`, `package.json` (prod deps only), `Procfile`
4. Upload a S3 (`elasticbeanstalk-us-east-1-325580897755`)
5. `CreateApplicationVersion` → `UpdateEnvironment` (o `CreateEnvironment` si no existe)

### 6.2 Migraciones BD

- **Comando**: `prisma migrate deploy` (en Procfile, ejecuta al iniciar EB)
- **Migraciones existentes**: `20260719172458_init`, `20260719195653_multi_equipo_report`, `20260830_add_refresh_token` (post-fix seguridad)
- **No usar**: `prisma db push --accept-data-loss` (eliminado)

### 6.3 Rollback

- **App**: EB Console → "Deploy existing version" → seleccionar versión anterior
- **Infra**: `terraform apply -refresh-only` o `terraform apply` con plan previo
- **BD**: `prisma migrate resolve --rolled-back <migration>` + restore snapshot RDS si necesario

### 6.4 Blue-Green / Zero-Downtime

- **No implementado**: Single instance `t3.micro` (Free Tier), sin ALB en dev/qa
- **Deuda**: Migrar a ASG min=2 + ALB en prod; EB Immutable Deploy o CodeDeploy

---

## 7. Monitoreo y Alertas

| Componente | Métricas | Logs | Alertas (SNS) |
|------------|----------|------|---------------|
| **EB Health** | Health status, CPU, Memory, Latency | `/aws/elasticbeanstalk/gestia-{env}` | Health degraded > 5min |
| **RDS** | CPUUtilization, FreeStorageSpace, DatabaseConnections, Read/Write Latency | Enhanced monitoring (si habilitado) | Storage > 80%, CPU > 80% 15min |
| **S3** | NumberOfObjects, BucketSizeBytes, Requests | CloudTrail (data events) | — |
| **CloudFront** | Requests, 4xx/5xx rate, Latency | Standard logging (S3) | 5xx rate > 5% |
| **Deploy** | Workflow duration, success/failure | GitHub Actions logs | Deploy failure notification |

---

## 8. Diagramas (Enlaces)

- **Contexto AWS (SVG)**: `../Arquitectura AWS/arquitectura_aws_gestia_plantilla.svg`
- **Drawio editable**: `../Arquitectura AWS/arquitectura_aws_gestia_plantilla.drawio`
- **Visualizador interactivo**: `../Arquitectura AWS/visualizador_arquitectura_aws.html`

---

## 9. Deuda Técnica Infra

| Item | Impacto | Plan |
|------|---------|------|
| Single instance EB (no ASG) | Disponibilidad | Migrar a ASG min=2 en prod |
| No blue-green deploy | Riesgo deploy | Implementar EB immutable deploy o CodeDeploy |
| Terraform state local (no remote backend) | Colaboración | Migrar state a S3 + DynamoDB locking |
| Secrets rotación manual | Seguridad | Automatizar rotación JWT/DB password (Lambda + EventBridge) |
| No WAF/Shield | Seguridad | Añadir AWS WAF en CloudFront (rate limit, SQLi, XSS rules) |
| RDS backup_retention=0 en dev | Recuperabilidad | Habilitar backups 7d en dev/qa |
| CloudFront default certificate | Branding | Custom domain + ACM certificate en prod |
| Amplify CORS `*` en storage | Seguridad | Restringir `allowed_origins` a dominios reales en prod |

---

## 10. Referencias Cruzadas

- `Documentacion/architecture_c4.md §2` (Contenedores: CloudFront, EB, RDS, S3, Amplify, Secrets Manager)
- `Documentacion/architecture_c4.md §7` (Enlace a este doc)
- `Documentacion/data_dictionary.md` (Modelos BD)
- `Documentacion/analisis_funcional.md` (Reglas de negocio que usan infra)
- `Documentacion/guia_ui_ux.md` (Frontend en Amplify)
- `AGENTS.md` (Regla: cambios en `infra/`, `.github/workflows/`, `.ebextensions/`, `Procfile` → actualizar este doc)

---

## 11. Validación Cruzada (Checklist)

- [x] **Terraform modules**: 6 módulos documentados (networking, database, storage, backend, security, frontend)
- [x] **Workflows**: 4 workflows documentados (app-deploy, terraform-plan, terraform-apply, ec2-power-control)
- [x] **EB Config**: `.ebextensions` (2), `.platform/nginx` (1), `Procfile` documentados
- [x] **Secrets**: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `VITE_PWA_TECNICO`, etc. mapeados
- [x] **Cross-check C4**: Contenedores en §2 coinciden con módulos Terraform
- [x] **Cross-check server.ts**: `process.env.*` usados coinciden con variables documentadas

---

## 12. Historial de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-08-30 | Sistema | Creación inicial — consolida Terraform, CI/CD, EB, Secrets, Deployment |