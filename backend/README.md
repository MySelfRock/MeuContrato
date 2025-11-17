# MeuContrato Backend

API backend para o sistema de geração automática de contratos usando IA.

## 🚀 Tecnologias

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **Prisma** - ORM para PostgreSQL
- **Google Gemini** - IA para geração de contratos
- **AWS S3** - Armazenamento de PDFs
- **AWS CloudFront** - CDN para entrega rápida
- **Redis** + **BullMQ** - Filas de processamento
- **Stripe** - Pagamentos
- **Winston** - Logging com rotação
- **Zod** - Validação de schemas

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- AWS Account (para S3 e CloudFront)
- Gemini API Key

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env

# Editar .env com suas credenciais
nano .env

# Gerar Prisma Client
npm run generate

# Executar migrations
npm run migrate

# (Opcional) Popular banco de dados
npm run seed
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente Obrigatórias

```env
DATABASE_URL="postgresql://user:password@localhost:5432/meucontrato"
JWT_SECRET="sua-chave-secreta-minimo-32-caracteres"
GEMINI_API_KEY="sua-gemini-api-key"
REDIS_URL="redis://localhost:6379"
```

### 2. AWS S3 (Obrigatório)

```env
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="sua-access-key"
AWS_SECRET_ACCESS_KEY="sua-secret-key"
AWS_S3_BUCKET="meucontrato-pdfs"
```

### 3. CloudFront CDN (Recomendado)

```env
AWS_CLOUDFRONT_ENABLED="true"
AWS_CLOUDFRONT_DISTRIBUTION_ID="E1234567890ABC"
AWS_CLOUDFRONT_DOMAIN="d1234567890abc.cloudfront.net"
```

Veja [AWS_SETUP.md](./docs/AWS_SETUP.md) para instruções completas.

## 🚦 Executar

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
# Build
npm run build

# Executar
npm start
```

## 📊 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor em modo desenvolvimento |
| `npm run build` | Compila TypeScript para JavaScript |
| `npm start` | Inicia servidor em produção |
| `npm run migrate` | Executa migrations do Prisma |
| `npm run generate` | Gera Prisma Client |
| `npm run seed` | Popula banco com dados de teste |
| `npm test` | Executa testes com Vitest |
| `npm run lint` | Verifica código com ESLint |
| `npm run setup:aws` | Configura infraestrutura AWS automaticamente |
| `npm run validate:aws` | Valida configuração AWS |
| `npm run cleanup:pdfs` | Remove PDFs locais após migração para S3 |

## 🏗️ Arquitetura

```
backend/
├── src/
│   ├── config/          # Configurações (env, s3, cloudfront)
│   ├── controllers/     # Controladores (futuramente)
│   ├── middlewares/     # Middlewares (auth, error, logger, etc.)
│   ├── routes/          # Rotas da API
│   ├── services/        # Lógica de negócio
│   ├── utils/           # Utilitários (sanitize, timeout)
│   ├── lib/             # Bibliotecas (prisma singleton)
│   ├── scripts/         # Scripts de manutenção
│   └── index.ts         # Entrada da aplicação
├── prisma/
│   ├── schema.prisma    # Schema do banco de dados
│   └── seed.ts          # Dados iniciais
├── docs/                # Documentação
└── logs/                # Logs rotativos
```

## 🔒 Segurança

### Implementações de Segurança

✅ **Validação de Entrada**
- Sanitização de inputs de IA (prevenção de prompt injection)
- Validação com Zod em todas as rotas
- Rate limiting por IP e por usuário

✅ **Autenticação de Webhooks**
- Validação HMAC para Stripe
- Validação de token + IP para ZapSign/ClickSign
- Logs de tentativas de acesso

✅ **Proteção de Dados**
- Criptografia AES256 no S3
- HTTPS obrigatório via CloudFront
- JWT com expiração configurável

✅ **Timeouts e Rate Limits**
- Timeout de 60s para geração de contratos
- Timeout de 30s para sugestões
- Rate limit de 10 gerações/hora para free tier

✅ **Logging e Monitoramento**
- Winston com rotação diária
- Logs separados por nível (error, combined, access)
- Request ID para rastreamento

## 🌩️ Infraestrutura AWS

### S3 + CloudFront

**Benefícios:**
- PDFs entregues via CDN global (400+ edge locations)
- Cache inteligente (24h TTL)
- Economia de ~70% na latência
- Escalabilidade automática

**Otimizações Avançadas:**

1. **Lifecycle Policies** - Economia de custos
   - 90 dias → Glacier Instant Retrieval
   - 180 dias → Glacier
   - 365 dias → Deep Archive

2. **Versioning** - Proteção de dados
   - Histórico completo de alterações
   - Recuperação de deleções

3. **Cross-Region Replication** - Alta disponibilidade
   - Backup automático em região secundária
   - Disaster recovery

4. **Access Logs** - Auditoria
   - Registro de todos os acessos
   - Conformidade com LGPD

Veja [AWS_SETUP.md](./docs/AWS_SETUP.md) para detalhes.

## 🎯 API Endpoints

### Autenticação

```
POST /api/auth/register     - Registrar novo usuário
POST /api/auth/login        - Login
POST /api/auth/refresh      - Refresh token
GET  /api/auth/me           - Dados do usuário logado
```

### Contratos

```
GET    /api/contracts                  - Listar contratos
POST   /api/contracts                  - Criar contrato (rascunho)
GET    /api/contracts/:id              - Buscar contrato
PUT    /api/contracts/:id              - Atualizar contrato
DELETE /api/contracts/:id              - Deletar contrato
POST   /api/contracts/:id/generate     - Gerar texto com IA
POST   /api/contracts/:id/pdf          - Gerar PDF
GET    /api/contracts/:id/download-url - URL de download (presigned/CloudFront)
```

### Templates

```
GET  /api/templates           - Listar templates
GET  /api/templates/:id       - Buscar template
POST /api/templates/suggest   - Sugerir template baseado em descrição
```

### Pagamentos (Stripe)

```
POST /api/payments/create-checkout     - Criar sessão de checkout
POST /api/payments/webhook             - Webhook Stripe
GET  /api/payments/subscription        - Dados da assinatura
POST /api/payments/cancel-subscription - Cancelar assinatura
```

### Assinatura Digital

```
POST /api/signature/send/:contractId   - Enviar para assinatura
POST /api/signature/webhook            - Webhook ZapSign/ClickSign
GET  /api/signature/status/:contractId - Status da assinatura
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm test -- --watch

