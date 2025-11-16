import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { AppError } from '../middlewares/error.middleware';

interface GeneratePDFParams {
  contractId: string;
  title: string;
  content: string;
}

export class PDFService {
  private static readonly PDF_DIR = path.join(process.cwd(), 'public', 'pdfs');

  /**
   * Garante que o diretório de PDFs existe
   */
  private static ensurePDFDirectory(): void {
    if (!fs.existsSync(this.PDF_DIR)) {
      fs.mkdirSync(this.PDF_DIR, { recursive: true });
    }
  }

  /**
   * Gera um PDF do contrato
   */
  static async generatePDF(params: GeneratePDFParams): Promise<string> {
    const { contractId, title, content } = params;

    this.ensurePDFDirectory();

    const fileName = `contract-${contractId}-${Date.now()}.pdf`;
    const filePath = path.join(this.PDF_DIR, fileName);

    return new Promise((resolve, reject) => {
      try {
        // Criar documento PDF
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        // Stream para o arquivo
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

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
          if (paragraph.match(/^[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ\s]+$/) ||
              paragraph.match(/^(CLÁUSULA|CAPÍTULO|ARTIGO|\d+\.)/)) {
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

        stream.on('finish', () => {
          // Retornar URL relativa do PDF
          const pdfUrl = `/pdfs/${fileName}`;
          resolve(pdfUrl);
        });

        stream.on('error', (error) => {
          reject(new AppError(500, `Erro ao gerar PDF: ${error.message}`));
        });
      } catch (error) {
        reject(new AppError(500, `Erro ao criar documento PDF: ${error}`));
      }
    });
  }

  /**
   * Deleta um arquivo PDF
   */
  static async deletePDF(pdfUrl: string): Promise<void> {
    try {
      const fileName = path.basename(pdfUrl);
      const filePath = path.join(this.PDF_DIR, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Erro ao deletar PDF:', error);
      // Não lançar erro, apenas logar
    }
  }

  /**
   * Verifica se um PDF existe
   */
  static pdfExists(pdfUrl: string): boolean {
    try {
      const fileName = path.basename(pdfUrl);
      const filePath = path.join(this.PDF_DIR, fileName);
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }
}
