##############################################
# VARIABLES — Ambiente QA
##############################################

variable "aws_region" {
  description = "Región AWS"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Nombre del proyecto (prefijo para todos los recursos)"
  type        = string
  default     = "gestia"
}

variable "env" {
  description = "Ambiente: dev | qa | prod"
  type        = string
  default     = "qa"
}

variable "db_password" {
  description = "Contraseña de la base de datos RDS PostgreSQL"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT Secret para firmar tokens de autenticación"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "Repositorio GitHub en formato usuario/repo"
  type        = string
  default     = "juanco1983/Gestia"
}

variable "github_token" {
  description = "GitHub Personal Access Token para conectar Amplify"
  type        = string
  sensitive   = true
}
