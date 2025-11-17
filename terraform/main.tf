# ============================================
# MeuContrato - Infraestrutura AWS
# ============================================

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ============================================
# Networking (VPC, Subnets, etc.)
# ============================================

module "networking" {
  source = "./modules/networking"

  name_prefix            = local.name_prefix
  vpc_cidr               = var.vpc_cidr
  availability_zones     = var.availability_zones
  public_subnet_cidrs    = var.public_subnet_cidrs
  private_subnet_cidrs   = var.private_subnet_cidrs
  database_subnet_cidrs  = var.database_subnet_cidrs

  tags = local.common_tags
}

# ============================================
# IAM Roles e Policies
# ============================================

module "iam" {
  source = "./modules/iam"

  name_prefix           = local.name_prefix
  s3_bucket_arn         = module.s3.bucket_arn
  s3_replica_bucket_arn = var.enable_s3_replication ? module.s3.replica_bucket_arn : ""
  enable_s3_replication = var.enable_s3_replication

  tags = local.common_tags
}

# ============================================
# S3 (Buckets, Lifecycle, Versioning, Replication)
# ============================================

module "s3" {
  source = "./modules/s3"

  name_prefix     = local.name_prefix
  aws_region      = var.aws_region
  replica_region  = var.replica_region

  # Versioning
  enable_versioning = var.enable_s3_versioning

  # Lifecycle
  enable_lifecycle              = var.enable_s3_lifecycle
  lifecycle_glacier_ir_days     = var.s3_lifecycle_glacier_ir_days
  lifecycle_glacier_days        = var.s3_lifecycle_glacier_days
  lifecycle_deep_archive_days   = var.s3_lifecycle_deep_archive_days
  log_retention_days            = var.s3_log_retention_days

  # Replication
  enable_replication    = var.enable_s3_replication
  replication_role_arn  = var.enable_s3_replication ? module.iam.s3_replication_role_arn : ""

  # Encryption
  enable_encryption = var.enable_encryption

  tags = local.common_tags

  providers = {
    aws.replica = aws.replica
  }
}

# ============================================
# CloudFront CDN
# ============================================

module "cloudfront" {
  count  = var.enable_cloudfront ? 1 : 0
  source = "./modules/cloudfront"

  name_prefix   = local.name_prefix
  s3_bucket_id  = module.s3.bucket_id
  s3_bucket_arn = module.s3.bucket_arn
  s3_bucket_regional_domain_name = module.s3.bucket_regional_domain_name

  price_class  = var.cloudfront_price_class
  default_ttl  = var.cloudfront_default_ttl
  max_ttl      = var.cloudfront_max_ttl

  # Custom domain (opcional)
  domain_name     = var.domain_name
  certificate_arn = var.certificate_arn
  enable_custom_domain = var.enable_custom_domain

  tags = local.common_tags
}

# ============================================
# Database (RDS PostgreSQL) - A IMPLEMENTAR
# ============================================

# TODO: Implementar módulo database
# module "database" {
#   count  = var.enable_rds ? 1 : 0
#   source = "./modules/database"
#   ...
# }

# ============================================
# Cache (ElastiCache Redis) - A IMPLEMENTAR
# ============================================

# TODO: Implementar módulo cache
# module "cache" {
#   count  = var.enable_redis ? 1 : 0
#   source = "./modules/cache"
#   ...
# }

# ============================================
# ECS (Fargate) - A IMPLEMENTAR
# ============================================

# TODO: Implementar módulo ecs
# module "ecs" {
#   count  = var.enable_ecs ? 1 : 0
#   source = "./modules/ecs"
#   ...
# }

# ============================================
# Monitoring e Alarmes - A IMPLEMENTAR
# ============================================

# TODO: Implementar módulo monitoring
# module "monitoring" {
#   count  = var.enable_cloudwatch_alarms ? 1 : 0
#   source = "./modules/monitoring"
#   ...
# }

# ============================================
# Backup (AWS Backup) - A IMPLEMENTAR
# ============================================

# TODO: Implementar módulo backup
# module "backup" {
#   count  = var.enable_automated_backups ? 1 : 0
#   source = "./modules/backup"
#   ...
# }
