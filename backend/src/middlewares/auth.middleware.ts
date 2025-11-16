import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserPlan } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  userPlan?: UserPlan;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET não configurado');
    }

    const decoded = jwt.verify(token, secret) as { userId: string };

    // Verificar se usuário ainda existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, plan: true }
    });

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    req.userId = user.id;
    req.userPlan = user.plan;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    next(error);
  }
};

// Middleware para verificar plano do usuário
export const requirePlan = (...allowedPlans: UserPlan[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userPlan || !allowedPlans.includes(req.userPlan)) {
      res.status(403).json({
        error: 'Plano insuficiente',
        message: 'Faça upgrade do seu plano para acessar este recurso'
      });
      return;
    }
    next();
  };
};

// Middleware para verificar créditos disponíveis
export const checkCredits = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { credits: true, plan: true }
    });

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Plano BUSINESS tem créditos ilimitados
    if (user.plan === 'BUSINESS') {
      next();
      return;
    }

    if (user.credits <= 0) {
      res.status(403).json({
        error: 'Créditos insuficientes',
        message: 'Você não possui créditos disponíveis. Faça upgrade do seu plano.'
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
