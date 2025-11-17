output "distribution_id" {
  description = "ID da distribuição CloudFront"
  value       = aws_cloudfront_distribution.main.id
}

output "domain_name" {
  description = "Domain name do CloudFront"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "arn" {
  description = "ARN da distribuição"
  value       = aws_cloudfront_distribution.main.arn
}
