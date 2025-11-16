import PDFDocument from 'pdfkit';
import { AppError } from '../middlewares/error.middleware';
import { S3Service } from './s3.service';
import { logger } from '../middlewares/logger.middleware';
import { Readable } from 'stream';

interface GeneratePDFParams {
  contractId: string;
  title: string;
  content: string;
}

export class PDFService {
  /**
   * Gera um PDF do contrato e faz upload para S3
   */
  static async generatePDF(params: GeneratePDFParams): Promise<string> {
    const { contractId, title, content } = params;

    try {
      // Gerar PDF em memória
      const pdfBuffer = await this.createPDFBuffer(title, content);

      // Nome do arquivo
      const fileName = `contract-${contractId}-${Date.now()}.pdf`;

      // Upload para S3
      const uploadResult = await S3Service.uploadFile({
        file: pdfBuffer,
        fileName,
        contentType: 'application/pdf',
        folder: 'contracts',
        metadata: {
          contractId,
          title,
          generatedAt: new Date().toISOString(),
        },
      });

      logger.info('PDF gerado e enviado para S3', {
        contractId,
        s3Key: uploadResult.key,
        size: uploadResult.size,
      });

      // Retornar a chave do S3 (formato: s3://bucket/key)
      return uploadResult.key;
    } catch (error: any) {
      logger.error('Erro ao gerar e enviar PDF', {
        error: error.message,
        contractId,
      });
      throw new AppError(500, `Erro ao gerar PDF: ${error.message}`);
    }
  }

  /**
   * Cria buffer do PDF em memória
   */
  private static async createPDFBuffer(title: string, content: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const chunks: Buffer[] = [];

        // Criar documento PDF
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        // Capturar chunks do PDF
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error) => reject(error));

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(title, { align: 'center' })
          .moveDown(2);

        // Data de geração
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'right' })
          .moveDown(2);

        // Linha separadora
        doc
          .strokeColor('#000000')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke()
          .moveDown(1);

        // Conteúdo do contrato
        const paragraphs = content.split('\n\n');

        paragraphs.forEach((paragraph) => {
          if (paragraph.trim().length === 0) return;

          // Detectar títulos (geralmente em maiúsculas ou começam com números)
          if (
            paragraph.match(/^[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ\s]+$/) ||
            paragraph.match(/^(CLÁUSULA|CAPÍTULO|ARTIGO|\d+\.)/)
          ) {
            doc
              .fontSize(12)
              .font('Helvetica-Bold')
              .text(paragraph, { align: 'left' })
              .moveDown(0.5);
          } else {
            doc
              .fontSize(11)
              .font('Helvetica')
              .text(paragraph, { align: 'justify', lineGap: 3 })
              .moveDown(1);
          }

          // Adicionar nova página se necessário
          if (doc.y > 700) {
            doc.addPage();
          }
        });

        // Footer em todas as páginas
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
          doc.switchToPage(i);

          doc
            .fontSize(9)
            .font('Helvetica')
            .text(
              `Página ${i + 1} de ${range.count}`,
              50,
              doc.page.height - 50,
              { align: 'center' }
            );

          doc
            .fontSize(8)
            .text(
              'Gerado por MeuContrato - Sistema de Geração Automática de Contratos',
              50,
              doc.page.height - 35,
              { align: 'center' }
            );
        }

        // Finalizar documento
        doc.end();
      } catch (error) {
        reject(new AppError(500, `Erro ao criar documento PDF: ${error}`));
      }
    });
  }

  /**
   * Gera URL pré-assinada para download do PDF
   * @param s3Key Chave do arquivo no S3
   * @param expiresIn Tempo de expiração em segundos (padrão: 1 hora)
   */
  static async getDownloadUrl(s3Key: string, expiresIn?: number): Promise<string> {
    try {
      return await S3Service.getPresignedUrl(s3Key, expiresIn);
    } catch (error: any) {
      logger.error('Erro ao gerar URL de download', {
        error: error.message,
        s3Key,
      });
      throw new AppError(500, 'Erro ao gerar URL de download');
    }
  }

  /**
   * Deleta um PDF do S3
   */
  static async deletePDF(s3Key: string): Promise<void> {
    try {
      await S3Service.deleteFile(s3Key);
      logger.info('PDF deletado do S3', { s3Key });
    } catch (error: any) {
      logger.error('Erro ao deletar PDF', {
        error: error.message,
        s3Key,
      });
      // Não lançar erro, apenas logar (compatibilidade com código antigo)
    }
  }

  /**
   * Verifica se um PDF existe no S3
   */
  static async pdfExists(s3Key: string): Promise<boolean> {
    try {
      return await S3Service.fileExists(s3Key);
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtém informações sobre o PDF
   */
  static async getPDFInfo(s3Key: string) {
    try {
      return await S3Service.getFileInfo(s3Key);
    } catch (error: any) {
      throw new AppError(404, 'PDF não encontrado');
    }
  }

  /**
   * COMPATIBILIDADE: Converte URL antiga (/pdfs/filename.pdf) para chave S3
   * Útil durante migração
   */
  static urlToS3Key(pdfUrl: string): string {
    if (pdfUrl.startsWith('contracts/')) {
      // Já é uma chave S3
      return pdfUrl;
    }

    // URL antiga no formato /pdfs/filename.pdf
    const fileName = pdfUrl.replace('/pdfs/', '');
    return `contracts/${fileName}`;
  }

  /**
   * COMPATIBILIDADE: Converte chave S3 para formato de URL (para frontend)
   * Retorna a chave S3 que será usada para gerar URL pré-assinada
   */
  static s3KeyToUrl(s3Key: string): string {
    // Retornar a chave S3 diretamente
    // O frontend deve chamar o endpoint /api/contracts/:id/pdf-url
    return s3Key;
  }
}
