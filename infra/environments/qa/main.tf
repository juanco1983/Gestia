##############################################
# AMBIENTE: QA
# Punto de entrada que orquesta todos los módulos para QA
# Región: us-east-1
##############################################

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend Remoto: estado en S3 para el ambiente QA
  backend "s3" {
    bucket         = "gestia-terraform-state"
    key            = "qa/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "gestia-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.env
      ManagedBy   = "Terraform"
      Repository  = "github.com/juanco1983/Gestia"
    }
  }
}

##############################################
# MÓDULOS (QA)
##############################################

module "networking" {
  source   = "../../modules/networking"
  project  = var.project
  env      = var.env
  vpc_cidr = "10.1.0.0/16"
  az_count = 2
}

module "security" {
  source      = "../../modules/security"
  project     = var.project
  env         = var.env
  vpc_id      = module.networking.vpc_id
  db_password = var.db_password
  jwt_secret  = var.jwt_secret
}

module "storage" {
  source  = "../../modules/storage"
  project = var.project
  env     = var.env
}

module "database" {
  source             = "../../modules/database"
  project            = var.project
  env                = var.env
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  rds_sg_id          = module.security.rds_sg_id
  db_password        = var.db_password
  db_name            = "gestia_qa"
  db_username        = "gestia_admin"
  instance_class     = "db.t3.micro"
  allocated_storage  = 20
}

module "backend" {
  source                     = "../../modules/backend"
  project                    = var.project
  env                        = var.env
  region                     = var.aws_region
  public_subnet_ids          = module.networking.public_subnet_ids
  backend_sg_id              = module.security.backend_sg_id
  beanstalk_instance_profile = module.security.beanstalk_instance_profile
  beanstalk_service_role_arn = module.security.beanstalk_service_role_arn
  db_host                    = module.database.db_host
  db_port                    = module.database.db_port
  db_name                    = module.database.db_name
  db_username                = module.database.db_username
  db_password                = var.db_password
  jwt_secret                 = var.jwt_secret
  photos_bucket_name         = module.storage.photos_bucket_name
  instance_type              = "t3.micro"
}

module "frontend" {
  source                  = "../../modules/frontend"
  project                 = var.project
  env                     = var.env
  github_repo             = var.github_repo
  github_token            = var.github_token
  backend_url             = module.backend.beanstalk_endpoint
  branch                  = "qa"
  custom_domain_name      = "perugenius.com"
  custom_subdomain_prefix = "qagestia"
}
