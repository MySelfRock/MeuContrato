import { Router } from 'express';
import { z } from 'zod';
import { SignatureService } from '../services/signature.service';
import { authenticate, AuthRequest, requirePlan } from '../middlewares/auth.middleware';
import { validateZapSignWebhook, webhookRateLimit } from '../middlewares/webhook.middleware';
import { UserPlan } from '@prisma/client';

const router = Router();

// Schema de validação
const createSignatureSchema = z.object({
  contractId: z.string(),
  signers: z.array(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
    })
  ).min(1),
});

/**
 * POST /api/signatures/create
 * Criar solicitação de assinatura (requer autenticação)
 */
router.post(
  '/create',
  authenticate,
  requirePlan(UserPlan.BUSINESS),
  async (req: AuthRequest, res, next) => {
    try {
      const data = createSignatureSchema.parse(req.body);

      const result = await SignatureService.createSignatureRequest({
        ...data,
        userId: req.userId!,
      });

      res.json({
        message: 'Solicitação de assinatura criada com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/signatures/:contractId/status
 * Obter status de assinatura (requer autenticação)
 */
router.get('/:contractId/status', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { contractId } = req.params;

    const status = await SignatureService.getSignatureStatus(
      contractId,
      req.userId!
    );

    res.json({
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/signatures/:contractId
 * Cancelar solicitação de assinatura (requer autenticação)
 */
router.delete('/:contractId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { contractId } = req.params;

    await SignatureService.cancelSignatureRequest(contractId, req.userId!);

    res.json({
      message: 'Solicitação de assinatura cancelada',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/signatures/webhook/zapsign
 * Webhook do ZapSign (público, mas com validação de segurança)
 */
router.post(
  '/webhook/zapsign',
  webhookRateLimit,
  validateZapSignWebhook,
  async (req, res) => {
    try {
      console.log('✅ Webhook ZapSign recebido e validado');
      await SignatureService.handleZapSignWebhook(req.body);
      res.json({ received: true });
    } catch (error) {
      console.error('❌ Erro ao processar webhook ZapSign:', error);
      res.status(500).send('Erro ao processar webhook');
    }
  }
);

export default router;
