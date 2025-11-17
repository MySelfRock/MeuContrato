import { Router } from 'express';
import { TemplateService } from '../services/template.service';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /api/templates
 * Lista todos os templates disponíveis
 */
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const templates = await TemplateService.listTemplates(category as string);

    res.json({
      data: templates
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/categories
 * Lista todas as categorias disponíveis
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await TemplateService.listCategories();

    res.json({
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/:slug
 * Busca um template específico por slug
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const template = await TemplateService.getTemplateBySlug(slug);

    res.json({
      data: template
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/templates/:id/stats
 * Retorna estatísticas de uso do template (autenticado)
 */
router.get('/:id/stats', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await TemplateService.getTemplateStats(id);

    res.json({
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;
