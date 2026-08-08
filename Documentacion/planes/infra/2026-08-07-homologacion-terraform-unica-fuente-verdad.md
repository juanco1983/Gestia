# Plan de Infraestructura: Homologación Completa de Terraform como Única Fuente de Verdad

**Fecha**: 2026-08-07  
**Estado**: Completado  
**Tipo**: Infraestructura / IaC / Multi-Ambiente  
**Objetivo**: Garantizar que la infraestructura como código (Terraform) esté 100% homologada entre los ambientes `dev`, `qa` y `prod`, permitiendo despliegues predecibles, reproducibles y sin fricción hacia Producción.

---

## 1. Contexto y Diagnóstico

Durante el despliegue del entorno QA se identificaron 3 aspectos críticos a estandarizar:
1. **Puerto de la Aplicación**: Nginx en AWS Elastic Beanstalk espera el puerto `5000` por defecto en Amazon Linux 2023. El módulo backend tenía hardcodeado `3001`, lo cual generaba errores 502 Bad Gateway.
2. **Estructura de Entornos Homólogos**: Existían configuraciones para `dev` y `qa`, pero faltaba la carpeta oficial de `prod` bajo los mismos estándares modulares.
3. **Manejo de Secretos e Identidad**: Variables sensibles (`db_password`, `jwt_secret`, `github_token`) deben estar parametrizadas vía variables de entorno (`TF_VAR_*`) y almacenadas en AWS Secrets Manager.

---

## 2. Alcance de la Homologación

| Módulo / Archivo | Cambio Realizado | Justificación |
|---|---|---|
| `infra/modules/backend/main.tf` | `PORT = "5000"` fijado como estándar | Elimina permanentemente el riesgo de 502 en Beanstalk |
| `infra/environments/prod/main.tf` | **[NUEVO]** VPC `10.2.0.0/16`, RDS `gestia_prod`, S3 `gestia-prod-photos`, Branch `main` | Aislamiento total de Producción |
| `infra/environments/prod/variables.tf` | **[NUEVO]** Variables homologadas con tipos y descripciones | Mismo contrato de entrada en todos los entornos |
| `infra/environments/prod/outputs.tf` | **[NUEVO]** Salidas de red, base de datos, backend y frontend | Verificación inmediata tras `terraform apply` |
| `server.ts` | Auto-seed de usuarios y clientes maestros en bases nuevas | Garantiza que cualquier BD nueva arranque con usuarios operativos |

---

## 3. Matriz de Entornos Homologados

| Atributo | DEV | QA | PROD |
|---|---|---|---|
| **Rama Git** | `dev` | `qa` | `main` |
| **VPC CIDR** | `10.0.0.0/16` | `10.1.0.0/16` | `10.2.0.0/16` |
| **Subredes Públicas** | `10.0.1.0/24`, `10.0.2.0/24` | `10.1.1.0/24`, `10.1.2.0/24` | `10.2.1.0/24`, `10.2.2.0/24` |
| **Subredes Privadas** | `10.0.10.0/24`, `10.0.11.0/24` | `10.1.10.0/24`, `10.1.11.0/24` | `10.2.10.0/24`, `10.2.11.0/24` |
| **RDS PostgreSQL 15** | `gestia` (`db.t3.micro`) | `gestia_qa` (`db.t3.micro`) | `gestia_prod` (`db.t3.micro` / extensible) |
| **S3 Bucket Fotos** | `gestia-dev-photos` | `gestia-qa-photos` | `gestia-prod-photos` |
| **Elastic Beanstalk Env** | `gestia-backend-dev` | `gestia-backend-qa` | `gestia-backend-prod` |
| **CloudFront CDN** | HTTPS Habilitado | HTTPS Habilitado | HTTPS Habilitado |
| **Amplify Branch** | `dev` | `qa` | `main` |

---

## 4. Guía de Ejecución para Producción

Cuando se decida aprovisionar la infraestructura de Producción, los pasos exactos son:

```powershell
# 1. Navegar al entorno de producción
cd infra/environments/prod

# 2. Inicializar Terraform con el backend remoto S3
terraform init

# 3. Configurar las variables sensibles de Producción
$env:TF_VAR_db_password  = "PasswordSeguroDeProduccion2026!"
$env:TF_VAR_jwt_secret   = "JWTSecretExtremadamenteLargoDeProduccion2026"
$env:TF_VAR_github_token = "ghp_tuTokenDeGitHub"

# 4. Planificar y validar cambios
terraform plan -out=tfplan

# 5. Aplicar la infraestructura
terraform apply tfplan
```

---

## 5. Criterios de Aceptación y Verificación

- [x] Módulos de Terraform sin errores de sintaxis (`terraform validate` passed).
- [x] Aislamiento estricto de red: rangos CIDR no colisionan entre entornos.
- [x] Sin credenciales crudas en el código fuente.
- [x] Puerto 5000 estandarizado para Nginx y Node.js.
- [x] Documentación de infraestructura sincronizada en `Documentacion/arquitectura_infraestructura_nube.md`.
