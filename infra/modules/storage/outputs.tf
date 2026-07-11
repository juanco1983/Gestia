output "photos_bucket_name" {
  description = "Nombre del bucket de fotos"
  value       = aws_s3_bucket.photos.bucket
}

output "photos_bucket_arn" {
  description = "ARN del bucket de fotos"
  value       = aws_s3_bucket.photos.arn
}
