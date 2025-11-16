# Configuração da Infraestrutura AWS

Este documento descreve como configurar a infraestrutura AWS para o MeuContrato, incluindo S3, CloudFront e todas as otimizações avançadas.

## 📋 Pré-requisitos

1. **Conta AWS** com permissões de administrador
2. **AWS CLI** instalado e configurado
3. **Credenciais AWS** configuradas (`aws configure`)
4. **Variáveis de ambiente** configuradas no arquivo `.env`

## 🚀 Setup Automático

O projeto inclui um script que configura automaticamente toda a infraestrutura:

```bash
npm run setup:aws
```

Este script configura:

### 1. ✅ S3 Lifecycle Policies

Gerenciamento automático de ciclo de vida dos PDFs para otimização de custos:

- **90 dias**: Transição para Glacier Instant Retrieval
- **180 dias**: Transição para Glacier Flexible Retrieval
- **365 dias**: Transição para Deep Archive
- **Versões antigas**: Deep Archive após 30 dias
- **Logs**: Deleção automática após 90 dias
- **Uploads incompletos**: Limpeza após 7 dias

**Economia estimada**: ~90% de redução de custos para PDFs antigos

### 2. ✅ S3 Versioning

Proteção contra deleção acidental e histórico de versões:

- Mantém todas as versões anteriores de cada PDF
- Permite recuperação de arquivos deletados
- Versionamento automático de todas as alterações

**Casos de uso**:
- Recuperação de contratos deletados acidentalmente
- Auditoria de alterações em contratos
- Rollback para versões anteriores

### 3. ✅ S3 Access Logs

Registro detalhado de todos os acessos aos PDFs:

- Logs salvos em bucket separado (`meucontrato-pdfs-logs`)
- Informações: IP, horário, arquivo acessado, status HTTP
- Retenção automática de 90 dias

**Casos de uso**:
- Auditoria de segurança
- Análise de padrões de acesso
- Detecção de tentativas de acesso não autorizado

### 4. ✅ Cross-Region Replication

Replicação automática para outra região AWS:

- Backup em região secundária (padrão: `us-west-2`)
- Replicação em tempo real (até 15 minutos)
- Storage otimizado (STANDARD_IA na réplica)
- Replica deleções automaticamente

**Benefícios**:
- Alta disponibilidade
- Disaster recovery
- Conformidade com regulamentações
- Latência reduzida para usuários globais

**Configuração**:
1. Criar IAM Role para replicação
2. Configurar `AWS_REPLICATION_ROLE_ARN` no `.env`
3. Executar `npm run setup:aws`

### 5. ✅ CloudFront CDN

CDN global para entrega rápida de PDFs:

- Cache em edge locations globais (400+ localizações)
- HTTPS obrigatório
- Compressão automática
- TTL configurável (padrão: 24h)

**Benefícios**:
- Redução de latência em ~70%
- Economia de custos de transferência do S3
- Melhor experiência do usuário
- Escalabilidade automática

## 🛠️ Setup Manual

Se preferir configurar manualmente:

### 1. Criar Bucket S3

```bash
aws s3 mb s3://meucontrato-pdfs --region us-east-1
```

### 2. Habilitar Versioning

```bash
aws s3api put-bucket-versioning \
  --bucket meucontrato-pdfs \
  --versioning-configuration Status=Enabled
```

### 3. Configurar Lifecycle Policies

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket meucontrato-pdfs \
  --lifecycle-configuration file://lifecycle-policy.json
```

### 4. Criar CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name meucontrato-pdfs.s3.us-east-1.amazonaws.com \
  --default-root-object index.html
```

## 📊 Monitoramento

### CloudWatch Metrics

Monitore o uso da infraestrutura:

```bash
# Ver métricas do S3
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name NumberOfObjects \
  --dimensions Name=BucketName,Value=meucontrato-pdfs

# Ver métricas do CloudFront
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=E1234567890ABC
```

### S3 Access Logs

Analise os logs de acesso:

```bash
# Download dos logs
aws s3 sync s3://meucontrato-pdfs-logs/s3-access-logs/ ./logs/

# Análise com ferramentas como awslogs, CloudWatch Insights, etc.
```

## 💰 Estimativa de Custos

Baseado em **1.000 PDFs/mês**, **100MB cada**, **10.000 downloads/mês**:

| Serviço | Custo Mensal | Descrição |
|---------|-------------|-----------|
| **S3 Standard** | $2.30 | Primeiros 30 dias |
| **S3 Glacier IR** | $0.40 | 90-180 dias |
| **S3 Deep Archive** | $0.10 | 365+ dias |
| **CloudFront** | $8.50 | Transferência global |
| **Replication** | $1.20 | Cross-region |
| **Total** | **~$12.50/mês** | |

**Sem otimizações**: ~$23/mês
**Economia**: ~46%

## 🔒 Segurança

### IAM Policy Recomendada

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::meucontrato-pdfs",
        "arn:aws:s3:::meucontrato-pdfs/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution"
      ],
      "Resource": "*"
    }
  ]
}
```

### Bucket Policy (Privado)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::meucontrato-pdfs",
        "arn:aws:s3:::meucontrato-pdfs/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

## 🧪 Testes

### Testar Upload

```bash
# Criar arquivo de teste
echo "Teste" > test.pdf

# Upload manual
aws s3 cp test.pdf s3://meucontrato-pdfs/contracts/test.pdf

# Verificar
aws s3 ls s3://meucontrato-pdfs/contracts/
```

### Testar CloudFront

```bash
# Obter URL do CloudFront
curl https://d1234567890abc.cloudfront.net/contracts/test.pdf

# Verificar headers de cache
curl -I https://d1234567890abc.cloudfront.net/contracts/test.pdf
```

### Testar Replicação

```bash
# Verificar bucket de réplica
aws s3 ls s3://meucontrato-pdfs-replica/contracts/ --region us-west-2
```

## 🔧 Troubleshooting

### CloudFront não está invalidando cache

```bash
# Invalidar manualmente
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/contracts/*"
```

### Replicação não está funcionando

1. Verificar IAM Role
2. Confirmar que versioning está habilitado em ambos os buckets
3. Verificar configuração de replicação

```bash
aws s3api get-bucket-replication --bucket meucontrato-pdfs
```

### Lifecycle não está transitando arquivos

1. Verificar policy de lifecycle
2. Aguardar até 48 horas (transições ocorrem diariamente)

```bash
aws s3api get-bucket-lifecycle-configuration --bucket meucontrato-pdfs
```

## 📚 Recursos

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [S3 Lifecycle Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [CloudFront Best Practices](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/best-practices.html)

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verificar logs da aplicação
2. Verificar CloudWatch Logs
3. Consultar documentação AWS
4. Abrir issue no repositório