# Executar com coverage
npm test -- --coverage
```

## 📈 Monitoramento

### Logs

Logs são salvos em `logs/` com rotação diária:

- `error-YYYY-MM-DD.log` - Apenas erros (retenção: 30 dias)
- `combined-YYYY-MM-DD.log` - Todos os logs (retenção: 14 dias)
- `access-YYYY-MM-DD.log` - Logs de acesso HTTP (retenção: 7 dias)

### Métricas

Métricas importantes a monitorar:

- Taxa de erro na geração de contratos
- Tempo médio de geração
- Uso de créditos por usuário
- Tamanho médio dos PDFs
- Taxa de sucesso de webhooks
- CloudFront cache hit rate

## 🔧 Troubleshooting

### Erro: "PrismaClient is unable to run in browser"

```bash
npm run generate
```

### Erro: "S3 Access Denied"

Verifique permissões IAM:
```bash
npm run validate:aws
```

### Erro: "CloudFront cache não invalida"

```bash
# Invalidar manualmente
aws cloudfront create-invalidation \
  --distribution-id SEU_DISTRIBUTION_ID \
  --paths "/contracts/*"
```

### PDFs não aparecem após migração

```bash
# Executar script de cleanup
npm run cleanup:pdfs
```

## 📚 Documentação Adicional

- [AWS Setup Guide](./docs/AWS_SETUP.md)
- [Security Best Practices](./docs/SECURITY.md) (TODO)
- [API Documentation](./docs/API.md) (TODO)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Changelog

### v1.3.0 - Otimizações AWS Avançadas

- ✅ CloudFront CDN para entrega global
- ✅ S3 Lifecycle Policies para economia de custos
- ✅ S3 Versioning para proteção de dados
- ✅ Cross-Region Replication para alta disponibilidade
- ✅ S3 Access Logs para auditoria
- ✅ Scripts de setup e validação automatizados

### v1.2.0 - Migração para S3

- ✅ Migração de armazenamento local para AWS S3
- ✅ URLs pré-assinadas para download seguro
- ✅ Script de cleanup de PDFs locais

### v1.1.0 - Melhorias de Segurança

- ✅ Singleton PrismaClient
- ✅ Validação de ambiente na inicialização
- ✅ Autenticação de webhooks (HMAC + Token + IP)
- ✅ Sanitização de inputs de IA
- ✅ Timeouts em chamadas de IA
- ✅ Log rotation com Winston

### v1.0.0 - Migração para Gemini

- ✅ Migração de OpenAI GPT-4 para Google Gemini
- ✅ Sistema completo de geração de contratos
- ✅ Integração com Stripe
- ✅ Integração com ZapSign/ClickSign

## 📄 Licença

Este projeto está sob a licença MIT.

## 🆘 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a documentação em `/docs`
- Execute `npm run validate:aws` para diagnóstico
