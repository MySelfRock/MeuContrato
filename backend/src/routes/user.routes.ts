import { Router } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * GET /api/user/stats
 * Retorna estatísticas do usuário
 */
router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const [user, contractCount, recentContracts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          credits: true,
          createdAt: true
        }
      }),
      prisma.contractInstance.count({
        where: { userId }
      }),
      prisma.contractInstance.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          template: {
            select: {
              name: true,
              category: true
            }
          }
        }
      })
    ]);

    res.json({
      data: {
        user,
        stats: {
          totalContracts: contractCount,
          recentContracts
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/user/activity
 * Retorna histórico de atividades do usuário
 */
router.get('/activity', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({
        where: { userId }
      })
    ]);

    res.json({
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
