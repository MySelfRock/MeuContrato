# ============================================
# Outputs - Informações da Infraestrutura
# ============================================

# ============================================
# Networking
# ============================================

output "vpc_id" {
  description = "ID da VPC"
  value       = module.networking.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block da VPC"
  value       = module.networking.vpc_cidr_block
}

# ============================================
# S3
# ============================================

output "s3_bucket_name" {
  description = "Nome do bucket S3 principal"
  value       = module.s3.bucket_id
}

output "s3_bucket_arn" {
  description = "ARN do bucket S3 principal"
  value       = module.s3.bucket_arn
}

output "s3_replica_bucket_name" {
  description = "Nome do bucket S3 de réplica"
  value       = var.enable_s3_replication ? module.s3.replica_bucket_id : "N/A"
}

output "s3_logs_bucket_name" {
  description = "Nome do bucket de logs"
  value       = module.s3.logs_bucket_id
}

# ============================================
# CloudFront
# ============================================

output "cloudfront_distribution_id" {
  description = "ID da distribuição CloudFront"
  value       = var.enable_cloudfront ? module.cloudfront[0].distribution_id : "N/A"
}

output "cloudfront_domain_name" {
  description = "Domain name do CloudFront"
  value       = var.enable_cloudfront ? module.cloudfront[0].domain_name : "N/A"
}

output "cloudfront_url" {
  description = "URL completa do CloudFront"
  value       = var.enable_cloudfront ? "https://${module.cloudfront[0].domain_name}" : "N/A"
}

# ============================================
# IAM
# ============================================

output "ecs_task_role_arn" {
  description = "ARN da role de task do ECS"
  value       = module.iam.ecs_task_role_arn
}

output "s3_replication_role_arn" {
  description = "ARN da role de replicação do S3"
  value       = var.enable_s3_replication ? module.iam.s3_replication_role_arn : "N/A"
}

# ============================================
# Informações de Deploy
# ============================================

output "deployment_info" {
  description = "Informações importantes para o deploy"
  value = {
    environment = var.environment
    region      = var.aws_region

    # URLs
    cloudfront_url = var.enable_cloudfront ? "https://${module.cloudfront[0].domain_name}" : "N/A"

    # Recursos
    s3_bucket = module.s3.bucket_id
    vpc_id    = module.networking.vpc_id
  }
}

# ============================================
# Environment Variables para Backend
# ============================================

output "backend_env_vars" {
  description = "Variáveis de ambiente para o backend (copiar para .env)"
  value = {
    AWS_REGION                     = var.aws_region
    AWS_S3_BUCKET                  = module.s3.bucket_id
    AWS_CLOUDFRONT_ENABLED         = var.enable_cloudfront ? "true" : "false"
    AWS_CLOUDFRONT_DISTRIBUTION_ID = var.enable_cloudfront ? module.cloudfront[0].distribution_id : ""
    AWS_CLOUDFRONT_DOMAIN          = var.enable_cloudfront ? module.cloudfront[0].domain_name : ""
  }
  sensitive = true
}

# ============================================
# Comandos Úteis
# ============================================

output "useful_commands" {
  description = "Comandos úteis para gerenciar a infraestrutura"
  value = {
    # CloudFront
    cloudfront_invalidate = var.enable_cloudfront ? "aws cloudfront create-invalidation --distribution-id ${module.cloudfront[0].distribution_id} --paths '/*'" : "N/A"

    # S3
    s3_list_pdfs = "aws s3 ls s3://${module.s3.bucket_id}/contracts/ --region ${var.aws_region}"
  }
}

# ============================================
# Cost Estimation
# ============================================

output "estimated_monthly_cost" {
  description = "Estimativa de custo mensal (USD) - Apenas infraestrutura implementada"
  value = {
    note = "Valores aproximados baseados em uso médio"

    # S3
    s3_standard_100gb     = var.enable_s3_lifecycle ? "$2.30 (primeiros 90 dias)" : "$23.00/mês"
    s3_glacier_100gb      = var.enable_s3_lifecycle ? "$0.40 (90-180 dias)" : "N/A"
    s3_deep_archive_100gb = var.enable_s3_lifecycle ? "$0.10 (365+ dias)" : "N/A"
    s3_replication        = var.enable_s3_replication ? "$1.20 (cross-region)" : "N/A"

    # CloudFront
    cloudfront = var.enable_cloudfront ? "$8.50 (10k downloads/mês)" : "N/A"

    # Networking
    nat_gateway = "$32.00 (24/7)"

    # Total (apenas recursos implementados)
    total_monthly_implemented = "$35-45/mês (apenas S3, CloudFront e VPC)"

    # Futuro (quando todos os módulos estiverem implementados)
    total_monthly_full = "$150-200/mês (com RDS, Redis, ECS, ALB, CloudWatch)"
  }
}

# ============================================
# Próximos Passos
# ============================================

output "next_steps" {
  description = "Próximos passos após o deploy"
  value = {
    step1 = "Copiar variáveis de backend_env_vars para o .env do backend"
    step2 = "Testar upload de PDF para o bucket S3"
    step3 = "Verificar URL do CloudFront (pode demorar 15-20min para propagar)"
    step4 = "Implementar módulos restantes: database, cache, ecs"
    step5 = "Configurar CI/CD para deploy automático"
  }
}
