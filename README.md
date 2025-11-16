# 📄 MeuContrato - Sistema Gerador Automático de Contratos

Sistema SaaS completo para geração automática de contratos profissionais usando Inteligência Artificial.

## 🚀 Tecnologias

### Backend
- **Node.js** + **TypeScript**
- **Express** - Framework web
- **Prisma ORM** - Gerenciamento de banco de dados
- **PostgreSQL** - Banco de dados
- **Google Gemini** - Geração de contratos com IA
- **JWT** - Autenticação
- **PDFKit** - Geração de PDFs
- **Redis** - Filas e cache
- **BullMQ** - Processamento de filas

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **shadcn/ui** - Componentes UI
- **React Query** - Gerenciamento de estado servidor
- **Zustand** - Gerenciamento de estado global
- **Axios** - Cliente HTTP

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Conta Google Cloud com Gemini API ativada (para chave de API)

## 🛠️ Instalação

### 1. Clonar o repositório

```bash
git clone <repo-url>
cd MeuContrato
```

### 2. Instalar dependências

```bash
npm install
```

Isso instalará as dependências de todos os workspaces (backend e frontend).

### 3. Configurar variáveis de ambiente

#### Backend

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` e configure:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/meucontrato?schema=public"
JWT_SECRET="sua-chave-secreta-jwt-aqui"
OPENAI_API_KEY="sk-sua-chave-openai-aqui"
REDIS_URL="redis://localhost:6379"
PORT=3001
```

#### Frontend

```bash
cd ../frontend
cp .env.example .env.local
```

Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Iniciar serviços (PostgreSQL e Redis)

Na raiz do projeto:

```bash
npm run docker:up
```

Isso iniciará:
- PostgreSQL na porta 5432
- Redis na porta 6379

### 5. Configurar o banco de dados

```bash
cd backend
npm run generate    # Gera o Prisma Client
npm run migrate     # Executa as migrations
npm run seed        # Popula com templates iniciais
```

### 6. Iniciar o projeto

#### Opção 1: Rodar tudo junto (recomendado para desenvolvimento)

Na raiz do projeto:

```bash
npm run dev
```

Isso iniciará:
- Backend na porta 3001
- Frontend na porta 3000

#### Opção 2: Rodar separadamente

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

### 7. Acessar a aplicação

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Prisma Studio:** `npm run prisma:studio`

## 📁 Estrutura do Projeto

```
MeuContrato/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Controladores (opcional)
│   │   ├── services/          # Lógica de negócio
│   │   ├── routes/            # Rotas da API
│   │   ├── middlewares/       # Middlewares (auth, error, etc)
│   │   ├── utils/             # Funções utilitárias
│   │   └── index.ts           # Entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Schema do banco de dados
│   │   └── seed.ts            # Dados iniciais (templates)
│   ├── public/
│   │   └── pdfs/              # PDFs gerados
│   └── logs/                  # Logs da aplicação
├── frontend/
│   ├── src/
│   │   ├── app/               # App Router do Next.js
│   │   ├── components/        # Componentes React
│   │   ├── lib/               # Bibliotecas e utilitários
│   │   ├── hooks/             # React Hooks customizados
│   │   └── types/             # TypeScript types
│   └── public/                # Assets estáticos
├── docker/                    # Arquivos Docker
├── docs/                      # Documentação
└── docker-compose.yml         # Configuração Docker
```

## 🔑 Funcionalidades Implementadas

### ✅ Backend

- [x] API REST completa com Express e TypeScript
- [x] Autenticação JWT
- [x] Sistema de créditos por plano (FREE, PRO, BUSINESS)
- [x] CRUD de templates de contratos
- [x] Geração de contratos com OpenAI GPT-4
- [x] Geração de PDFs profissionais
- [x] Sistema de audit logs
- [x] Rate limiting
- [x] Error handling estruturado
- [x] Validação com Zod
- [x] 6 templates de contratos pré-configurados

### ✅ Frontend

