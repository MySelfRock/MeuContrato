#!/bin/bash
set -e

# ============================================
# MeuContrato POC - User Data Script
# ============================================
# Este script provisiona automaticamente:
# - Docker + Docker Compose
# - PostgreSQL, Redis, Backend, Nginx
# - Configuração automática
# ============================================

echo "==> Iniciando provisionamento MeuContrato POC..."

# ============================================
# 1. Atualizar sistema
# ============================================

echo "==> Atualizando sistema..."
apt-get update
apt-get upgrade -y

# ============================================
# 2. Instalar dependências
# ============================================

echo "==> Instalando dependências..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    unzip

# ============================================
# 3. Instalar Docker
# ============================================

echo "==> Instalando Docker..."

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Habilitar Docker
systemctl enable docker
systemctl start docker

# ============================================
# 4. Instalar Docker Compose (standalone)
# ============================================

echo "==> Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# ============================================
# 5. Instalar AWS CLI
# ============================================

echo "==> Instalando AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# ============================================
# 6. Criar estrutura de diretórios
# ============================================

echo "==> Criando estrutura de diretórios..."
mkdir -p /opt/meucontrato
mkdir -p /opt/meucontrato/backend
mkdir -p /opt/meucontrato/nginx
mkdir -p /opt/meucontrato/data/postgres
mkdir -p /opt/meucontrato/data/redis

cd /opt/meucontrato

# ============================================
# 7. Criar arquivo .env
# ============================================

echo "==> Criando arquivo .env..."
cat > /opt/meucontrato/.env <<EOF
# Node.js
NODE_ENV=production

# Database
DATABASE_URL=postgresql://postgres:${db_password}@postgres:5432/meucontrato

# Redis
REDIS_URL=redis://redis:6379

# AWS
AWS_REGION=${aws_region}
AWS_S3_BUCKET=${s3_bucket}

# Secrets
JWT_SECRET=${jwt_secret}
GEMINI_API_KEY=${gemini_api_key}
STRIPE_SECRET_KEY=${stripe_secret_key}
STRIPE_WEBHOOK_SECRET=${stripe_webhook_secret}

# App
PORT=3000
FRONTEND_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
EOF

# ============================================
# 8. Criar docker-compose.yml
# ============================================

echo "==> Criando docker-compose.yml..."
cat > /opt/meucontrato/docker-compose.yml <<'COMPOSE_EOF'
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: meucontrato-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: meucontrato
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${db_password}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - meucontrato-network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: meucontrato-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - ./data/redis:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - meucontrato-network

  # Backend (será criado posteriormente via git clone)
  backend:
    image: node:18-alpine
    container_name: meucontrato-backend
    restart: unless-stopped
    working_dir: /app
    command: sh -c "npm install && npx prisma generate && npx prisma migrate deploy && npm start"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=$${DATABASE_URL}
      - REDIS_URL=$${REDIS_URL}
      - AWS_REGION=$${AWS_REGION}
      - AWS_S3_BUCKET=$${AWS_S3_BUCKET}
      - JWT_SECRET=$${JWT_SECRET}
      - GEMINI_API_KEY=$${GEMINI_API_KEY}
      - STRIPE_SECRET_KEY=$${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=$${STRIPE_WEBHOOK_SECRET}
      - PORT=3000
    volumes:
      - ./backend:/app
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - meucontrato-network

  # Nginx (Reverse Proxy)
  nginx:
    image: nginx:alpine
    container_name: meucontrato-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    networks:
      - meucontrato-network

networks:
  meucontrato-network:
    driver: bridge
COMPOSE_EOF

# ============================================
# 9. Criar configuração do Nginx
# ============================================

echo "==> Criando configuração Nginx..."
cat > /opt/meucontrato/nginx/nginx.conf <<'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        server_name _;

        # Aumentar tamanho máximo de upload
        client_max_body_size 50M;

        # API
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }

        # Página de status
        location / {
            return 200 'MeuContrato POC - Sistema funcionando!\n\nAPI: http://$host/api\nHealth: http://$host/health\n';
            add_header Content-Type text/plain;
        }
    }
}
NGINX_EOF

# ============================================
# 10. Criar script de inicialização do backend
# ============================================

echo "==> Criando script de inicialização..."
cat > /opt/meucontrato/init-backend.sh <<'INIT_EOF'
#!/bin/bash

echo "==> Clonando repositório do backend..."

# Este é um placeholder - você deve substituir pelo seu repositório
# Por enquanto, vamos criar uma estrutura básica

cd /opt/meucontrato/backend

# Se você tiver um repositório Git:
# git clone https://github.com/seu-usuario/MeuContrato.git .
# cd backend

# Placeholder: criar package.json básico
cat > package.json <<'PKG_EOF'
{
  "name": "meucontrato-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node -e \"require('http').createServer((req,res)=>{res.writeHead(200);res.end('Backend POC OK')}).listen(3000)\""
  }
}
PKG_EOF

echo "==> Backend básico criado!"
INIT_EOF

chmod +x /opt/meucontrato/init-backend.sh

# ============================================
# 11. Executar inicialização do backend
# ============================================

/opt/meucontrato/init-backend.sh

# ============================================
# 12. Iniciar Docker Compose
# ============================================

echo "==> Iniciando containers..."
cd /opt/meucontrato
docker-compose up -d

# ============================================
# 13. Aguardar containers iniciarem
# ============================================

echo "==> Aguardando containers iniciarem..."
sleep 30

# ============================================
# 14. Verificar status
# ============================================

echo "==> Verificando status dos containers..."
docker-compose ps

# ============================================
# 15. Criar script de status
# ============================================

cat > /usr/local/bin/meucontrato-status <<'STATUS_EOF'
#!/bin/bash
echo "==================================="
echo "MeuContrato POC - Status"
echo "==================================="
echo ""
echo "IP Público: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "URLs:"
echo "  - API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api"
echo "  - Health: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/health"
echo ""
echo "Logs (últimas 20 linhas):"
docker-compose -f /opt/meucontrato/docker-compose.yml logs --tail=20
STATUS_EOF

chmod +x /usr/local/bin/meucontrato-status

# ============================================
# 16. Finalizar
# ============================================

echo ""
echo "============================================"
echo "MeuContrato POC - Provisionamento completo!"
echo "============================================"
echo ""
echo "IP Público: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "Acesse:"
echo "  - http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo ""
echo "Para ver o status:"
echo "  sudo meucontrato-status"
echo ""
echo "Para acessar os logs:"
echo "  cd /opt/meucontrato && docker-compose logs -f"
echo ""
echo "============================================"
