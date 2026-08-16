##############################################
# MÓDULO: security — variables.tf
##############################################

variable "project" { type = string }
variable "env" { type = string }
variable "vpc_id" { type = string }
variable "db_password" {
  type      = string
  sensitive = true
}
variable "jwt_secret" {
  type      = string
  sensitive = true
}
