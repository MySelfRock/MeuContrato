# 🚀 Fase 3 - Funcionalidades Avançadas

## Visão Geral

A Fase 3 adiciona funcionalidades empresariais ao MeuContrato, incluindo sistema de pagamentos, assinatura digital e gerenciamento de planos.

---

## 💳 Sistema de Pagamentos (Stripe)

### Funcionalidades

- ✅ Checkout de assinaturas (PRO e BUSINESS)
- ✅ Portal de gerenciamento de assinatura
- ✅ Webhooks para atualização automática de planos
- ✅ Cancelamento e downgrade automático
- ✅ Reset mensal de créditos

### Configuração

1. Crie uma conta no [Stripe](https://stripe.com)
2. Obtenha suas chaves de API (Secret Key)
3. Configure os produtos e preços no Dashboard do Stripe
4. Adicione as chaves no `.env`:

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_BUSINESS_PRICE_ID="price_..."
```

### Webhooks

Configure o webhook no Stripe apontando para:
```
https://seu-dominio.com/api/stripe/webhook
```

Eventos suportados:
- `checkout.session.completed` - Assinatura criada
- `customer.subscription.deleted` - Assinatura cancelada
- `customer.subscription.updated` - Assinatura atualizada

### Fluxo de Upgrade

1. Usuário acessa `/plans`
2. Clica em "Fazer Upgrade"
3. É redirecionado para checkout do Stripe
4. Após pagamento, webhook atualiza plano e créditos
5. Usuário é redirecionado para dashboard

---

## ✍️ Assinatura Digital (ZapSign)

### Funcionalidades

- ✅ Envio de contratos para assinatura
- ✅ Múltiplos signatários
- ✅ Notificação automática por email
- ✅ Rastreamento de status
- ✅ Webhooks de conclusão
- ✅ Disponível apenas para plano BUSINESS

### Configuração

1. Crie uma conta no [ZapSign](https://zapsign.com.br)
2. Obtenha sua API Key
3. Adicione no `.env`:

```env
ZAPSIGN_API_KEY="sua_chave_api"
ZAPSIGN_API_URL="https://api.zapsign.com.br"
```

### Como Usar

1. Gere e baixe o PDF do contrato
2. Clique no botão "Assinar" (plano BUSINESS)
3. Adicione os signatários:
   - Nome completo
   - Email
4. Clique em "Enviar para Assinatura"
5. Os signatários receberão email com link

### Webhooks

Configure no ZapSign apontando para:
```
https://seu-dominio.com/api/signatures/webhook/zapsign
```

Evento suportado:
- `document_signed` - Documento assinado

---

## 📊 Planos e Preços

### Plano FREE
- **R$ 0/mês**
- 2 contratos por mês
- Todos os templates
- Geração com IA
- Download em PDF
- Suporte por email

### Plano PRO
- **R$ 49/mês**
- 50 contratos por mês
- Todos os templates
- Geração com IA
- Download em PDF
- Prioridade na IA
- Suporte prioritário

### Plano BUSINESS
- **R$ 99/mês**
- Contratos ilimitados
- Todos os templates
- Geração com IA
- Download em PDF
- **Assinatura digital integrada**
- API de integração
- Suporte prioritário
- Gerenciamento de equipe (futuro)

---

## 🔧 API Endpoints

### Stripe

**POST** `/api/stripe/create-checkout-session`
```json
{
  "plan": "PRO" // ou "BUSINESS"
}
```

**POST** `/api/stripe/create-portal-session`
```json
{}
```

**GET** `/api/stripe/subscription`
```json
{
  "data": {
    "id": "sub_...",
    "status": "active",
    "currentPeriodEnd": "2024-01-15T00:00:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

### Assinatura Digital

**POST** `/api/signatures/create`
```json
{
  "contractId": "contract_id",
  "signers": [
    {
      "name": "João Silva",
      "email": "joao@example.com"
    }
  ]
}
```

**GET** `/api/signatures/:contractId/status`
```json
{
  "data": {
    "status": "pending",
    "signers": [...],
    "completedAt": null
  }
}
```

**DELETE** `/api/signatures/:contractId`
```json
{
  "message": "Solicitação cancelada"
}
```

---

## 🎯 Testes

### Testar Pagamentos

Use os cartões de teste do Stripe:
- **Sucesso:** 4242 4242 4242 4242
- **Falha:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

Data de expiração: qualquer data futura
CVC: qualquer 3 dígitos

### Testar Assinatura Digital

1. Configure sua conta ZapSign
2. Use emails reais para receber notificações
3. Teste o fluxo completo de assinatura
4. Verifique os webhooks

---

## 🔒 Segurança

### Stripe
- ✅ Validação de assinatura de webhooks
- ✅ Chaves de API protegidas
- ✅ HTTPS obrigatório em produção
- ✅ Metadata para rastreamento

### ZapSign
- ✅ Autenticação por API Key
- ✅ Validação de webhooks
- ✅ Dados criptografados
- ✅ Audit logs

---

## 📈 Monitoramento

### Métricas Importantes

- Total de assinaturas ativas
- Taxa de conversão FREE → PRO/BUSINESS
- Taxa de cancelamento (churn)
- Contratos gerados por plano
- Assinaturas digitais enviadas
- Tempo médio de conclusão de assinatura

### Logs

Todos os eventos importantes são registrados:
- `PLAN_UPGRADED` - Upgrade de plano
- `PLAN_DOWNGRADED` - Downgrade de plano
- `SIGNATURE_REQUESTED` - Assinatura solicitada
- `CONTRACT_SIGNED` - Contrato assinado

---

## 🐛 Troubleshooting

### Webhook do Stripe não funciona

1. Verifique se a URL está acessível publicamente
2. Confirme o `STRIPE_WEBHOOK_SECRET`
3. Use ferramentas como ngrok para testes locais
4. Verifique os logs do Stripe Dashboard

### Assinatura digital falha

1. Verifique a API Key do ZapSign
2. Confirme que o PDF foi gerado
3. Verifique emails válidos dos signatários
4. Consulte logs do backend

### Plano não atualiza após pagamento

1. Verifique se webhook está configurado
2. Confira logs de webhook
3. Valide metadata do checkout
4. Teste manualmente a rota

---

## 🚀 Deploy em Produção

### Stripe

1. Obtenha chaves de produção
2. Configure webhooks de produção
3. Ative modo live
4. Teste com cartão real

### ZapSign

1. Migre para conta de produção
2. Configure webhooks de produção
3. Valide documentos legais
4. Teste fluxo completo

### Variáveis de Ambiente

```env
# Produção
NODE_ENV=production
CORS_ORIGIN=https://seu-dominio.com
STRIPE_SECRET_KEY=sk_live_...
ZAPSIGN_API_KEY=prod_key_...
```

---

## 📚 Recursos Adicionais

- [Documentação Stripe](https://stripe.com/docs)
- [Documentação ZapSign](https://docs.zapsign.com.br)
- [Webhooks do Stripe](https://stripe.com/docs/webhooks)
- [API ZapSign](https://api.zapsign.com.br/docs)

---

**Desenvolvido com 💙 - Fase 3 Completa!**
