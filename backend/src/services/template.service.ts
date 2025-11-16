import { PrismaClient, ContractTemplate } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateTemplateParams {
  name: string;
  slug: string;
  category: string;
  description: string;
  jsonSchema: any;
  aiPromptBase: string;
}

export class TemplateService {
  /**
   * Lista todos os templates ativos
   */
  static async listTemplates(category?: string): Promise<ContractTemplate[]> {
    const templates = await prisma.contractTemplate.findMany({
      where: {
        isActive: true,
        ...(category && { category })
      },
      orderBy: {
        name: 'asc'
      }
    });

    return templates;
  }

  /**
   * Busca um template por slug
   */
  static async getTemplateBySlug(slug: string): Promise<ContractTemplate> {
    const template = await prisma.contractTemplate.findUnique({
      where: { slug }
    });

    if (!template) {
      throw new AppError(404, 'Template não encontrado');
    }

    if (!template.isActive) {
      throw new AppError(400, 'Template não está ativo');
    }

    return template;
  }

  /**
   * Busca um template por ID
   */
  static async getTemplateById(id: string): Promise<ContractTemplate> {
    const template = await prisma.contractTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      throw new AppError(404, 'Template não encontrado');
    }

    return template;
  }

  /**
   * Cria um novo template (admin)
   */
  static async createTemplate(data: CreateTemplateParams): Promise<ContractTemplate> {
    // Verificar se slug já existe
    const existing = await prisma.contractTemplate.findUnique({
      where: { slug: data.slug }
    });

    if (existing) {
      throw new AppError(409, 'Slug já existe');
    }

    const template = await prisma.contractTemplate.create({
      data
    });

    return template;
  }

  /**
   * Atualiza um template (admin)
   */
  static async updateTemplate(
    id: string,
    data: Partial<CreateTemplateParams>
  ): Promise<ContractTemplate> {
    const template = await prisma.contractTemplate.update({
      where: { id },
      data
    });

    return template;
  }

  /**
   * Desativa um template (admin)
   */
  static async deactivateTemplate(id: string): Promise<void> {
    await prisma.contractTemplate.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Lista categorias disponíveis
   */
  static async listCategories(): Promise<string[]> {
    const templates = await prisma.contractTemplate.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    });

    return templates.map(t => t.category);
  }

  /**
   * Estatísticas de uso de templates
   */
  static async getTemplateStats(templateId: string) {
    const [template, usageCount, recentUsage] = await Promise.all([
      prisma.contractTemplate.findUnique({
        where: { id: templateId }
      }),
      prisma.contractInstance.count({
        where: { templateId }
      }),
      prisma.contractInstance.findMany({
        where: { templateId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          status: true
        }
      })
    ]);

    if (!template) {
      throw new AppError(404, 'Template não encontrado');
    }

    return {
      template,
      usageCount,
      recentUsage
    };
  }
}
