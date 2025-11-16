import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppError } from '../middlewares/error.middleware';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GenerateContractParams {
  basePrompt: string;
  answers: Record<string, any>;
  contractName: string;
}

export class AIService {
  /**
   * Gera um contrato usando IA baseado no prompt e nas respostas do usuário
   */
  static async generateContract(params: GenerateContractParams): Promise<string> {
    const { basePrompt, answers, contractName } = params;

    // Formatar as respostas em um texto legível
    const answersText = Object.entries(answers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    // Construir o prompt completo
    const fullPrompt = `${basePrompt}

DADOS FORNECIDOS PELO USUÁRIO:
${answersText}

INSTRUÇÕES IMPORTANTES:
- Você é um advogado especializado na elaboração de contratos.
- Gere um contrato jurídico completo, claro e profissional para: ${contractName}
- Use linguagem jurídica adequada e formal
- Evite contradições e ambiguidades
- Mantenha clareza e objetividade
- Gere todas as cláusulas necessárias de forma completa
- NÃO invente dados que não foram fornecidos
- Use os dados fornecidos exatamente como especificado
- Inclua cláusulas padrão quando apropriado (rescisão, foro, vigência, etc.)
- O contrato deve estar pronto para uso profissional

Retorne APENAS o texto do contrato, sem comentários adicionais ou explicações.`;

    try {
      // Usar o modelo Gemini Pro
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-pro',
        generationConfig: {
          temperature: 0.3, // Baixa temperatura para mais consistência
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Você é um assistente jurídico especializado em elaboração de contratos. Gere contratos profissionais, claros e juridicamente consistentes.\n\n${fullPrompt}`
              }
            ]
          }
        ],
      });

      const response = await result.response;
      const generatedText = response.text();

      if (!generatedText) {
        throw new AppError(500, 'Falha ao gerar contrato');
      }

      return generatedText.trim();
    } catch (error: any) {
      console.error('Erro ao gerar contrato com Gemini:', error);
      throw new AppError(500, `Erro ao gerar contrato: ${error.message}`);
    }
  }

  /**
   * Revisa e melhora um contrato existente
   */
  static async reviewContract(contractText: string): Promise<string> {
    const prompt = `Revise o contrato abaixo e faça melhorias jurídicas mantendo a formalidade.
Corrija possíveis inconsistências, melhore a clareza e garanta que esteja juridicamente adequado.

CONTRATO:
${contractText}

Retorne APENAS o contrato revisado, sem comentários adicionais.`;

    try {
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-pro',
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Você é um advogado revisor de contratos. Sua função é melhorar contratos mantendo a essência e adicionando rigor jurídico.\n\n${prompt}`
              }
            ]
          }
        ],
      });

      const response = await result.response;
      const reviewedText = response.text();

      if (!reviewedText) {
        throw new AppError(500, 'Falha ao revisar contrato');
      }

      return reviewedText.trim();
    } catch (error: any) {
      console.error('Erro ao revisar contrato com Gemini:', error);
      throw new AppError(500, `Erro ao revisar contrato: ${error.message}`);
    }
  }

  /**
   * Gera sugestões de cláusulas adicionais
   */
  static async suggestClauses(contractType: string, currentText: string): Promise<string[]> {
    const prompt = `Analise este contrato de ${contractType} e sugira cláusulas adicionais importantes que podem estar faltando.

CONTRATO ATUAL:
${currentText.substring(0, 1000)}...

Liste até 5 sugestões de cláusulas que melhorariam este contrato.
Retorne apenas a lista de sugestões, uma por linha.`;

    try {
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-pro',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Você é um consultor jurídico especializado em contratos.\n\n${prompt}`
              }
            ]
          }
        ],
      });

      const response = await result.response;
      const suggestions = response.text();

      if (!suggestions) {
        return [];
      }

      return suggestions
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 5);
    } catch (error) {
      console.error('Erro ao gerar sugestões com Gemini:', error);
      return [];
    }
  }
}
