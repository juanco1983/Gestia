output "amplify_app_id" {
  description = "ID de la app en Amplify"
  value       = aws_amplify_app.gestia.id
}

output "amplify_default_domain" {
  description = "Dominio por defecto de Amplify"
  value       = aws_amplify_app.gestia.default_domain
}

output "frontend_url" {
  description = "URL del ambiente DEV en Amplify"
  value       = "https://${var.branch}.${aws_amplify_app.gestia.default_domain}"
}
