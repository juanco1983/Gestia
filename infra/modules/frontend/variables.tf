variable "project" {
  type = string
}

variable "env" {
  type = string
}

variable "github_repo" {
  type        = string
  description = "Formato: usuario/repo"
}

variable "github_token" {
  type      = string
  sensitive = true
}

variable "backend_url" {
  type = string
}

variable "branch" {
  type    = string
  default = "dev"
}

variable "custom_domain_name" {
  type        = string
  description = "El dominio raíz, ej. perugenius.com"
  default     = ""
}

variable "custom_subdomain_prefix" {
  type        = string
  description = "El prefijo para el subdominio, ej. qagestia"
  default     = ""
}

