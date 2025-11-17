output "bucket_id" {
  description = "ID do bucket principal"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "ARN do bucket principal"
  value       = aws_s3_bucket.main.arn
}

output "bucket_regional_domain_name" {
  description = "Domain name regional do bucket"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "logs_bucket_id" {
  description = "ID do bucket de logs"
  value       = aws_s3_bucket.logs.id
}

output "logs_bucket_arn" {
  description = "ARN do bucket de logs"
  value       = aws_s3_bucket.logs.arn
}

output "replica_bucket_id" {
  description = "ID do bucket de réplica"
  value       = var.enable_replication ? aws_s3_bucket.replica[0].id : ""
}

output "replica_bucket_arn" {
  description = "ARN do bucket de réplica"
  value       = var.enable_replication ? aws_s3_bucket.replica[0].arn : ""
}
