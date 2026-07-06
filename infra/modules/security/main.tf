##############################################
# MÓDULO: security — main.tf
# Recursos: Security Groups, IAM, Secrets Manager
##############################################

# ─── Security Group: Backend (EC2 / Elastic Beanstalk) ───────────────────────
resource "aws_security_group" "backend" {
  name        = "${var.project}-${var.env}-sg-backend"
  description = "SG para el servidor backend Node.js"
  vpc_id      = var.vpc_id

  # HTTP desde internet (Beanstalk lo redirige internamente)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS desde internet
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Puerto de la app Node.js (interno, desde el mismo SG)
  ingress {
    from_port = 3001
    to_port   = 3001
    protocol  = "tcp"
    self      = true
  }

  # Salida libre (para descargar dependencias, etc.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project}-${var.env}-sg-backend"
    Project = var.project
    Env     = var.env
  }
}

# ─── Security Group: Base de Datos (RDS) ─────────────────────────────────────
resource "aws_security_group" "rds" {
  name        = "${var.project}-${var.env}-sg-rds"
  description = "SG para RDS PostgreSQL — solo acceso desde backend"
  vpc_id      = var.vpc_id

  # PostgreSQL SOLO desde el SG del backend
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  # Sin salida directa al exterior
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project}-${var.env}-sg-rds"
    Project = var.project
    Env     = var.env
  }
}

# ─── IAM Role para Elastic Beanstalk (EC2 instance) ──────────────────────────
resource "aws_iam_role" "beanstalk_ec2" {
  name = "${var.project}-${var.env}-beanstalk-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = {
    Project = var.project
    Env     = var.env
  }
}

resource "aws_iam_role_policy_attachment" "beanstalk_web_tier" {
  role       = aws_iam_role.beanstalk_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "beanstalk_worker_tier" {
  role       = aws_iam_role.beanstalk_ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}

# Permite al EC2 leer secretos de Secrets Manager
resource "aws_iam_role_policy" "beanstalk_secrets" {
  name = "${var.project}-${var.env}-beanstalk-secrets-policy"
  role = aws_iam_role.beanstalk_ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
        Resource = "arn:aws:secretsmanager:*:*:secret:${var.project}/${var.env}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"]
        Resource = ["arn:aws:s3:::${var.project}-${var.env}-photos", "arn:aws:s3:::${var.project}-${var.env}-photos/*"]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "beanstalk_ec2" {
  name = "${var.project}-${var.env}-beanstalk-profile"
  role = aws_iam_role.beanstalk_ec2.name
}

# ─── IAM Role para Elastic Beanstalk (service role) ──────────────────────────
resource "aws_iam_role" "beanstalk_service" {
  name = "${var.project}-${var.env}-beanstalk-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "elasticbeanstalk.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "beanstalk_enhanced_health" {
  role       = aws_iam_role.beanstalk_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth"
}

resource "aws_iam_role_policy_attachment" "beanstalk_managed_updates" {
  role       = aws_iam_role.beanstalk_service.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy"
}

# ─── AWS Secrets Manager ──────────────────────────────────────────────────────
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.project}/${var.env}/db_password"
  description             = "Contraseña de RDS PostgreSQL para ${var.env}"
  recovery_window_in_days = 0

  tags = {
    Project = var.project
    Env     = var.env
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${var.project}/${var.env}/jwt_secret"
  description             = "JWT Secret para autenticación en ${var.env}"
  recovery_window_in_days = 0

  tags = {
    Project = var.project
    Env     = var.env
  }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}
