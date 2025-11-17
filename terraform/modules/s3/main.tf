# ============================================
# S3 Module - Buckets, Lifecycle, Versioning, Replication, Logs
# ============================================

# ============================================
# Bucket Principal (PDFs)
# ============================================

resource "aws_s3_bucket" "main" {
  bucket = "${var.name_prefix}-pdfs"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-pdfs"
    Purpose = "Armazenamento de PDFs de contratos"
  })
}

# Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# Criptografia
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  count  = var.enable_encryption ? 1 : 0
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policies
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  count  = var.enable_lifecycle ? 1 : 0
  bucket = aws_s3_bucket.main.id

  # Regra 1: Arquivamento progressivo de PDFs
  rule {
    id     = "archive-old-pdfs"
    status = "Enabled"

    filter {
      prefix = "contracts/"
    }

    # Transições
    transition {
      days          = var.lifecycle_glacier_ir_days
      storage_class = "GLACIER_IR"
    }

    transition {
      days          = var.lifecycle_glacier_days
      storage_class = "GLACIER"
    }

    transition {
      days          = var.lifecycle_deep_archive_days
      storage_class = "DEEP_ARCHIVE"
    }

    # Versões antigas
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "DEEP_ARCHIVE"
    }
  }

  # Regra 2: Cleanup de uploads incompletos
  rule {
    id     = "cleanup-multipart-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# ============================================
# Bucket de Logs
# ============================================

resource "aws_s3_bucket" "logs" {
  bucket = "${var.name_prefix}-logs"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-logs"
    Purpose = "Access logs do S3"
  })
}

# Block public access (logs)
resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle para logs
resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = var.log_retention_days
    }
  }
}

# Habilitar access logging no bucket principal
resource "aws_s3_bucket_logging" "main" {
  bucket = aws_s3_bucket.main.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access-logs/"
}

# ============================================
# Bucket de Réplica (Cross-Region Replication)
# ============================================

resource "aws_s3_bucket" "replica" {
  count    = var.enable_replication ? 1 : 0
  provider = aws.replica
  bucket   = "${var.name_prefix}-pdfs-replica"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-pdfs-replica"
    Purpose = "Réplica cross-region para DR"
  })
}

# Versioning (obrigatório para replicação)
resource "aws_s3_bucket_versioning" "replica" {
  count    = var.enable_replication ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.replica[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access (replica)
resource "aws_s3_bucket_public_access_block" "replica" {
  count    = var.enable_replication ? 1 : 0
  provider = aws.replica
  bucket   = aws_s3_bucket.replica[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Configuração de replicação
resource "aws_s3_bucket_replication_configuration" "main" {
  count  = var.enable_replication ? 1 : 0
  bucket = aws_s3_bucket.main.id
  role   = var.replication_role_arn

  rule {
    id       = "replicate-all-pdfs"
    status   = "Enabled"
    priority = 1

    filter {
      prefix = "contracts/"
    }

    destination {
      bucket        = aws_s3_bucket.replica[0].arn
      storage_class = "STANDARD_IA"  # Mais barato na réplica

      replication_time {
        status = "Enabled"
        time {
          minutes = 15  # RTC: replica em até 15 minutos
        }
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }

    delete_marker_replication {
      status = "Enabled"
    }
  }

  depends_on = [aws_s3_bucket_versioning.main]
}

# ============================================
# CORS (para upload direto do frontend)
# ============================================

resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]  # Restringir em produção
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
