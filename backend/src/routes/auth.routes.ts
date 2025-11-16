import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Schemas de validação
const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

/**
 * POST /api/auth/signup
 * Cadastro de novo usuário
 */
router.post('/signup', authRateLimiter, async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const result = await AuthService.signup(data);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data);

    res.json({
      message: 'Login realizado com sucesso',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get('/me', authenticate, async (req: any, res, next) => {
  try {
    const user = await AuthService.getProfile(req.userId);

    res.json({
      data: user
    });
  } catch (error) {
    next(error);
  }
});

export default router;
