##############################################
# MÓDULO: frontend — main.tf
# Recursos: AWS Amplify (SPA React)
##############################################

resource "aws_amplify_app" "gestia" {
  name       = "${var.project}-frontend"
  repository = "https://github.com/${var.github_repo}"
  access_token = var.github_token

  # Build spec para React/Vite
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  # Regla de proxy para redireccionar /api/* al backend Beanstalk (vía CloudFront HTTPS)
  custom_rule {
    source = "/api/<*>"
    target = "${var.backend_url}/api/<*>"
    status = "200"
  }

  # Regla de rewrite para SPA (React Router)
  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>"
    target = "/index.html"
    status = "200"
  }

  # Variables de entorno del frontend
  environment_variables = {
    VITE_API_URL = var.backend_url
    NODE_ENV     = var.env
  }

  tags = {
    Project = var.project
    Env     = var.env
  }
}

# ─── Branch DEV → ambiente de desarrollo ─────────────────────────────────────
resource "aws_amplify_branch" "dev" {
  app_id      = aws_amplify_app.gestia.id
  branch_name = var.branch

  # Auto-deploy al hacer push a la rama
  enable_auto_build = true

  environment_variables = {
    VITE_API_URL = var.backend_url
    NODE_ENV     = "development"
  }

  tags = {
    Project = var.project
    Env     = var.env
  }
}

# ─── Asociación de Dominio Personalizado ──────────────────────────────────────
resource "aws_amplify_domain_association" "custom_domain" {
  count       = var.custom_domain_name != "" ? 1 : 0
  app_id      = aws_amplify_app.gestia.id
  domain_name = var.custom_domain_name
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.dev.branch_name
    prefix      = var.custom_subdomain_prefix
  }
}
