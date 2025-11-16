import { PrismaClient, User, UserPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface SignupData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 10;

  static async signup(data: SignupData): Promise<AuthResponse> {
    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new AppError(409, 'Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        plan: UserPlan.FREE,
        credits: 2 // Plano FREE começa com 2 créditos
      }
    });

    // Gerar token
    const token = this.generateToken(user.id);

    // Remover senha do retorno
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  static async login(data: LoginData): Promise<AuthResponse> {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    // Gerar token
    const token = this.generateToken(user.id);

    // Remover senha do retorno
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  static async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private static generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!secret) {
      throw new Error('JWT_SECRET não configurado');
    }

    return jwt.sign({ userId }, secret, { expiresIn });
  }

  static async updateCredits(userId: string, amount: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // Plano BUSINESS não precisa de créditos
    if (user.plan === UserPlan.BUSINESS) {
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount
        }
      }
    });
  }

  static async consumeCredit(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    // Plano BUSINESS não consome créditos
    if (user.plan === UserPlan.BUSINESS) {
      return;
    }

    if (user.credits <= 0) {
      throw new AppError(403, 'Créditos insuficientes');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: 1
        }
      }
    });
  }
}
