output "db_endpoint" {
  description = "Endpoint de conexión a RDS (host:port)"
  value       = aws_db_instance.postgres.endpoint
}

output "db_host" {
  description = "Hostname de RDS"
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "Puerto de RDS"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Nombre de la base de datos"
  value       = aws_db_instance.postgres.db_name
}

output "db_username" {
  description = "Usuario de la base de datos"
  value       = aws_db_instance.postgres.username
}
