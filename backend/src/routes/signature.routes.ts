import { Router } from 'express';
import { z } from 'zod';
import { SignatureService } from '../services/signature.service';
import { authenticate, AuthRequest, requirePlan } from '../middlewares/auth.middleware';
import { UserPlan } from '@prisma/client';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

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
 * Criar solicitação de assinatura
 */
router.post(
  '/create',
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
 * Obter status de assinatura
 */
router.get('/:contractId/status', async (req: AuthRequest, res, next) => {
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
 * Cancelar solicitação de assinatura
 */
router.delete('/:contractId', async (req: AuthRequest, res, next) => {
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
 * Webhook do ZapSign
 */
router.post('/webhook/zapsign', async (req, res) => {
  try {
    await SignatureService.handleZapSignWebhook(req.body);
    res.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook ZapSign:', error);
    res.status(500).send('Erro ao processar webhook');
  }
});

export default router;
