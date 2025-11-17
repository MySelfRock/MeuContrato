/**
 * Validação e configuração de variáveis de ambiente
 */

interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // Google Gemini
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;

  // Redis
  REDIS_URL: string;

  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRO_PRICE_ID: string;
  STRIPE_BUSINESS_PRICE_ID: string;

  // ZapSign (optional)
  ZAPSIGN_API_KEY?: string;
  ZAPSIGN_API_URL?: string;

  // ClickSign (optional)
  CLICKSIGN_API_KEY?: string;
  CLICKSIGN_API_URL?: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // AWS S3
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET: string;
  AWS_ENDPOINT?: string; // Para LocalStack/MinIO em desenvolvimento
}

/**
 * Valida uma variável de ambiente obrigatória
 */
function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (!value) {
    throw new Error(`❌ Variável de ambiente obrigatória não configurada: ${key}`);
  }

  // Validações de segurança
  if (key === 'JWT_SECRET') {
    if (value.length < 32) {
      throw new Error('❌ JWT_SECRET deve ter no mínimo 32 caracteres');
    }
    if (value === 'your-super-secret-jwt-key-change-this-in-production') {
      throw new Error('❌ JWT_SECRET com valor padrão detectado. Altere para um valor seguro!');
    }
  }

  if (key === 'NODE_ENV' && !['development', 'production', 'test'].includes(value)) {
    throw new Error(`❌ NODE_ENV deve ser 'development', 'production' ou 'test'. Valor atual: ${value}`);
  }

  return value;
}

/**
 * Pega variável de ambiente opcional
 */
function optionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Valida e exporta configuração do ambiente
 */
export function validateEnv(): EnvironmentConfig {
  console.log('🔍 Validando variáveis de ambiente...');

  try {
    const config: EnvironmentConfig = {
      // Database
      DATABASE_URL: requireEnv('DATABASE_URL'),

      // JWT
      JWT_SECRET: requireEnv('JWT_SECRET'),
      JWT_EXPIRES_IN: requireEnv('JWT_EXPIRES_IN', '7d'),

      // Google Gemini
      GEMINI_API_KEY: requireEnv('GEMINI_API_KEY'),
      GEMINI_MODEL: requireEnv('GEMINI_MODEL', 'gemini-pro'),

      // Redis
      REDIS_URL: requireEnv('REDIS_URL', 'redis://localhost:6379'),

      // Server
      PORT: parseInt(requireEnv('PORT', '3001'), 10),
      NODE_ENV: requireEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
      CORS_ORIGIN: requireEnv('CORS_ORIGIN', 'http://localhost:3000'),

      // Stripe
      STRIPE_SECRET_KEY: requireEnv('STRIPE_SECRET_KEY'),
      STRIPE_WEBHOOK_SECRET: requireEnv('STRIPE_WEBHOOK_SECRET'),
      STRIPE_PRO_PRICE_ID: requireEnv('STRIPE_PRO_PRICE_ID'),
      STRIPE_BUSINESS_PRICE_ID: requireEnv('STRIPE_BUSINESS_PRICE_ID'),

      // ZapSign (optional)
      ZAPSIGN_API_KEY: optionalEnv('ZAPSIGN_API_KEY'),
      ZAPSIGN_API_URL: optionalEnv('ZAPSIGN_API_URL', 'https://api.zapsign.com.br'),

      // ClickSign (optional)
      CLICKSIGN_API_KEY: optionalEnv('CLICKSIGN_API_KEY'),
      CLICKSIGN_API_URL: optionalEnv('CLICKSIGN_API_URL', 'https://api.clicksign.com'),

      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: parseInt(requireEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
      RATE_LIMIT_MAX_REQUESTS: parseInt(requireEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),

      // AWS S3
      AWS_REGION: requireEnv('AWS_REGION'),
      AWS_ACCESS_KEY_ID: requireEnv('AWS_ACCESS_KEY_ID'),
      AWS_SECRET_ACCESS_KEY: requireEnv('AWS_SECRET_ACCESS_KEY'),
      AWS_S3_BUCKET: requireEnv('AWS_S3_BUCKET'),
      AWS_ENDPOINT: optionalEnv('AWS_ENDPOINT'), // Para LocalStack/MinIO
    };

    // Validações adicionais de segurança para produção
    if (config.NODE_ENV === 'production') {
      if (config.CORS_ORIGIN.includes('localhost')) {
        console.warn('⚠️  AVISO: CORS_ORIGIN configurado com localhost em produção!');
      }

      if (!config.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
        console.warn('⚠️  AVISO: Usando chave de teste do Stripe em produção!');
      }

      if (!config.DATABASE_URL.includes('ssl=true') && !config.DATABASE_URL.includes('sslmode=require')) {
        console.warn('⚠️  AVISO: Conexão com banco de dados sem SSL em produção!');
      }
    }

    console.log('✅ Todas as variáveis de ambiente validadas com sucesso!');
    console.log(`📦 Ambiente: ${config.NODE_ENV}`);
    console.log(`🌐 CORS Origin: ${config.CORS_ORIGIN}`);
    console.log(`🤖 Modelo IA: ${config.GEMINI_MODEL}`);
    console.log(`☁️  S3 Bucket: ${config.AWS_S3_BUCKET} (${config.AWS_REGION})`);

    return config;
  } catch (error) {
    if (error instanceof Error) {
      console.error('\n❌ ERRO NA VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE:\n');
      console.error(error.message);
      console.error('\n💡 Dica: Verifique o arquivo .env.example para referência\n');
    }
    process.exit(1);
  }
}

// Exportar configuração validada
export const env = validateEnv();
