import Stripe from 'stripe';
import { PrismaClient, UserPlan } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Preços dos planos (em centavos)
const PLAN_PRICES = {
  PRO: {
    monthly: 4900, // R$ 49,00
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  },
  BUSINESS: {
    monthly: 9900, // R$ 99,00
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business_monthly',
  },
};

export class StripeService {
  /**
   * Criar ou obter customer do Stripe
   */
  static async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // Se já tem Stripe Customer ID, retornar
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Criar novo customer no Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
      },
    });

    // Salvar customer ID no banco
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Criar sessão de checkout
   */
  static async createCheckoutSession(
    userId: string,
    plan: 'PRO' | 'BUSINESS'
  ): Promise<string> {
    const customerId = await this.getOrCreateCustomer(userId);

    const planConfig = PLAN_PRICES[plan];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CORS_ORIGIN}/dashboard?success=true`,
      cancel_url: `${process.env.CORS_ORIGIN}/plans?canceled=true`,
      metadata: {
        userId,
        plan,
      },
    });

    return session.url || '';
  }

  /**
   * Criar portal de gerenciamento de assinatura
   */
  static async createPortalSession(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      throw new AppError(400, 'Usuário não possui assinatura');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.CORS_ORIGIN}/dashboard`,
    });

    return session.url;
  }

  /**
   * Processar webhook de checkout completo
   */
  static async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as UserPlan;

    if (!userId || !plan) {
      throw new Error('Metadata inválida no checkout');
    }

    // Atualizar plano do usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        credits: plan === 'PRO' ? 50 : -1, // -1 = ilimitado para BUSINESS
      },
    });

    // Log da ação
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PLAN_UPGRADED',
        metadata: {
          plan,
          subscriptionId: session.subscription,
        },
      },
    });
  }

  /**
   * Processar webhook de assinatura cancelada
   */
  static async handleSubscriptionCanceled(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const customerId = subscription.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Downgrade para FREE
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: UserPlan.FREE,
        credits: 2,
      },
    });

    // Log da ação
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PLAN_DOWNGRADED',
        metadata: {
          plan: 'FREE',
          reason: 'subscription_canceled',
        },
      },
    });
  }

  /**
   * Resetar créditos mensalmente
   */
  static async resetMonthlyCredits(): Promise<void> {
    // Resetar créditos dos usuários PRO
    await prisma.user.updateMany({
      where: { plan: UserPlan.PRO },
      data: { credits: 50 },
    });

    // Resetar créditos dos usuários FREE
    await prisma.user.updateMany({
      where: { plan: UserPlan.FREE },
      data: { credits: 2 },
    });
  }

  /**
   * Obter informações da assinatura
   */
  static async getSubscriptionInfo(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      return null;
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return null;
    }

    const subscription = subscriptions.data[0];

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }
}
