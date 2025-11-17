variable "name_prefix" {
  description = "Prefixo para nomes dos recursos"
  type        = string
}

variable "aws_region" {
  description = "Região AWS principal"
  type        = string
}

variable "replica_region" {
  description = "Região AWS para replicação"
  type        = string
}

variable "enable_versioning" {
  description = "Habilitar versionamento"
  type        = bool
  default     = true
}

variable "enable_lifecycle" {
  description = "Habilitar lifecycle policies"
  type        = bool
  default     = true
}

variable "lifecycle_glacier_ir_days" {
  description = "Dias até transição para Glacier IR"
  type        = number
  default     = 90
}

variable "lifecycle_glacier_days" {
  description = "Dias até transição para Glacier"
  type        = number
  default     = 180
}

variable "lifecycle_deep_archive_days" {
  description = "Dias até transição para Deep Archive"
  type        = number
  default     = 365
}

variable "log_retention_days" {
  description = "Dias de retenção de logs"
  type        = number
  default     = 90
}

variable "enable_replication" {
  description = "Habilitar cross-region replication"
  type        = bool
  default     = false
}

variable "replication_role_arn" {
  description = "ARN da role para replicação"
  type        = string
  default     = ""
}

variable "enable_encryption" {
  description = "Habilitar criptografia"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags para os recursos"
  type        = map(string)
  default     = {}
}
