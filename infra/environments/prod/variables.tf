variable "aws_region" {
  description = "Región de AWS para desplegar la infraestructura"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Nombre del proyecto"
  type        = string
  default     = "gestia"
}

variable "env" {
  description = "Ambiente de despliegue (prod)"
  type        = string
  default     = "prod"
}

variable "db_password" {
  description = "Contraseña de la base de datos RDS PostgreSQL de Producción"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secreto para firmar tokens JWT en Producción"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "Repositorio de GitHub en formato 'usuario/repo'"
  type        = string
  default     = "juanco1983/Gestia"
}

variable "github_token" {
  description = "Personal Access Token de GitHub para AWS Amplify"
  type        = string
  sensitive   = true
}
