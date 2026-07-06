##############################################
# MÓDULO: storage — main.tf
# Recursos: S3 para fotos técnicas
##############################################

# ─── S3: Fotos de informes técnicos ──────────────────────────────────────────
resource "aws_s3_bucket" "photos" {
  bucket = "${var.project}-${var.env}-photos"

  tags = {
    Name    = "${var.project}-${var.env}-photos"
    Project = var.project
    Env     = var.env
  }
}

# Acceso privado (sin acceso público)
resource "aws_s3_bucket_public_access_block" "photos" {
  bucket = aws_s3_bucket.photos.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Versionado (buena práctica: recuperar fotos accidentalmente borradas)
resource "aws_s3_bucket_versioning" "photos" {
  bucket = aws_s3_bucket.photos.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Ciclo de vida: mover fotos > 90 días a Glacier para ahorrar costos
resource "aws_s3_bucket_lifecycle_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id

  rule {
    id     = "archive-old-photos"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# Encriptación en reposo
resource "aws_s3_bucket_server_side_encryption_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS: permite al frontend subir fotos directamente (presigned URLs)
resource "aws_s3_bucket_cors_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]  # En PROD: reemplazar con el dominio real
    max_age_seconds = 3000
  }
}
