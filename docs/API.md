# 📚 Documentação da API - MeuContrato

## Base URL

```
http://localhost:3001/api
```

## Autenticação

A maioria das rotas requer autenticação via JWT. Inclua o token no header:

```
Authorization: Bearer <seu-token>
```

---

## 🔐 Autenticação

### POST /auth/signup

Criar nova conta de usuário.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}
```

**Response (201):**
```json
{
  "message": "Usuário criado com sucesso",
  "data": {
    "user": {
      "id": "...",
      "email": "usuario@example.com",
      "name": "Nome do Usuário",
      "plan": "FREE",
      "credits": 2
    },
    "token": "eyJhbGc..."
  }
}
```

### POST /auth/login

Fazer login.

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "message": "Login realizado com sucesso",
  "data": {
    "user": { ... },
    "token": "eyJhbGc..."
  }
}
```

### GET /auth/me

Obter dados do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "data": {
    "id": "...",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "plan": "FREE",
    "credits": 2
  }
}
```

---

## 📋 Templates

### GET /templates

Listar todos os templates disponíveis.

**Query params:**
- `category` (optional): Filtrar por categoria

**Response (200):**
```json
{
  "data": [
    {
      "id": "...",
      "name": "Contrato de Prestação de Serviços",
      "slug": "prestacao-servicos",
      "category": "Serviços",
      "description": "...",
      "jsonSchema": { ... },
      "isActive": true
    }
  ]
}
```

### GET /templates/categories

Listar todas as categorias.

**Response (200):**
```json
{
  "data": ["Serviços", "Imobiliário", "Confidencialidade", ...]
}
```

### GET /templates/:slug

Obter template específico por slug.

**Response (200):**
```json
{
  "data": {
    "id": "...",
    "name": "Contrato de Prestação de Serviços",
    "slug": "prestacao-servicos",
    "jsonSchema": {
      "fields": [
        {
          "id": "contractor_name",
          "label": "Nome do Contratante",
          "type": "text",
          "required": true
        }
      ]
    }
  }
}
```

---

## 📄 Contratos

### GET /contracts

Listar contratos do usuário.

**Headers:** `Authorization: Bearer <token>`

**Query params:**
- `page` (default: 1)
- `limit` (default: 10)

**Response (200):**
```json
{
  "data": [
    {
      "id": "...",
      "status": "DRAFT",
      "template": {
        "name": "Contrato de Prestação de Serviços",
        "category": "Serviços"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### POST /contracts

Criar novo contrato (rascunho).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "templateId": "template-id",
  "answers": {
    "contractor_name": "João Silva",
    "service_description": "Desenvolvimento de website",
    "payment_value": "R$ 5.000,00"
  }
}
```

**Response (201):**
```json
{
  "message": "Contrato criado com sucesso",
  "data": {
    "id": "...",
    "status": "DRAFT",
    "answers": { ... }
  }
}
```

### GET /contracts/:id

Obter contrato específico.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "data": {
    "id": "...",
    "status": "GENERATED",
    "answers": { ... },
    "generatedText": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS...",
    "pdfUrl": "/pdfs/contract-xxx.pdf",
    "template": { ... }
  }
}
```

### PUT /contracts/:id

Atualizar respostas do contrato (apenas rascunhos).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "answers": {
    "contractor_name": "João Silva Atualizado"
  }
}
```

**Response (200):**
```json
{
  "message": "Contrato atualizado com sucesso",
  "data": { ... }
}
```

### DELETE /contracts/:id

Deletar contrato.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Contrato deletado com sucesso"
}
```

### POST /contracts/:id/generate

Gerar texto do contrato usando IA.

**Headers:** `Authorization: Bearer <token>`

**⚠️ Consome 1 crédito do usuário**

**Response (200):**
```json
{
  "message": "Contrato gerado com sucesso",
  "data": {
    "id": "...",
    "status": "GENERATED",
    "generatedText": "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\n..."
  }
}
```

**Errors:**
- `403` - Créditos insuficientes
- `429` - Limite de geração excedido (3 por minuto)

### POST /contracts/:id/pdf

Gerar PDF do contrato.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "PDF gerado com sucesso",
  "data": {
    "pdfUrl": "/pdfs/contract-xxx.pdf"
  }
}
```

---

## 👤 Usuário

### GET /user/stats

Obter estatísticas do usuário.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "data": {
    "user": {
      "id": "...",
      "name": "João Silva",
      "plan": "FREE",
      "credits": 1
    },
    "stats": {
      "totalContracts": 5,
      "recentContracts": [...]
    }
  }
}
```

### GET /user/activity

Obter histórico de atividades.

**Headers:** `Authorization: Bearer <token>`

**Query params:**
- `page` (default: 1)
- `limit` (default: 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": "...",
      "action": "CONTRACT_GENERATED",
      "metadata": {
        "contractId": "...",
        "templateId": "..."
      },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## ⚠️ Erros Comuns

### 400 - Bad Request
```json
{
  "error": "Erro de validação",
  "details": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "error": "Token não fornecido"
}
```

### 403 - Forbidden
```json
{
  "error": "Créditos insuficientes",
  "message": "Você não possui créditos disponíveis. Faça upgrade do seu plano."
}
```

### 404 - Not Found
```json
{
  "error": "Não encontrado",
  "message": "Registro não encontrado"
}
```

### 429 - Too Many Requests
```json
{
  "error": "Limite de geração excedido",
  "message": "Você pode gerar até 3 contratos por minuto"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Erro interno do servidor"
}
```

---

## 🔒 Rate Limits

- **Geral:** 100 requisições por 15 minutos
- **Autenticação:** 5 tentativas por 15 minutos
- **Geração de contratos:** 3 por minuto

---

## 📊 Planos e Limites

| Plano | Créditos/mês | Rate Limit |
|-------|--------------|------------|
| FREE | 2 | Normal |
| PRO | 50 | Normal |
| BUSINESS | ∞ | Dobrado |
