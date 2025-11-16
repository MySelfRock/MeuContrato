import OpenAI from 'openai';
import { AppError } from '../middlewares/error.middleware';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente jurídico especializado em elaboração de contratos. Gere contratos profissionais, claros e juridicamente consistentes.'
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: 0.3, // Baixa temperatura para mais consistência
        max_tokens: 4000
      });

      const generatedText = response.choices[0]?.message?.content;

      if (!generatedText) {
        throw new AppError(500, 'Falha ao gerar contrato');
      }

      return generatedText.trim();
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new AppError(500, `Erro na API da OpenAI: ${error.message}`);
      }
      throw error;
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
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um advogado revisor de contratos. Sua função é melhorar contratos mantendo a essência e adicionando rigor jurídico.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      });

      const reviewedText = response.choices[0]?.message?.content;

      if (!reviewedText) {
        throw new AppError(500, 'Falha ao revisar contrato');
      }

      return reviewedText.trim();
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new AppError(500, `Erro na API da OpenAI: ${error.message}`);
      }
      throw error;
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
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Modelo mais rápido para sugestões
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor jurídico especializado em contratos.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const suggestions = response.choices[0]?.message?.content;

      if (!suggestions) {
        return [];
      }

      return suggestions
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 5);
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return [];
    }
  }
}
