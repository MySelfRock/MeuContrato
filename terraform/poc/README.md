# MeuContrato POC - Infraestrutura Terraform

Deploy simplificado do MeuContrato para demonstrações e provas de conceito.

## 🎯 Visão Geral

Esta é uma versão **ultra-enxuta** do MeuContrato, perfeita para:
- ✅ Demonstrações de produto
- ✅ Provas de conceito (POC)
- ✅ Testes rápidos
- ✅ Apresentações para clientes
- ✅ Validação de ideias

**Tudo roda em uma única máquina EC2** usando Docker Compose.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         Internet (Port 80/443)          │
└─────────────────┬───────────────────────┘
                  │
          ┌───────▼────────┐
          │   EC2 t3.micro │ <- Tudo aqui!
          │                │
          │ ┌────────────┐ │
          │ │   Nginx    │ │ (Reverse Proxy)
          │ └─────┬──────┘ │
          │       │        │
          │ ┌─────▼──────┐ │
          │ │  Backend   │ │ (Node.js)
          │ │  (Docker)  │ │
          │ └──┬─────┬───┘ │
          │    │     │     │
          │ ┌──▼──┐ ┌▼───┐ │
          │ │ PG  │ │Redis│ │ (Docker)
          │ └─────┘ └────┘ │
          └────────────────┘
                  │
          ┌───────▼────────┐
          │   S3 Bucket    │ (PDFs)
          └────────────────┘
```

## 💰 Custo Estimado

| Recurso | Configuração | Custo/mês |
|---------|-------------|-----------|
| **EC2** | t3.micro | $0.00 (free tier) ou $7.50 |
| **S3** | 10GB | $0.23 |
| **Elastic IP** | Associado | $0.00 |
| **Transferência** | < 100GB | $0.00 (free tier) |
| **TOTAL** | | **$0-15/mês** ✅ |

**Free Tier AWS:**
- 750 horas/mês de EC2 t2/t3.micro por 12 meses
- 5GB de S3 por 12 meses
- 15GB de transferência de dados por 12 meses

## 📋 Pré-requisitos

### 1. Ferramentas

```bash
# Terraform >= 1.5.0
terraform -v

# AWS CLI v2
aws --version

# Configurar credenciais AWS
aws configure
```

### 2. Key Pair SSH

Você precisa de um par de chaves SSH na AWS:

**Opção 1: Via AWS Console**
1. Acesse [AWS Console → EC2 → Key Pairs](https://console.aws.amazon.com/ec2/home#KeyPairs)
2. Clique em "Create Key Pair"
3. Nome: `meucontrato-poc-key`
4. Tipo: RSA
5. Formato: `.pem`
6. Salve o arquivo em `~/.ssh/meucontrato-poc-key.pem`
7. `chmod 400 ~/.ssh/meucontrato-poc-key.pem`

**Opção 2: Via AWS CLI**
```bash
aws ec2 create-key-pair \
  --key-name meucontrato-poc-key \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/meucontrato-poc-key.pem

chmod 400 ~/.ssh/meucontrato-poc-key.pem
```

### 3. Secrets

Você vai precisar:
- ✅ **JWT Secret** (32+ caracteres): `openssl rand -base64 32`
- ✅ **Gemini API Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- ⚠️ **Stripe Keys** (opcional para POC)
- ✅ **DB Password** (12+ caracteres): `openssl rand -base64 16`

## 🚀 Deploy Rápido (5 minutos)

### 1. Clonar e Configurar

```bash
# Entrar no diretório POC
cd terraform/poc/

# Copiar configuração exemplo
cp terraform.tfvars.example terraform.tfvars

# Editar com seus valores
nano terraform.tfvars
```

**Mínimo obrigatório em `terraform.tfvars`:**

```hcl
key_pair_name  = "meucontrato-poc-key"  # Nome do seu key pair
jwt_secret     = "sua-chave-jwt-aqui"
gemini_api_key = "sua-gemini-api-key"
db_password    = "senha-postgres-aqui"
```

### 2. Deploy

```bash
# Inicializar Terraform
terraform init

# Ver o que será criado
terraform plan

# Criar infraestrutura
terraform apply
# Digite 'yes' quando solicitado
```

⏱️ **Tempo:** 5-10 minutos

### 3. Acessar

```bash
# Ver outputs
terraform output

# Pegar URL da aplicação
terraform output application_url

# Acessar via SSH
terraform output ssh_command
```

**URLs importantes:**
- **Aplicação:** `http://SEU_IP`
- **API:** `http://SEU_IP/api`
- **Health:** `http://SEU_IP/health`

## 📊 Após o Deploy

### Verificar Status

```bash
# SSH na instância
ssh -i ~/.ssh/meucontrato-poc-key.pem ubuntu@SEU_IP

# Ver status dos containers
sudo meucontrato-status

# Ver logs
cd /opt/meucontrato
docker-compose logs -f
```

### Estrutura na EC2

```
/opt/meucontrato/
├── docker-compose.yml    # Stack completa
├── .env                  # Variáveis de ambiente
├── nginx/
│   └── nginx.conf        # Configuração Nginx
├── backend/              # Código do backend
└── data/
    ├── postgres/         # Dados PostgreSQL
    └── redis/            # Dados Redis
```

### Containers Criados

```bash
docker ps

# Você verá:
# - meucontrato-nginx     (Nginx)
# - meucontrato-backend   (Node.js)
# - meucontrato-postgres  (PostgreSQL)
# - meucontrato-redis     (Redis)
```

