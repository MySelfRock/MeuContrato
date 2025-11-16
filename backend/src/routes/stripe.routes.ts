import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { StripeService } from '../services/stripe.service';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const createCheckoutSchema = z.object({
  plan: z.enum(['PRO', 'BUSINESS']),
});

/**
 * POST /api/stripe/create-checkout-session
 * Criar sessão de checkout
 */
router.post(
  '/create-checkout-session',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { plan } = createCheckoutSchema.parse(req.body);

      const url = await StripeService.createCheckoutSession(req.userId!, plan);

      res.json({
        url,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/stripe/create-portal-session
 * Criar sessão do portal de gerenciamento
 */
router.post(
  '/create-portal-session',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const url = await StripeService.createPortalSession(req.userId!);

      res.json({
        url,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/stripe/subscription
 * Obter informações da assinatura
 */
router.get('/subscription', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const subscription = await StripeService.getSubscriptionInfo(req.userId!);

    res.json({
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/stripe/webhook
 * Webhook do Stripe
 */
router.post(
  '/webhook',
  // Express precisa do body raw para validar a assinatura
  Router().use(Router.raw({ type: 'application/json' })),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET não configurado');
      return res.status(400).send('Webhook secret não configurado');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Erro ao validar webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          await StripeService.handleCheckoutComplete(session);
          break;

        case 'customer.subscription.deleted':
        case 'customer.subscription.updated':
          const subscription = event.data.object as Stripe.Subscription;
          if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            await StripeService.handleSubscriptionCanceled(subscription);
          }
          break;

        default:
          console.log(`Evento não tratado: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      res.status(500).send('Erro ao processar webhook');
    }
  }
);

export default router;