- [x] Configuração Next.js 14 com App Router
- [x] Sistema de autenticação completo (Login/Signup)
- [x] Gerenciamento de estado com Zustand
- [x] Cliente API com Axios
- [x] Estilização com TailwindCSS
- [x] Componentes UI com shadcn/ui
- [x] Landing page responsiva
- [x] TypeScript completo
- [x] **Dashboard do usuário com estatísticas**
- [x] **Página de listagem de templates com busca e filtros**
- [x] **Formulário dinâmico de criação de contratos**
- [x] **Visualização detalhada de contratos**
- [x] **Download de PDFs**
- [x] **Navbar com informações do usuário**
- [x] **Sistema de toasts para feedback**

### ✅ Fase 3 - Funcionalidades Avançadas

- [x] **Sistema de pagamentos com Stripe**
- [x] **Integração com assinatura digital (ZapSign)**
- [x] **Página de planos e upgrade**
- [x] **Gerenciamento de assinaturas**
- [x] **Webhooks do Stripe**
- [x] **Diálogo de assinatura digital no frontend**

### 🔄 Próximas Funcionalidades

- [ ] Edição de contratos gerados
- [ ] Painel administrativo completo
- [ ] Compartilhamento de contratos por link
- [ ] Histórico de versões de contratos
- [ ] API externa para integrações
- [ ] Notificações por email
- [ ] Biblioteca de cláusulas personalizadas

## 📊 Templates Disponíveis

1. **Contrato de Prestação de Serviços**
2. **Contrato de Aluguel Residencial**
3. **Termo de Confidencialidade (NDA)**
4. **Contrato de Parceria Comercial**
5. **Contrato de Compra e Venda**
6. **Contrato para Freelancer**

## 🔐 Planos e Limites

| Plano | Contratos/mês | Assinatura Digital | PDF | API |
|-------|---------------|-------------------|-----|-----|
| FREE | 2 | ❌ | ✅ | ❌ |
| PRO | 50 | ❌ | ✅ | ❌ |
| BUSINESS | ∞ | ✅ | ✅ | ✅ |

## 🧪 Testando a API

### Criar usuário

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "name": "Usuário Teste"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }'
```

### Listar templates

```bash
curl http://localhost:3001/api/templates
```

### Criar contrato

```bash
curl -X POST http://localhost:3001/api/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "templateId": "TEMPLATE_ID",
    "answers": {
      "contractor_name": "João Silva",
      "service_description": "Desenvolvimento de website"
    }
  }'
```

## 🐳 Docker

### Comandos úteis

```bash
# Iniciar serviços
npm run docker:up

# Parar serviços
npm run docker:down

# Ver logs
docker-compose logs -f

# Acessar PostgreSQL
docker exec -it meucontrato-db psql -U postgres -d meucontrato

# Acessar Redis
docker exec -it meucontrato-redis redis-cli
```

## 📝 Scripts Disponíveis

### Raiz do projeto

- `npm run dev` - Inicia backend e frontend
- `npm run build` - Build de produção
- `npm run docker:up` - Inicia serviços Docker
- `npm run docker:down` - Para serviços Docker

### Backend

- `npm run dev` - Modo desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run migrate` - Executa migrations
- `npm run seed` - Popula banco com dados iniciais
- `npm run studio` - Abre Prisma Studio

### Frontend

- `npm run dev` - Modo desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Verifica código

## 🚀 Deploy

### Backend (Railway/Render)

1. Configure as variáveis de ambiente
2. Configure o DATABASE_URL do PostgreSQL
3. Execute as migrations: `npx prisma migrate deploy`
4. Execute o seed: `npm run seed`
5. Inicie: `npm start`

### Frontend (Vercel)

1. Conecte o repositório
2. Configure `NEXT_PUBLIC_API_URL`
3. Deploy automático

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com 💙 usando Claude Code

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a documentação em `/docs`

---

**⚠️ Importante:** Lembre-se de nunca commitar arquivos `.env` com chaves de API reais!
