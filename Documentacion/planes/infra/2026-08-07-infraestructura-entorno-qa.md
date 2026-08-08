# Plan de Infraestructura: Entorno QA y Estrategia Multi-Cuenta AWS

## 📌 1. Objetivo y Alcance
Establecer y documentar la infraestructura del entorno de **Calidad y Aseguramiento (QA)** en AWS (`gestia-backend-qa`, `gestia-qa-db`, `gestia-qa-photos`), la rama de Git **`qa`** en GitHub, y la canalización CI/CD (`.github/workflows/app-deploy.yml` y `terraform-apply.yml`) para permitir despliegues automáticos e independientes, junto con las mejores prácticas de **Estrategia Multi-Cuenta (AWS Organizations)** para aislar Dev, QA y Prod.

---

## 📊 2. Evaluación de Eficiencia del Despliegue Actual vs. Alternativas

### A. Diagnóstico de la Arquitectura Actual (Elastic Beanstalk + Amplify + RDS)
Actualmente, el backend de la aplicación se despliega mediante **AWS Elastic Beanstalk (EC2 `t3.micro` AL2023)** y la base de datos corre en **AWS RDS PostgreSQL 15 (`db.t3.micro`)**.

- **Puntos Fuertes**:
  - Muy bajo costo en Free Tier (~$15-$25/mes por ambiente).
  - Manejo transparente de Nginx, variables de entorno y certificados CloudFront HTTPS.
- **Inconvenientes / Cuellos de Botella de Eficiencia**:
  1. **Velocidad de Deploy**: Elastic Beanstalk toma entre 3 a 6 minutos por actualización debido a la reinicialización de la instancia EC2 y Nginx.
  2. **Script de Inicialización en DB**: El `Procfile` actual ejecuta `prisma db push --accept-data-loss` en el arranque del servidor, lo que genera riesgo de alteración de esquema si se ejecuta sin control.
  3. **Límite de Memoria (`t3.micro`)**: Las instancias EC2 de 1GB de RAM sufren presión de memoria si se compila en servidor (aliviado actualmente con swap de 2GB y builds compilados previamente en GitHub Actions).

### B. Alternativa de Mayor Eficiencia a Futuro: AWS App Runner / ECS Fargate (Docker)
Para proyectos en crecimiento, migrar el backend a **AWS App Runner** o **ECS Fargate**:
- **Ventaja 1**: Despliegue ultrasensible mediante imágenes Docker compiladas previamente en ECR (tiempos de deploy < 2 minutos).
- **Ventaja 2**: Auto-scaling verdadero (puede escalar a 0 en horarios fuera de oficina, reduciendo costos).
- **Ventaja 3**: Aislamiento 100% libre de parches de OS o dependencias de plataforma AL2023.

---

## 🏗️ 3. Topología de Infraestructura para Entorno QA

Para el entorno **QA**, se utiliza la arquitectura modular de Terraform (`infra/environments/qa`), manteniendo paridad 1:1 con `dev` y `prod`:

```mermaid
flowchart TD
    GitQA["Git Branch: qa\n(github.com/juanco1983/Gestia)"] --> GHActions["GitHub Actions CI/CD"]
    
    subgraph AWS_QA ["AWS Environment: QA (us-east-1)"]
        GHActions -- "app-deploy.yml" --> EB_QA["Elastic Beanstalk\ngestia-backend-qa"]
        GHActions -- "terraform apply" --> Amplify_QA["AWS Amplify QA Branch\nhttps://qa.amplifyapp.com"]
        
        EB_QA <--> RDS_QA[("RDS PostgreSQL 15\ngestia-qa-db")]
        EB_QA <--> S3_QA[("S3 Bucket\ngestia-qa-photos")]
        EB_QA <--> Secrets_QA[("Secrets Manager\n/gestia/qa/*")]
    end
```

---

## 📝 4. Estado del Plan de Ejecución

### Fase 1: Control de Versiones (Git)
- [x] Crear la rama `qa` a partir de `dev`: `git checkout -b qa`
- [x] Realizar `git push origin qa` para publicar la rama en GitHub.

### Fase 2: Infraestructura como Código (Terraform `infra/environments/qa`)
- [x] Crear directorio `infra/environments/qa/` clonando la configuración modular de `dev`.
- [x] Definir `main.tf`, `variables.tf` y `outputs.tf` con sufijo `qa` (`env = "qa"`).
- [x] Configurar el backend remoto S3 de estado: `key = "qa/terraform.tfstate"`.

### Fase 3: CI/CD Pipelines (`.github/workflows/`)
- [x] Modificar `.github/workflows/app-deploy.yml`:
  - Agregar `qa` a las ramas del trigger `push`.
  - Configurar mapeo de ambiente: `github.ref_name == 'qa' -> gestia-backend-qa`.
- [x] Modificar `.github/workflows/terraform-apply.yml`:
  - Agregar trigger y mapeo a `infra/environments/qa`.

### Fase 4: Optimización del Despliegue y Migración de BD
- [x] Configuración de Pre-Signed URLs seguras en AWS S3 con expiración a 15 min.
- [x] Fallback y borrado en cascada automatizado en S3 y BD.

---

## 🏛️ 5. Mejores Prácticas AWS: Estrategia Multi-Cuenta (AWS Organizations)

> **Recomendación de Arquitectura de Seguridad**: En AWS Well-Architected Framework, separar entornos por **Cuentas AWS Independientes** (`Management/Root`, `Dev Account`, `QA Account`, `Prod Account`) es la mejor práctica estándar frente a usar una única cuenta con nombres/etiquetas.

### Estructura Recomendada de AWS Organizations:

```mermaid
graph TD
    Root["AWS Root / Management Account\n(Facturación Consolidada & SCPs)"] --> OU_Core["OU: Core / Shared Services"]
    Root --> OU_Apps["OU: Workloads"]
    
    OU_Core --> Acc_Sec["Cuenta: Security & Audit\n(CloudTrail, GuardDuty)"]
    OU_Core --> Acc_CICD["Cuenta: Shared CI/CD / ECR\n(Artefactos e Imágenes)"]
    
    OU_Apps --> Acc_Dev["Cuenta AWS: DEV\n(325580897755 - Sandbox Developers)"]
    OU_Apps --> Acc_QA["Cuenta AWS: QA\n(Entorno de Pruebas y Certificación)"]
    OU_Apps --> Acc_Prod["Cuenta AWS: PROD\n(Entorno Productivo Crítico)"]
```

### Beneficios del Aislamiento por Cuentas:
1. **Radio de Impacto Cero (Blast Radius)**: Un error en un despliegue o comando de destrucción (`terraform destroy` o `wipe-operational-db`) en `dev` o `qa` **jamás** afectará la infraestructura ni los datos de Producción.
2. **Límites de Servicio Aislados (Service Quotas)**: Evita que el consumo intensivo de APIs, BD o vCPUs en QA bloquee las cuotas de Producción.
3. **Facturación Transparente**: Facturación unificada vía **AWS Organizations (Consolidated Billing)** manteniendo la visibilidad exacta de costos por cada cuenta/entorno sin mezclar consumos.
4. **Seguridad IAM estricta**: Los roles OIDC de GitHub Actions solo pueden asumir la cuenta correspondiente al branch (`dev` ➔ Cuenta Dev, `qa` ➔ Cuenta QA, `main` ➔ Cuenta Prod).
