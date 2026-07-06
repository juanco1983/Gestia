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
