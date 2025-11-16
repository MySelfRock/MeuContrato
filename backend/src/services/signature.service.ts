import axios from 'axios';
import { PrismaClient, SignatureProvider } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface SignerData {
  name: string;
  email: string;
}

interface CreateSignatureParams {
  contractId: string;
  signers: SignerData[];
  userId: string;
}

export class SignatureService {
  private static readonly ZAPSIGN_API_URL =
    process.env.ZAPSIGN_API_URL || 'https://api.zapsign.com.br';
  private static readonly ZAPSIGN_API_KEY = process.env.ZAPSIGN_API_KEY || '';

  /**
   * Enviar contrato para assinatura via ZapSign
   */
  static async createSignatureRequest(
    params: CreateSignatureParams
  ): Promise<any> {
    const { contractId, signers, userId } = params;

    // Verificar se usuário tem plano BUSINESS
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.plan !== 'BUSINESS') {
      throw new AppError(
        403,
        'Assinatura digital disponível apenas no plano BUSINESS'
      );
    }

    // Buscar contrato
    const contract = await prisma.contractInstance.findUnique({
      where: { id: contractId },
      include: { template: true },
    });

    if (!contract) {
      throw new AppError(404, 'Contrato não encontrado');
    }

    if (!contract.pdfUrl) {
      throw new AppError(400, 'Gere o PDF do contrato antes de enviar para assinatura');
    }

    if (contract.userId !== userId) {
      throw new AppError(403, 'Acesso negado');
    }

    try {
      // Criar documento no ZapSign
      const response = await axios.post(
        `${this.ZAPSIGN_API_URL}/api/v1/documents/`,
        {
          name: contract.template.name,
          url_pdf: `${process.env.CORS_ORIGIN}${contract.pdfUrl}`,
          signers: signers.map((signer, index) => ({
            name: signer.name,
            email: signer.email,
            send_automatic_email: true,
            send_automatic_whatsapp: false,
            sign_order: index + 1,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${this.ZAPSIGN_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const documentData = response.data;

      // Criar registros de assinatura
      for (const signer of signers) {
        await prisma.signature.create({
          data: {
            contractId,
            signerName: signer.name,
            signerEmail: signer.email,
            provider: SignatureProvider.ZAPSIGN,
            providerData: {
              documentId: documentData.token,
              documentUrl: documentData.external_id,
            },
          },
        });
      }

      // Atualizar status do contrato
      await prisma.contractInstance.update({
        where: { id: contractId },
        data: { status: 'SIGNED' },
      });

      // Log da ação
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SIGNATURE_REQUESTED',
          metadata: {
            contractId,
            signers: signers.length,
            provider: 'ZAPSIGN',
          },
        },
      });

      return {
        documentId: documentData.token,
        signers: documentData.signers,
        status: 'pending',
      };
    } catch (error: any) {
      console.error('Erro ao criar solicitação de assinatura:', error.response?.data);
      throw new AppError(
        500,
        `Erro ao enviar para ZapSign: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Obter status de assinatura
   */
  static async getSignatureStatus(contractId: string, userId: string): Promise<any> {
    const contract = await prisma.contractInstance.findUnique({
      where: { id: contractId },
      include: {
        signatures: true,
      },
    });

    if (!contract) {
      throw new AppError(404, 'Contrato não encontrado');
    }

    if (contract.userId !== userId) {
      throw new AppError(403, 'Acesso negado');
    }

    if (contract.signatures.length === 0) {
      return {
        status: 'not_requested',
        signers: [],
      };
    }

    const signature = contract.signatures[0];
    const documentId = (signature.providerData as any)?.documentId;

    if (!documentId) {
      return {
        status: 'pending',
        signers: contract.signatures,
      };
    }

    try {
      // Consultar status no ZapSign
      const response = await axios.get(
        `${this.ZAPSIGN_API_URL}/api/v1/documents/${documentId}/`,
        {
          headers: {
            Authorization: `Bearer ${this.ZAPSIGN_API_KEY}`,
          },
        }
      );

      return {
        status: response.data.status,
        signers: response.data.signers,
        completedAt: response.data.signed_at,
      };
    } catch (error: any) {
      console.error('Erro ao consultar status:', error.response?.data);
      return {
        status: 'error',
        signers: contract.signatures,
      };
    }
  }

  /**
   * Processar webhook do ZapSign
   */
  static async handleZapSignWebhook(payload: any): Promise<void> {
    const { event_type, document } = payload;

    if (event_type === 'document_signed') {
      // Encontrar contrato
      const signature = await prisma.signature.findFirst({
        where: {
          providerData: {
            path: ['documentId'],
            equals: document.token,
          },
        },
        include: {
          contract: true,
        },
      });

      if (signature) {
        // Atualizar assinatura
        await prisma.signature.update({
          where: { id: signature.id },
          data: {
            signedAt: new Date(),
          },
        });

        // Verificar se todas as assinaturas foram completadas
        const allSignatures = await prisma.signature.findMany({
          where: { contractId: signature.contractId },
        });

        const allSigned = allSignatures.every((s) => s.signedAt !== null);

        if (allSigned) {
          await prisma.contractInstance.update({
            where: { id: signature.contractId },
            data: { status: 'SIGNED' },
          });
        }
      }
    }
  }

  /**
   * Cancelar solicitação de assinatura
   */
  static async cancelSignatureRequest(
    contractId: string,
    userId: string
  ): Promise<void> {
    const contract = await prisma.contractInstance.findUnique({
      where: { id: contractId },
      include: { signatures: true },
    });

    if (!contract) {
      throw new AppError(404, 'Contrato não encontrado');
    }

    if (contract.userId !== userId) {
      throw new AppError(403, 'Acesso negado');
    }

    if (contract.signatures.length === 0) {
      throw new AppError(400, 'Nenhuma solicitação de assinatura encontrada');
    }

    const signature = contract.signatures[0];
    const documentId = (signature.providerData as any)?.documentId;

    if (documentId) {
      try {
        // Cancelar no ZapSign
        await axios.delete(
          `${this.ZAPSIGN_API_URL}/api/v1/documents/${documentId}/`,
          {
            headers: {
              Authorization: `Bearer ${this.ZAPSIGN_API_KEY}`,
            },
          }
        );
      } catch (error) {
        console.error('Erro ao cancelar no ZapSign:', error);
      }
    }

    // Deletar registros de assinatura
    await prisma.signature.deleteMany({
      where: { contractId },
    });

    // Atualizar status do contrato
    await prisma.contractInstance.update({
      where: { id: contractId },
      data: { status: 'GENERATED' },
    });
  }
}
