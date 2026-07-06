##############################################
# MÓDULO: database — main.tf
# Recursos: RDS PostgreSQL (Free Tier)
##############################################

# ─── Subnet Group para RDS (subnets privadas) ────────────────────────────────
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.env}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name    = "${var.project}-${var.env}-db-subnet-group"
    Project = var.project
    Env     = var.env
  }
}

# ─── RDS PostgreSQL ───────────────────────────────────────────────────────────
resource "aws_db_instance" "postgres" {
  identifier = "${var.project}-${var.env}-postgres"

  # Engine
  engine         = "postgres"
  engine_version = "15"
  instance_class = var.instance_class   # db.t3.micro = Free Tier

  # Storage (Free Tier: 20 GB gp2)
  allocated_storage     = var.allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true

  # Credenciales
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Networking
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_sg_id]
  publicly_accessible    = false   # Solo accesible desde la VPC

  # Backups (desactivado en DEV para cumplir con la Capa Gratuita)
  backup_retention_period = 0
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Multi-AZ desactivado en DEV (ahorra costos)
  multi_az = false

  # Actualizaciones automáticas de minor version
  auto_minor_version_upgrade = true

  # En DEV: permite borrar sin snapshot final
  skip_final_snapshot       = true
  deletion_protection       = false

  # Performance Insights (gratuito en t3.micro)
  performance_insights_enabled = false

  tags = {
    Name    = "${var.project}-${var.env}-postgres"
    Project = var.project
    Env     = var.env
  }
}
