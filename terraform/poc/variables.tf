# ============================================
# Variáveis - MeuContrato POC
# ============================================

variable "project_name" {
  description = "Nome do projeto"
  type        = string
  default     = "meucontrato"
}

variable "aws_region" {
  description = "Região AWS"
  type        = string
  default     = "us-east-1"
}

# ============================================
# EC2
# ============================================

variable "instance_type" {
  description = "Tipo de instância EC2"
  type        = string
  default     = "t3.micro" # Free tier elegível

  validation {
    condition     = contains(["t2.micro", "t3.micro", "t4g.micro", "t3.small", "t3.medium"], var.instance_type)
    error_message = "Instance type deve ser t2.micro, t3.micro, t4g.micro, t3.small ou t3.medium"
  }
}

variable "key_pair_name" {
  description = "Nome do par de chaves SSH (deve existir na AWS)"
  type        = string
}

variable "use_elastic_ip" {
  description = "Usar Elastic IP (recomendado para POC persistente)"
  type        = bool
  default     = true
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks permitidos para SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restringir ao seu IP em produção
}

# ============================================
# Secrets
# ============================================

variable "jwt_secret" {
  description = "JWT Secret (mínimo 32 caracteres)"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT Secret deve ter no mínimo 32 caracteres"
  }
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
  default     = "sk_test_placeholder"
}

variable "stripe_webhook_secret" {
  description = "Stripe Webhook Secret"
  type        = string
  sensitive   = true
  default     = "whsec_placeholder"
}

variable "db_password" {
  description = "Senha do PostgreSQL"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_password) >= 12
    error_message = "Senha do banco deve ter no mínimo 12 caracteres"
  }
}
