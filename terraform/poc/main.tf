# ============================================
# MeuContrato POC - Terraform
# ============================================
# Versão POC: Tudo em uma única EC2 para demonstração
# Custo estimado: $0-15/mês (free tier elegível)

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "MeuContrato-POC"
      Environment = "poc"
      ManagedBy   = "Terraform"
    }
  }
}

# ============================================
# Data Sources
# ============================================

# AMI Ubuntu mais recente
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ============================================
# VPC e Networking (Simplificado)
# ============================================

# Usar VPC default para simplificar
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group
resource "aws_security_group" "poc" {
  name        = "meucontrato-poc-sg"
  description = "Security group para MeuContrato POC"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
    description = "SSH"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # Acesso direto ao backend (para debug)
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
    description = "Backend direto (debug)"
  }

  # Egress
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "meucontrato-poc-sg"
  }
}

# ============================================
# S3 Bucket (Simplificado)
# ============================================

resource "aws_s3_bucket" "poc" {
  bucket = "${var.project_name}-poc-pdfs"

  tags = {
    Name    = "${var.project_name}-poc-pdfs"
    Purpose = "POC - Armazenamento de PDFs"
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "poc" {
  bucket = aws_s3_bucket.poc.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Criptografia
resource "aws_s3_bucket_server_side_encryption_configuration" "poc" {
  bucket = aws_s3_bucket.poc.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS
resource "aws_s3_bucket_cors_configuration" "poc" {
  bucket = aws_s3_bucket.poc.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ============================================
# IAM Role para EC2
# ============================================

resource "aws_iam_role" "ec2" {
  name = "meucontrato-poc-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# Policy para acessar S3
resource "aws_iam_role_policy" "s3_access" {
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.poc.arn,
          "${aws_s3_bucket.poc.arn}/*"
        ]
      }
    ]
  })
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "meucontrato-poc-ec2-profile"
  role = aws_iam_role.ec2.name
}

# ============================================
# EC2 Instance
# ============================================

resource "aws_instance" "poc" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.poc.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size = 20 # GB
    volume_type = "gp3"
  }

  user_data = templatefile("${path.module}/user-data.sh", {
    aws_region            = var.aws_region
    s3_bucket             = aws_s3_bucket.poc.id
    jwt_secret            = var.jwt_secret
    gemini_api_key        = var.gemini_api_key
    stripe_secret_key     = var.stripe_secret_key
    stripe_webhook_secret = var.stripe_webhook_secret
    db_password           = var.db_password
  })

  tags = {
    Name = "meucontrato-poc"
  }
}

# ============================================
# Elastic IP (Opcional mas recomendado)
# ============================================

resource "aws_eip" "poc" {
  count    = var.use_elastic_ip ? 1 : 0
  instance = aws_instance.poc.id
  domain   = "vpc"

  tags = {
    Name = "meucontrato-poc-eip"
  }
}
