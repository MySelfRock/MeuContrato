# MeuContrato - Infraestrutura como Código (Terraform)

Infrastructure as Code (IaC) completa para deploy do MeuContrato na AWS usando Terraform.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Quickstart](#quickstart)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Módulos](#módulos)
- [Configuração](#configuração)
- [Deploy](#deploy)
- [Custos Estimados](#custos-estimados)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

## 🎯 Visão Geral

Este projeto Terraform provisiona toda a infraestrutura AWS necessária para rodar o MeuContrato em produção, incluindo:

### ✅ Implementado

- **S3**: Buckets com lifecycle, versioning, replication e access logs
- **CloudFront**: CDN global para entrega rápida de PDFs
- **IAM**: Roles e policies para S3, ECS e replicação
- **VPC**: Rede isolada com subnets públicas, privadas e de banco de dados
- **NAT Gateway**: Para conectividade de subnets privadas

### 🚧 Roadmap (a implementar)

- **RDS PostgreSQL**: Banco de dados gerenciado
- **ElastiCache Redis**: Cache distribuído
- **ECS Fargate**: Containers serverless para o backend
- **ALB**: Application Load Balancer
- **CloudWatch**: Logs, métricas e alarmes
- **AWS Backup**: Backups automáticos
- **Route53**: DNS e health checks

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                       │
│              (400+ Edge Locations Globalmente)               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                         AWS Region                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                         VPC                              │ │
│ │ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │ │
│ │ │   Public    │  │   Private   │  │  Database   │      │ │
│ │ │   Subnets   │  │   Subnets   │  │   Subnets   │      │ │
│ │ │             │  │             │  │             │      │ │
│ │ │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │      │ │
│ │ │ │   ALB   │ │  │ │   ECS   │ │  │ │   RDS   │ │      │ │
│ │ │ └─────────┘ │  │ │ Fargate │ │  │ │ (Futuro)│ │      │ │
│ │ │             │  │ └─────────┘ │  │ └─────────┘ │      │ │
│ │ │ ┌─────────┐ │  │             │  │             │      │ │
│ │ │ │   NAT   │ │  │ ┌─────────┐ │  │ ┌─────────┐ │      │ │
│ │ │ │ Gateway │ │  │ │  Redis  │ │  │ │  ...    │ │      │ │
│ │ │ └─────────┘ │  │ │ (Futuro)│ │  │ └─────────┘ │      │ │
│ │ └─────────────┘  └─────────────┘  └─────────────┘      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    S3 Buckets                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │   PDFs   │  │   Logs   │  │ Replica  │                  │
│  │ (Primary)│  │          │  │(us-west-2)│                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Pré-requisitos

### 1. Ferramentas Necessárias

```bash
# Terraform >= 1.5.0
terraform -v

# AWS CLI v2
aws --version

# (Opcional) tfenv para gerenciar versões do Terraform
tfenv install 1.5.0
tfenv use 1.5.0
```

### 2. Credenciais AWS

Configure suas credenciais AWS:

```bash
# Opção 1: AWS CLI
aws configure

# Opção 2: Variáveis de ambiente
export AWS_ACCESS_KEY_ID="sua-access-key"
export AWS_SECRET_ACCESS_KEY="sua-secret-key"
export AWS_DEFAULT_REGION="us-east-1"

# Opção 3: AWS SSO
aws sso login --profile meucontrato
export AWS_PROFILE=meucontrato
```

### 3. Permissões IAM Necessárias

O usuário/role precisa de permissões para criar:
- VPC, Subnets, Internet Gateway, NAT Gateway
- S3 Buckets, Bucket Policies
- CloudFront Distributions
- IAM Roles e Policies
- (Futuro) RDS, ElastiCache, ECS, ALB, etc.

## 🚀 Quickstart

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/MeuContrato.git
cd MeuContrato/terraform
```

### 2. Configure as Variáveis

```bash
# Copiar exemplo
cp terraform.tfvars.example terraform.tfvars

# Editar com seus valores
nano terraform.tfvars
```

Valores mínimos obrigatórios em `terraform.tfvars`:

```hcl
project_name = "meucontrato"
environment  = "dev"
owner_email  = "seu-email@example.com"

# Secrets (OBRIGATÓRIOS)
jwt_secret            = "sua-chave-jwt-minimo-32-caracteres"
gemini_api_key        = "sua-gemini-api-key"
stripe_secret_key     = "sk_test_..."
stripe_webhook_secret = "whsec_..."
alarm_email           = "alertas@example.com"
```

### 3. Inicializar Terraform

```bash
# Baixar providers e módulos
terraform init

# (Opcional) Validar configuração
terraform validate

# (Opcional) Formatar código
terraform fmt -recursive
```

### 4. Planejar o Deploy

```bash
# Ver o que será criado
terraform plan

# Salvar o plano
terraform plan -out=tfplan
```

### 5. Aplicar a Infraestrutura

```bash
# Aplicar plano salvo
terraform apply tfplan

# Ou aplicar diretamente (pedirá confirmação)
terraform apply
```

⏱️ **Tempo estimado**: 5-10 minutos

### 6. Obter Outputs

```bash
# Ver todos os outputs
terraform output

# Output específico
terraform output cloudfront_domain_name
terraform output s3_bucket_name

# Salvar outputs em JSON
terraform output -json > outputs.json
```

## 📁 Estrutura do Projeto

```
terraform/
├── main.tf                    # Orquestração principal
├── providers.tf               # Configuração de providers AWS
├── variables.tf               # Definição de variáveis
├── outputs.tf                 # Outputs da infraestrutura
├── terraform.tfvars.example   # Exemplo de valores
├── terraform.tfvars           # Seus valores (não commitar!)
├── .gitignore                 # Ignora arquivos sensíveis
│
├── modules/                   # Módulos reutilizáveis
│   ├── s3/                    # Buckets, lifecycle, versioning
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── cloudfront/            # CDN distribution
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── iam/                   # Roles e policies
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── networking/            # VPC, subnets, NAT
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── [Futuros módulos]
│       ├── database/          # RDS PostgreSQL
│       ├── cache/             # ElastiCache Redis
│       ├── ecs/               # ECS Fargate
│       ├── monitoring/        # CloudWatch
│       └── backup/            # AWS Backup
│
└── environments/              # Configurações por ambiente
    ├── dev/
    │   └── terraform.tfvars
    ├── staging/
    │   └── terraform.tfvars
    └── prod/
        └── terraform.tfvars
```

## 🧩 Módulos

### 1. S3 Module

Gerencia buckets S3 com todas as otimizações:

**Recursos criados:**
- ✅ Bucket principal de PDFs
- ✅ Bucket de logs
- ✅ Bucket de réplica (cross-region)
- ✅ Lifecycle policies (Glacier, Deep Archive)
- ✅ Versioning
- ✅ Criptografia AES256
- ✅ Access logging
- ✅ Cross-region replication
- ✅ CORS configuration

**Exemplo de uso:**

```hcl
module "s3" {
  source = "./modules/s3"

  name_prefix               = "meucontrato-prod"
  enable_versioning         = true
  enable_lifecycle          = true
  enable_replication        = true
  lifecycle_glacier_ir_days = 90
  # ...
}
```

### 2. CloudFront Module

CDN global para PDFs:

**Recursos criados:**
- ✅ CloudFront Distribution
- ✅ Origin Access Identity (OAI)
- ✅ S3 Bucket Policy para CloudFront
- ✅ SSL/TLS com ACM (opcional)
- ✅ Custom domain (opcional)

**Benefícios:**
- 🚀 Latência reduzida em ~70%
- 🌍 400+ edge locations
- 💰 Economia em transferência S3
- 🔒 HTTPS obrigatório

### 3. IAM Module

Roles e policies:

**Recursos criados:**
- ✅ S3 Replication Role
- ✅ ECS Task Execution Role
- ✅ ECS Task Role (com permissões S3 e CloudFront)

### 4. Networking Module

Rede isolada:

**Recursos criados:**
- ✅ VPC
- ✅ Subnets públicas (2 AZs)
- ✅ Subnets privadas (2 AZs)
- ✅ Subnets de banco de dados (2 AZs)
- ✅ Internet Gateway
- ✅ NAT Gateway
- ✅ Route Tables

## ⚙️ Configuração

### Variáveis Importantes

#### S3 e Storage

```hcl
enable_s3_versioning  = true   # Proteção contra deleção
enable_s3_replication = true   # Cross-region backup
enable_s3_lifecycle   = true   # Otimização de custos

# Lifecycle (dias)
s3_lifecycle_glacier_ir_days   = 90
s3_lifecycle_glacier_days      = 180
s3_lifecycle_deep_archive_days = 365
```

#### CloudFront

```hcl
enable_cloudfront      = true
cloudfront_price_class = "PriceClass_100"  # US, Europe, Israel
cloudfront_default_ttl = 86400             # 24 horas
cloudfront_max_ttl     = 31536000          # 1 ano
```

#### Ambientes

```hcl
# Development
environment       = "dev"
ecs_desired_count = 1
db_multi_az       = false

# Production
environment       = "prod"
ecs_desired_count = 3
db_multi_az       = true
```

### Backends Remotos (Recomendado)

Para equipes, use backend remoto no S3:

```hcl
# providers.tf
terraform {
  backend "s3" {
    bucket         = "meucontrato-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "meucontrato-terraform-locks"
  }
}
```

Criar bucket de estado:

```bash
# Criar bucket
aws s3 mb s3://meucontrato-terraform-state --region us-east-1

# Habilitar versioning
aws s3api put-bucket-versioning \
  --bucket meucontrato-terraform-state \
  --versioning-configuration Status=Enabled

# Criar tabela DynamoDB para locks
aws dynamodb create-table \
  --table-name meucontrato-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## 🚀 Deploy

### Deploy Completo

```bash
# 1. Inicializar
terraform init

# 2. Planejar
terraform plan -out=tfplan

# 3. Revisar mudanças
# ... verificar output ...

# 4. Aplicar
terraform apply tfplan

# 5. Ver outputs
terraform output
```

### Deploy por Módulo (Targets)

```bash
# Apenas S3
terraform apply -target=module.s3

# Apenas CloudFront
terraform apply -target=module.cloudfront

# Apenas Networking
terraform apply -target=module.networking
```

### Destroy (Cuidado!)

```bash
# Ver o que será destruído
terraform plan -destroy

# Destruir tudo
terraform destroy

# Destruir módulo específico
terraform destroy -target=module.cloudfront
```

## 💰 Custos Estimados

### Configuração Mínima (Free Tier)

| Recurso | Configuração | Custo/mês |
|---------|-------------|-----------|
| S3 Standard (< 90d) | 100GB | $2.30 |
| S3 Glacier IR | 100GB | $0.40 |
| S3 Deep Archive | 100GB | $0.10 |
| CloudFront | 10k downloads | $8.50 |
| S3 Replication | 100GB | $1.20 |
| NAT Gateway | 24/7 | $32.00 |
| **Total** | | **~$45/mês** |

### Configuração Produção

| Recurso | Configuração | Custo/mês |
|---------|-------------|-----------|
| Acima | - | $45 |
| RDS (db.t4g.small) | Multi-AZ | $35 |
| ElastiCache (cache.t4g.small) | - | $25 |
| ECS Fargate | 3 tasks x 512MB | $45 |
| ALB | - | $23 |
| CloudWatch | Logs + Metrics | $10 |
| **Total** | | **~$183/mês** |

### Otimizações de Custo

✅ **Implementadas:**
- Lifecycle policies (economia de ~90% em storage antigo)
- CloudFront (economia em transferência S3)
- Versioning seletivo

🔜 **Futuras:**
- Reserved Instances (RDS/ElastiCache)
- Savings Plans (ECS Fargate)
- S3 Intelligent-Tiering
- CloudFront Reserved Capacity

## 🔧 Troubleshooting

### Erro: "Error acquiring the state lock"

```bash
# Listar locks
aws dynamodb scan --table-name meucontrato-terraform-locks

# Forçar unlock (apenas se tiver certeza)
terraform force-unlock LOCK_ID
```

### Erro: "Access Denied" no S3

```bash
# Verificar permissões IAM
aws iam get-user

# Verificar bucket policy
aws s3api get-bucket-policy --bucket meucontrato-dev-pdfs
```

### CloudFront demora para atualizar

CloudFront pode levar 15-20 minutos para propagar mudanças globalmente.

```bash
# Verificar status
aws cloudfront get-distribution --id E123456789

# Invalidar cache (forçar atualização)
aws cloudfront create-invalidation \
  --distribution-id E123456789 \
  --paths "/*"
```

### Destruição falhando (buckets não vazios)

```bash
# Esvaziar buckets antes de destruir
aws s3 rm s3://meucontrato-dev-pdfs --recursive
aws s3 rm s3://meucontrato-dev-logs --recursive

# Então destruir
terraform destroy
```

## 📚 Comandos Úteis

```bash
# Formatar código
terraform fmt -recursive

# Validar configuração
terraform validate

# Ver estado atual
terraform show

# Listar recursos
terraform state list

# Ver recurso específico
terraform state show module.s3.aws_s3_bucket.main

# Importar recurso existente
terraform import module.s3.aws_s3_bucket.main meu-bucket-existente

# Refresh state
terraform refresh

# Graph (visualização)
terraform graph | dot -Tsvg > graph.svg
```

## 🗺️ Roadmap

### Fase 1: Storage e CDN ✅ (Completo)
- [x] S3 Buckets
- [x] Lifecycle Policies
- [x] Versioning
- [x] Cross-Region Replication
- [x] Access Logs
- [x] CloudFront CDN
- [x] IAM Roles
- [x] VPC e Networking

### Fase 2: Application Layer 🚧 (Próximo)
- [ ] RDS PostgreSQL
- [ ] ElastiCache Redis
- [ ] ECS Fargate
- [ ] Application Load Balancer
- [ ] Auto Scaling
- [ ] Secrets Manager

### Fase 3: Observabilidade 📋 (Futuro)
- [ ] CloudWatch Logs
- [ ] CloudWatch Metrics
- [ ] CloudWatch Alarms
- [ ] SNS Topics
- [ ] CloudTrail
- [ ] AWS X-Ray

### Fase 4: Backup e DR 📋 (Futuro)
- [ ] AWS Backup Plans
- [ ] RDS Snapshots
- [ ] S3 Cross-Region Replication
- [ ] Disaster Recovery Runbook

### Fase 5: Security e Compliance 📋 (Futuro)
- [ ] WAF Rules
- [ ] Shield Protection
- [ ] GuardDuty
- [ ] Security Hub
- [ ] Config Rules
- [ ] KMS Keys

## 📞 Suporte

- **Documentação oficial**: [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- **Issues**: Abra uma issue no GitHub
- **Slack**: #infrastructure

## 📄 Licença

MIT License - veja [LICENSE](../LICENSE)

---

**Desenvolvido com ❤️ pela equipe MeuContrato**
