import { PrismaClient, ContractInstance, ContractStatus } from '@prisma/client';
import { AIService } from './ai.service';
import { PDFService } from './pdf.service';
import { AuthService } from './auth.service';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface CreateContractParams {
  userId: string;
  templateId: string;
  answers: Record<string, any>;
}

interface GenerateContractParams {
  contractId: string;
  userId: string;
}

export class ContractService {
  /**
   * Cria uma nova instância de contrato (rascunho)
   */
  static async createContract(params: CreateContractParams): Promise<ContractInstance> {
    const { userId, templateId, answers } = params;

    // Verificar se o template existe
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new AppError(404, 'Template não encontrado');
    }

    if (!template.isActive) {
      throw new AppError(400, 'Template não está ativo');
    }

    // Criar instância do contrato
    const contract = await prisma.contractInstance.create({
      data: {
        userId,
        templateId,
        answers,
        status: ContractStatus.DRAFT
      },
      include: {
        template: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true
          }
        }
      }
    });

    return contract;
  }

  /**
   * Gera o texto do contrato usando IA
   */
  static async generateContract(params: GenerateContractParams): Promise<ContractInstance> {
    const { contractId, userId } = params;

    // Buscar contrato
    const contract = await prisma.contractInstance.findUnique({
      where: { id: contractId },
      include: {
        template: true,
        user: true
      }
    });

    if (!contract) {
      throw new AppError(404, 'Contrato não encontrado');
    }

    // Verificar se o contrato pertence ao usuário
    if (contract.userId !== userId) {
      throw new AppError(403, 'Acesso negado');
    }

    // Consumir crédito do usuário
    await AuthService.consumeCredit(userId);

    try {
      // Gerar contrato com IA
      const generatedText = await AIService.generateContract({
        basePrompt: contract.template.aiPromptBase,
        answers: contract.answers as Record<string, any>,
        contractName: contract.template.name
      });

      // Atualizar contrato com texto gerado
      const updatedContract = await prisma.contractInstance.update({
        where: { id: contractId },
        data: {
          generatedText,
          status: ContractStatus.GENERATED,
          updatedAt: new Date()
        },
        include: {
          template: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              plan: true
            }
          }
        }
      });

      // Log da ação
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CONTRACT_GENERATED',
          metadata: {
            contractId,
            templateId: contract.templateId
          }
        }
      });

      return updatedContract;
    } catch (error) {
      // Se falhar, devolver o crédito
      await AuthService.updateCredits(userId, 1);
      throw error;
    }
  }

  /**
   * Gera o PDF do contrato
   */
  static async generatePDF(contractId: string, userId: string): Promise<string> {
    const contract = await prisma.contractInstance.findUnique({
      where: { id: contractId },
      include: {
        template: true
      }
    });

    if (!contract) {
      throw new AppError(404, 'Contrato não encontrado');
    }

    if (contract.userId !== userId) {
      throw new AppError(403, 'Acesso negado');
    }

    if (!contract.generatedText) {
      throw new AppError(400, 'Contrato ainda não foi gerado');
    }

    // Gerar PDF
    const pdfUrl = await PDFService.generatePDF({
      contractId: contract.id,
      title: contract.template.name,
      content: contract.generatedText
    });

    // Atualizar contrato com URL do PDF
    await prisma.contractInstance.update({
      where: { id: contractId },
      data: { pdfUrl }
    });

    // Log da ação
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PDF_GENERATED',
        metadata: {
          contractId,
          pdfUrl
        }
      }
    });

    return pdfUrl;
  }

  /**
   * Lista contratos do usuário
   */
  static async listContracts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [contracts, total] = await Promise.all([
      prisma.contractInstance.findMany({
        where: { userId },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.contractInstance.count({
        where: { userId }
      })
    ]);

    return {
      contracts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Busca um contrato específico
   */
  static async getContract(contractId: string, userId: string): Promise<ContractInstance> {
    const contract = await prisma.contractInstance.findUnique({
      where: { id: contractId },
      include: {
        template: true,
        signatures: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true
          }
        }
      }
    });

    if (!contract) {
      throw new AppError(404, 'Contrato não encontrado');
    }

    if (contract.userId !== userId) {
      throw new AppError(403, 'Acesso negado');
    }

    return contract;
  }

  /**
   * Deleta um contrato
   */
  static async deleteContract(contractId: string, userId: string): Promise<void> {
    const contract = await prisma.contractInstance.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      throw new AppError(404, 'Contrato não encontrado');
    }

    if (contract.userId !== userId) {
      throw new AppError(403, 'Acesso negado');
    }

    await prisma.contractInstance.delete({
      where: { id: contractId }
    });

    // Log da ação
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CONTRACT_DELETED',
        metadata: { contractId }
      }
    });
  }

  /**
   * Atualiza as respostas de um contrato (apenas rascunhos)
   */
  static async updateContract(
    contractId: string,
    userId: string,
    answers: Record<string, any>
  ): Promise<ContractInstance> {
    const contract = await prisma.contractInstance.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      throw new AppError(404, 'Contrato não encontrado');
    }

    if (contract.userId !== userId) {
      throw new AppError(403, 'Acesso negado');
    }

    if (contract.status !== ContractStatus.DRAFT) {
      throw new AppError(400, 'Apenas contratos em rascunho podem ser editados');
    }

    const updatedContract = await prisma.contractInstance.update({
      where: { id: contractId },
      data: {
        answers,
        updatedAt: new Date()
      },
      include: {
        template: true
      }
    });

    return updatedContract;
  }
}
