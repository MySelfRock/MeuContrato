import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Muitas requisições',
    message: 'Por favor, tente novamente mais tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter mais restritivo para autenticação
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: {
    error: 'Muitas tentativas de login',
    message: 'Por favor, aguarde 15 minutos antes de tentar novamente'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para geração de contratos (mais restritivo)
export const contractGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3, // 3 gerações por minuto
  message: {
    error: 'Limite de geração excedido',
    message: 'Você pode gerar até 3 contratos por minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
