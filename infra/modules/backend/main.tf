##############################################
# MÓDULO: backend — main.tf
# Recursos: Elastic Beanstalk + EC2 t3.micro
##############################################

locals {
  db_url = "postgresql://${var.db_username}:${var.db_password}@${var.db_host}:${var.db_port}/${var.db_name}?schema=public"
}

# ─── Elastic Beanstalk Application ───────────────────────────────────────────
resource "aws_elastic_beanstalk_application" "gestia" {
  name        = "${var.project}-backend"
  description = "Gestia Backend API - Node.js/Express/Prisma"

  tags = {
    Project = var.project
    Env     = var.env
  }
}

# ─── Elastic Beanstalk Environment (DEV) ─────────────────────────────────────
resource "aws_elastic_beanstalk_environment" "dev" {
  name                = "${var.project}-backend-${var.env}"
  application         = aws_elastic_beanstalk_application.gestia.name
  solution_stack_name = "64bit Amazon Linux 2023 v6.5.1 running Node.js 20"
  tier                = "WebServer"

  # ── Instancia ────────────────────────────────────────────────────────────────
  setting {
    namespace = "aws:ec2:instances"
    name      = "InstanceTypes"
    value     = var.instance_type  # t3.micro (Free Tier)
  }

  # ── Red: subnets públicas ────────────────────────────────────────────────────
  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = join(",", var.public_subnet_ids)
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "AssociatePublicIpAddress"
    value     = "true"
  }

  # ── Seguridad ─────────────────────────────────────────────────────────────────
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "SecurityGroups"
    value     = var.backend_sg_id
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = var.beanstalk_instance_profile
  }

  # ── Roles ─────────────────────────────────────────────────────────────────────
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = var.beanstalk_service_role_arn
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "EnvironmentType"
    value     = "SingleInstance"  # Sin ELB en DEV (gratis)
  }

  # ── Variables de entorno de la aplicación ────────────────────────────────────
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NODE_ENV"
    value     = var.env
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PORT"
    value     = "3001"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DATABASE_URL"
    value     = local.db_url
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "JWT_SECRET"
    value     = var.jwt_secret
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_S3_BUCKET"
    value     = var.photos_bucket_name
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_REGION"
    value     = var.region
  }

  # ── Health check ─────────────────────────────────────────────────────────────
  setting {
    namespace = "aws:elasticbeanstalk:healthreporting:system"
    name      = "SystemType"
    value     = "basic"  # Usa "enhanced" en PROD
  }

  setting {
    namespace = "aws:elasticbeanstalk:application"
    name      = "Application Healthcheck URL"
    value     = "/health"
  }

  # ── Logs ─────────────────────────────────────────────────────────────────────
  setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "StreamLogs"
    value     = "true"
  }

  setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "RetentionInDays"
    value     = "7"
  }

  tags = {
    Project = var.project
    Env     = var.env
  }
}
