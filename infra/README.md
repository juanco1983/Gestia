# 🏗️ Gestia — Infraestructura AWS (Terraform IaC)

## Estructura

```
infra/
├── environments/
│   └── dev/          ← Ambiente de desarrollo
├── modules/
│   ├── networking/   ← VPC, subnets, routing
│   ├── security/     ← IAM, Security Groups, Secrets Manager
│   ├── database/     ← RDS PostgreSQL
│   ├── backend/      ← Elastic Beanstalk + EC2
│   ├── storage/      ← S3 buckets
│   └── frontend/     ← AWS Amplify
└── .github/workflows/ ← CI/CD pipelines
```

## Pre-requisitos

- Terraform >= 1.5
- AWS CLI configurado (`aws configure`)
- Permisos IAM: AdministratorAccess (para despliegue inicial)

## Uso rápido (ambiente DEV)

```bash
cd infra/environments/dev
terraform init
terraform plan
terraform apply
```

## Ramas

| Rama | Ambiente | Aplicación |
|------|----------|-----------|
| `dev` | DEV | Auto-apply al hacer push |
| `main` | PROD | Requiere aprobación manual |
