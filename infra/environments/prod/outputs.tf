output "vpc_id" {
  description = "ID de la VPC de Producción"
  value       = module.networking.vpc_id
}

output "database_host" {
  description = "Endpoint de la base de datos PostgreSQL de Producción"
  value       = module.database.db_host
}

output "backend_url" {
  description = "URL CloudFront HTTPS del backend API en Producción"
  value       = module.backend.cloudfront_url
}

output "frontend_url" {
  description = "URL pública de AWS Amplify para el frontend en Producción"
  value       = module.frontend.amplify_url
}

output "photos_bucket" {
  description = "Nombre del bucket S3 para fotos de Producción"
  value       = module.storage.photos_bucket_name
}
