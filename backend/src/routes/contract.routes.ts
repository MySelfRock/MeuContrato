import { Router } from 'express';
import { z } from 'zod';
import { ContractService } from '../services/contract.service';
import { authenticate, checkCredits, AuthRequest } from '../middlewares/auth.middleware';
import { contractGenerationLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Todas as rotas de contrato requerem autenticação
router.use(authenticate);

// Schemas de validação
const createContractSchema = z.object({
  templateId: z.string().min(1, 'Template ID é obrigatório'),
  answers: z.record(z.any())
});

const updateContractSchema = z.object({
  answers: z.record(z.any())
});

/**
 * GET /api/contracts
 * Lista todos os contratos do usuário
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await ContractService.listContracts(req.userId!, page, limit);

    res.json({
      data: result.contracts,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/contracts
 * Cria um novo contrato (rascunho)
 */
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createContractSchema.parse(req.body);

    const contract = await ContractService.createContract({
      userId: req.userId!,
      templateId: data.templateId,
      answers: data.answers
    });

    res.status(201).json({
      message: 'Contrato criado com sucesso',
      data: contract
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/contracts/:id
 * Busca um contrato específico
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const contract = await ContractService.getContract(id, req.userId!);

    res.json({
      data: contract
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/contracts/:id
 * Atualiza as respostas de um contrato (apenas rascunhos)
 */
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const data = updateContractSchema.parse(req.body);

    const contract = await ContractService.updateContract(
      id,
      req.userId!,
      data.answers
    );

    res.json({
      message: 'Contrato atualizado com sucesso',
      data: contract
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/contracts/:id
 * Deleta um contrato
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await ContractService.deleteContract(id, req.userId!);

    res.json({
      message: 'Contrato deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/contracts/:id/generate
 * Gera o texto do contrato usando IA
 */
router.post(
  '/:id/generate',
  contractGenerationLimiter,
  checkCredits,
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;

      const contract = await ContractService.generateContract({
        contractId: id,
        userId: req.userId!
      });

      res.json({
        message: 'Contrato gerado com sucesso',
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/contracts/:id/pdf
 * Gera o PDF do contrato
 */
router.post('/:id/pdf', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const pdfUrl = await ContractService.generatePDF(id, req.userId!);

    res.json({
      message: 'PDF gerado com sucesso',
      data: {
        pdfUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
