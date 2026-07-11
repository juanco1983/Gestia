##############################################
# MÓDULO: networking
# Crea: VPC, subnets, IGW, routing tables
##############################################

variable "project" {
  description = "Nombre del proyecto"
  type        = string
}

variable "env" {
  description = "Ambiente: dev | prod"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block para la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Número de zonas de disponibilidad"
  type        = number
  default     = 2
}
