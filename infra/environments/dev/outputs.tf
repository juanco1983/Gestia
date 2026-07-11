##############################################
# OUTPUTS — Ambiente DEV
# Se muestran al finalizar terraform apply
##############################################

output "frontend_url" {
  description = "URL del frontend (Amplify DEV)"
  value       = module.frontend.frontend_url
}

output "backend_url" {
  description = "URL del backend API (Elastic Beanstalk)"
  value       = module.backend.beanstalk_endpoint
}

output "database_host" {
  description = "Host de la base de datos RDS"
  value       = module.database.db_host
}

output "photos_bucket" {
  description = "Nombre del bucket S3 de fotos"
  value       = module.storage.photos_bucket_name
}

output "vpc_id" {
  description = "ID de la VPC"
  value       = module.networking.vpc_id
}