## 🔧 Gerenciamento

### Comandos Úteis

```bash
# SSH
ssh -i ~/.ssh/meucontrato-poc-key.pem ubuntu@SEU_IP

# Status
sudo meucontrato-status

# Ver logs
cd /opt/meucontrato && docker-compose logs -f

# Reiniciar tudo
cd /opt/meucontrato && docker-compose restart

# Parar
cd /opt/meucontrato && docker-compose stop

# Iniciar
cd /opt/meucontrato && docker-compose start

# Rebuild
cd /opt/meucontrato && docker-compose up -d --build
```

### Atualizar Backend

```bash
# SSH na instância
ssh -i ~/.ssh/meucontrato-poc-key.pem ubuntu@SEU_IP

# Atualizar código
cd /opt/meucontrato/backend
git pull  # ou substituir código

# Rebuild container
cd /opt/meucontrato
docker-compose up -d --build backend
```

### Backup do Banco de Dados

```bash
# Backup
docker exec meucontrato-postgres pg_dump \
  -U postgres meucontrato > backup.sql

# Restore
cat backup.sql | docker exec -i meucontrato-postgres \
  psql -U postgres meucontrato
```

## 🔒 Segurança

### ⚠️ IMPORTANTE para Produção

Esta POC tem configurações simplificadas para facilitar demonstrações. **NÃO use em produção sem:**

1. **Restringir SSH:**
```hcl
# terraform.tfvars
allowed_ssh_cidr = ["SEU_IP/32"]  # Apenas seu IP
```

2. **HTTPS:**
- Adicionar certificado SSL
- Configurar domínio próprio
- Usar Let's Encrypt

3. **Secrets Manager:**
- Usar AWS Secrets Manager
- Não colocar secrets no .env

4. **Firewall:**
- Configurar Security Groups restritivos
- Usar VPC privada

5. **Backups:**
- Configurar snapshots automáticos
- Backup regular do banco de dados

## 📝 Logs e Debugging

### Ver Logs de Containers

```bash
# Todos os containers
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas nginx
docker-compose logs -f nginx

# Últimas 100 linhas
docker-compose logs --tail=100
```

### Acessar Container

```bash
# Backend
docker exec -it meucontrato-backend sh

# PostgreSQL
docker exec -it meucontrato-postgres psql -U postgres meucontrato

# Redis
docker exec -it meucontrato-redis redis-cli
```

### Verificar Conectividade

```bash
# Health check
curl http://SEU_IP/health

# API
curl http://SEU_IP/api

# Testar from dentro da EC2
ssh -i ~/.ssh/meucontrato-poc-key.pem ubuntu@SEU_IP
curl http://localhost
```

## 🗑️ Destruir Infraestrutura

Quando não precisar mais da POC:

```bash
# Destruir tudo
terraform destroy
# Digite 'yes' quando solicitado
```

**ATENÇÃO:** Isso vai deletar:
- ✅ EC2 (e todos os dados dentro dela)
- ✅ Elastic IP
- ✅ S3 Bucket (se estiver vazio)
- ✅ Security Group

**O bucket S3 NÃO será deletado se tiver arquivos.** Delete manualmente:

```bash
# Listar arquivos
aws s3 ls s3://meucontrato-poc-pdfs/

# Deletar tudo
aws s3 rm s3://meucontrato-poc-pdfs/ --recursive

# Então destruir
terraform destroy
```

## 🔄 Upgrade para Produção

Quando quiser migrar de POC para produção:

1. **Use a infraestrutura principal** em `terraform/` (não `terraform/poc/`)
2. **Migre dados:**
   - Export banco de dados da POC
   - Import no RDS de produção
   - Migre PDFs do S3 POC para S3 prod

3. **Configure:**
   - CloudFront CDN
   - RDS Multi-AZ
   - ElastiCache Redis
   - ECS Fargate com autoscaling
   - ALB com HTTPS
   - CloudWatch monitoring
   - Backups automáticos

## 🐛 Troubleshooting

### Containers não iniciam

```bash
# Ver logs
cd /opt/meucontrato
docker-compose logs

# Reiniciar
docker-compose restart

# Rebuild
docker-compose up -d --build
```

### Não consigo conectar via SSH

```bash
# Verificar Security Group
aws ec2 describe-security-groups \
  --group-names meucontrato-poc-sg

# Verificar se instância está running
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=meucontrato-poc"

# Verificar permissões da chave
chmod 400 ~/.ssh/meucontrato-poc-key.pem
```

### S3 Access Denied

```bash
# Verificar IAM role da EC2
aws iam get-role --role-name meucontrato-poc-ec2-role

# Verificar instance profile
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=meucontrato-poc" \
  --query 'Reservations[0].Instances[0].IamInstanceProfile'
```

### Custo inesperado

```bash
# Ver custos no AWS Cost Explorer
# Recursos que geram custo:
# - EC2 rodando (após free tier)
# - Elastic IP não associado ($3.60/mês)
# - NAT Gateway ($32/mês - NÃO usado nesta POC)
# - Transferência de dados > 100GB
```

## 📚 Recursos

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Documentação Principal](../README.md)

## 🆘 Suporte

- **Issues:** Abra uma issue no GitHub
- **Slack:** #meucontrato-poc
- **Email:** suporte@meucontrato.com

## 📄 Licença

MIT License

---

**Desenvolvido para demonstrações e POCs** 🚀
**Para produção, use a infraestrutura completa em** `terraform/`
