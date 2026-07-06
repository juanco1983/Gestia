output "beanstalk_endpoint" {
  description = "URL del ambiente Elastic Beanstalk"
  value       = "http://${aws_elastic_beanstalk_environment.dev.cname}"
}

output "beanstalk_app_name" {
  description = "Nombre de la aplicación Beanstalk"
  value       = aws_elastic_beanstalk_application.gestia.name
}

output "beanstalk_env_name" {
  description = "Nombre del ambiente Beanstalk"
  value       = aws_elastic_beanstalk_environment.dev.name
}
