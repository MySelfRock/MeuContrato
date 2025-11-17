# ============================================
# Variáveis Gerais
# ============================================

variable "project_name" {
  description = "Nome do projeto"
  type        = string
  default     = "meucontrato"
}

variable "environment" {
  description = "Ambiente (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment deve ser dev, staging ou prod."
  }
}

variable "aws_region" {
  description = "Região AWS principal"
  type        = string
  default     = "us-east-1"
}

variable "replica_region" {
  description = "Região AWS para replicação cross-region"
  type        = string
  default     = "us-west-2"
}

variable "owner_email" {
  description = "Email do responsável pela infraestrutura"
  type        = string
}

# ============================================
# S3 e Storage
# ============================================

variable "enable_s3_versioning" {
  description = "Habilitar versionamento nos buckets S3"
  type        = bool
  default     = true
}

variable "enable_s3_replication" {
  description = "Habilitar replicação cross-region do S3"
  type        = bool
  default     = true
}

variable "enable_s3_lifecycle" {
  description = "Habilitar políticas de lifecycle no S3"
  type        = bool
  default     = true
}

variable "s3_lifecycle_glacier_ir_days" {
  description = "Dias até transição para Glacier Instant Retrieval"
  type        = number
  default     = 90
}

variable "s3_lifecycle_glacier_days" {
  description = "Dias até transição para Glacier"
  type        = number
  default     = 180
}

variable "s3_lifecycle_deep_archive_days" {
  description = "Dias até transição para Deep Archive"
  type        = number
  default     = 365
}

variable "s3_log_retention_days" {
  description = "Dias de retenção de logs no S3"
  type        = number
  default     = 90
}

# ============================================
# CloudFront
# ============================================

variable "enable_cloudfront" {
  description = "Habilitar CloudFront CDN"
  type        = bool
  default     = true
}

variable "cloudfront_price_class" {
  description = "Classe de preço do CloudFront"
  type        = string
  default     = "PriceClass_100" # US, Europe, Israel

  validation {
    condition = contains([
      "PriceClass_All",
      "PriceClass_200",
      "PriceClass_100"
    ], var.cloudfront_price_class)
    error_message = "Price class inválida."
  }
}

variable "cloudfront_default_ttl" {
  description = "TTL padrão do cache do CloudFront (segundos)"
  type        = number
  default     = 86400 # 24 horas
}

variable "cloudfront_max_ttl" {
  description = "TTL máximo do cache do CloudFront (segundos)"
  type        = number
  default     = 31536000 # 1 ano
}

# ============================================
# Rede (VPC)
# ============================================

variable "vpc_cidr" {
  description = "CIDR block da VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability Zones a serem utilizadas"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks das subnets públicas"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks das subnets privadas"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks das subnets de banco de dados"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
}

# ============================================
# Database (RDS)
# ============================================

variable "enable_rds" {
  description = "Habilitar RDS PostgreSQL"
  type        = bool
  default     = true
}

variable "db_instance_class" {
  description = "Classe da instância RDS"
  type        = string
  default     = "db.t4g.micro" # Free tier elegível
}

variable "db_allocated_storage" {
  description = "Armazenamento alocado para o RDS (GB)"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Armazenamento máximo para autoscaling (GB)"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Nome do banco de dados"
  type        = string
  default     = "meucontrato"
}

variable "db_username" {
  description = "Username do banco de dados"
  type        = string
  default     = "postgres"
}

variable "db_backup_retention_period" {
  description = "Período de retenção de backups (dias)"
  type        = number
  default     = 7
}

variable "db_multi_az" {
  description = "Habilitar Multi-AZ para alta disponibilidade"
  type        = bool
  default     = false # true em produção
}

# ============================================
# Cache (ElastiCache Redis)
# ============================================

variable "enable_redis" {
  description = "Habilitar ElastiCache Redis"
  type        = bool
  default     = true
}

variable "redis_node_type" {
  description = "Tipo de nó do Redis"
  type        = string
  default     = "cache.t4g.micro" # Free tier elegível
}

variable "redis_num_cache_nodes" {
  description = "Número de nós de cache"
  type        = number
  default     = 1
}

variable "redis_engine_version" {
  description = "Versão do Redis"
  type        = string
  default     = "7.0"
}

# ============================================
# ECS (Fargate)
# ============================================

variable "enable_ecs" {
  description = "Habilitar ECS Fargate para o backend"
  type        = bool
  default     = true
}

variable "ecs_cpu" {
  description = "CPU do Fargate (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 256
}

variable "ecs_memory" {
  description = "Memória do Fargate (MB)"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Número desejado de tasks"
  type        = number
  default     = 1 # 2+ em produção
}

variable "ecs_autoscaling_min" {
  description = "Mínimo de tasks no autoscaling"
  type        = number
  default     = 1
}

variable "ecs_autoscaling_max" {
  description = "Máximo de tasks no autoscaling"
  type        = number
  default     = 4
}

variable "ecs_autoscaling_cpu_target" {
  description = "Target de CPU para autoscaling (%)"
  type        = number
  default     = 70
}

# ============================================
# Application
# ============================================

variable "app_image" {
  description = "Docker image da aplicação"
  type        = string
  default     = "meucontrato/backend:latest"
}

variable "app_port" {
  description = "Porta da aplicação"
  type        = number
  default     = 3000
}

variable "jwt_secret" {
  description = "JWT Secret (mínimo 32 caracteres)"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Google Gemini API Key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe Secret Key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe Webhook Secret"
  type        = string
  sensitive   = true
}

# ============================================
# Monitoring e Logging
# ============================================

variable "enable_cloudwatch_logs" {
  description = "Habilitar CloudWatch Logs"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Dias de retenção de logs no CloudWatch"
  type        = number
  default     = 30
}

variable "enable_cloudwatch_alarms" {
  description = "Habilitar alarmes do CloudWatch"
  type        = bool
  default     = true
}

variable "alarm_email" {
  description = "Email para receber alertas"
  type        = string
}

# ============================================
# Domain e SSL
# ============================================

variable "domain_name" {
  description = "Nome do domínio (exemplo: api.meucontrato.com)"
  type        = string
  default     = ""
}

variable "enable_custom_domain" {
  description = "Habilitar domínio customizado"
  type        = bool
  default     = false
}

variable "certificate_arn" {
  description = "ARN do certificado SSL (ACM)"
  type        = string
  default     = ""
}

# ============================================
# Backup e Disaster Recovery
# ============================================

variable "enable_automated_backups" {
  description = "Habilitar backups automáticos"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Dias de retenção de backups"
  type        = number
  default     = 7
}

# ============================================
# Security
# ============================================

variable "allowed_cidr_blocks" {
  description = "CIDR blocks permitidos para acesso (admin)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restringir em produção
}

variable "enable_encryption" {
  description = "Habilitar criptografia em todos os recursos"
  type        = bool
  default     = true
}

# ============================================
# Cost Optimization
# ============================================

variable "enable_cost_optimization" {
  description = "Habilitar otimizações de custo"
  type        = bool
  default     = true
}

variable "enable_spot_instances" {
  description = "Usar Spot instances no ECS (não recomendado para prod)"
  type        = bool
  default     = false
}
