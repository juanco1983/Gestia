output "beanstalk_endpoint" {
  description = "URL HTTPS (via CloudFront CDN) del backend Beanstalk"
  value       = "https://${aws_cloudfront_distribution.backend.domain_name}"
}

output "beanstalk_app_name" {
  description = "Nombre de la aplicación Beanstalk"
  value       = aws_elastic_beanstalk_application.gestia.name
}

output "beanstalk_env_name" {
  description = "Nombre del ambiente Beanstalk"
  value       = aws_elastic_beanstalk_environment.dev.name
}
