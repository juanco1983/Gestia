output "backend_sg_id" {
  description = "SG del backend"
  value       = aws_security_group.backend.id
}

output "rds_sg_id" {
  description = "SG de RDS"
  value       = aws_security_group.rds.id
}

output "beanstalk_instance_profile" {
  description = "Instance profile para Elastic Beanstalk"
  value       = aws_iam_instance_profile.beanstalk_ec2.name
}

output "beanstalk_service_role_arn" {
  description = "ARN del service role de Beanstalk"
  value       = aws_iam_role.beanstalk_service.arn
}

output "db_password_secret_arn" {
  description = "ARN del secreto de contraseña DB"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "jwt_secret_arn" {
  description = "ARN del secreto JWT"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}
