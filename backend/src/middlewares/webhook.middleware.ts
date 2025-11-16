import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware para validar webhooks do ZapSign
 *
 * ZapSign pode enviar um header de autenticação ou podemos validar
 * via IP whitelist ou token secreto compartilhado
 */
export const validateZapSignWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Método 1: Validar token de autenticação (se ZapSign suportar)
  const authHeader = req.headers['authorization'];
  const expectedToken = process.env.ZAPSIGN_WEBHOOK_SECRET;

  if (expectedToken) {
    if (!authHeader) {
      console.error('❌ Webhook ZapSign rejeitado: sem header de autorização');
      res.status(401).json({ error: 'Não autorizado' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== expectedToken) {
      console.error('❌ Webhook ZapSign rejeitado: token inválido');
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
  }

  // Método 2: Validar assinatura HMAC (se ZapSign enviar)
  const signature = req.headers['x-zapsign-signature'] as string;
  const webhookSecret = process.env.ZAPSIGN_WEBHOOK_SECRET;

  if (signature && webhookSecret) {
    try {
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('❌ Webhook ZapSign rejeitado: assinatura HMAC inválida');
        res.status(401).json({ error: 'Assinatura inválida' });
        return;
      }
    } catch (error) {
      console.error('❌ Erro ao validar assinatura HMAC do ZapSign:', error);
      res.status(500).json({ error: 'Erro na validação' });
      return;
    }
  }

  // Método 3: Validar IP de origem (adicionar IPs do ZapSign)
  const clientIp = req.ip || req.socket.remoteAddress;
  const allowedIPs = process.env.ZAPSIGN_ALLOWED_IPS?.split(',') || [];

  if (allowedIPs.length > 0) {
    if (!clientIp || !allowedIPs.includes(clientIp)) {
      console.error(`❌ Webhook ZapSign rejeitado: IP não autorizado (${clientIp})`);
      res.status(403).json({ error: 'IP não autorizado' });
      return;
    }
  }

  // Se chegou aqui e não tem NENHUMA validação configurada, alertar
  if (!expectedToken && !signature && allowedIPs.length === 0) {
    console.warn('⚠️  AVISO: Webhook ZapSign sem validação de segurança configurada!');
    console.warn('⚠️  Configure ZAPSIGN_WEBHOOK_SECRET ou ZAPSIGN_ALLOWED_IPS no .env');
  }

  next();
};

/**
 * Middleware para validar webhooks do ClickSign
 */
export const validateClickSignWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const expectedToken = process.env.CLICKSIGN_WEBHOOK_SECRET;

  if (!expectedToken) {
    console.warn('⚠️  CLICKSIGN_WEBHOOK_SECRET não configurado');
    next();
    return;
  }

  if (!authHeader) {
    console.error('❌ Webhook ClickSign rejeitado: sem header de autorização');
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  if (token !== expectedToken) {
    console.error('❌ Webhook ClickSign rejeitado: token inválido');
    res.status(401).json({ error: 'Token inválido' });
    return;
  }

  next();
};

/**
 * Rate limiting específico para webhooks
 * Previne abuso mesmo com validação de assinatura
 */
export const webhookRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Implementação simplificada - em produção usar Redis
  const webhookCalls = new Map<string, number[]>();
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minuto
  const maxRequests = 100; // 100 webhooks por minuto

  if (!webhookCalls.has(clientId)) {
    webhookCalls.set(clientId, []);
  }

  const calls = webhookCalls.get(clientId)!;
  const recentCalls = calls.filter((timestamp) => now - timestamp < windowMs);

  if (recentCalls.length >= maxRequests) {
    console.error(`❌ Rate limit excedido para webhook de ${clientId}`);
    res.status(429).json({ error: 'Muitas requisições' });
    return;
  }

  recentCalls.push(now);
  webhookCalls.set(clientId, recentCalls);

  next();
};
