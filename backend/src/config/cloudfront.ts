/**
 * Configuração do CloudFront CDN para S3
 *
 * CloudFront acelera a entrega de PDFs através de:
 * - Cache em edge locations globais
 * - Compressão automática
 * - HTTPS obrigatório
 * - Invalidação de cache programática
 */

import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import { env } from './env';
import { logger } from '../middlewares/logger.middleware';

/**
 * Cliente CloudFront
 */
export const cloudFrontClient = new CloudFrontClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Configurações do CloudFront
 */
export const cloudFrontConfig = {
  distributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID || '',
  domain: process.env.AWS_CLOUDFRONT_DOMAIN || '',
  enabled: process.env.AWS_CLOUDFRONT_ENABLED === 'true',

  // Cache settings
  defaultTTL: 86400, // 24 horas
  maxTTL: 31536000, // 1 ano
  minTTL: 0,

  // Invalidation settings
  maxInvalidationPaths: 3000, // Limite AWS
};

/**
 * Gera URL do CloudFront para um objeto S3
 */
export function getCloudFrontUrl(s3Key: string): string {
  if (!cloudFrontConfig.enabled || !cloudFrontConfig.domain) {
    // CloudFront não configurado, retornar vazio (usar presigned URL)
    return '';
  }

  // Remover prefixo 'contracts/' se existir
  const path = s3Key.startsWith('contracts/') ? s3Key.substring(10) : s3Key;

  return `https://${cloudFrontConfig.domain}/contracts/${path}`;
}

/**
 * Invalida cache do CloudFront para paths específicos
 * Útil quando um PDF é atualizado ou deletado
 */
export async function invalidateCloudFrontCache(paths: string[]): Promise<void> {
  if (!cloudFrontConfig.enabled || !cloudFrontConfig.distributionId) {
    logger.warn('CloudFront não configurado, pulando invalidação');
    return;
  }

  if (paths.length === 0) {
    logger.warn('Nenhum path para invalidar');
    return;
  }

  if (paths.length > cloudFrontConfig.maxInvalidationPaths) {
    logger.warn(
      `Número de paths excede limite (${paths.length} > ${cloudFrontConfig.maxInvalidationPaths}). ` +
      'Usando invalidação wildcard.'
    );
    paths = ['/*'];
  }

  try {
    const command = new CreateInvalidationCommand({
      DistributionId: cloudFrontConfig.distributionId,
      InvalidationBatch: {
        CallerReference: `invalidation-${Date.now()}`,
        Paths: {
          Quantity: paths.length,
          Items: paths.map(path => path.startsWith('/') ? path : `/${path}`),
        },
      },
    });

    const response = await cloudFrontClient.send(command);

    logger.info('CloudFront cache invalidado com sucesso', {
      invalidationId: response.Invalidation?.Id,
      paths: paths.length,
      status: response.Invalidation?.Status,
    });
  } catch (error: any) {
    logger.error('Erro ao invalidar cache do CloudFront', {
      error: error.message,
      paths: paths.length,
    });
    // Não lançar erro - cache eventualmente expirará
  }
}

/**
 * Verifica status da distribuição CloudFront
 */
export async function getCloudFrontStatus(): Promise<{
  enabled: boolean;
  status: string;
  domainName: string;
}> {
  if (!cloudFrontConfig.enabled || !cloudFrontConfig.distributionId) {
    return {
      enabled: false,
      status: 'not_configured',
      domainName: '',
    };
  }

  try {
    const command = new GetDistributionCommand({
      Id: cloudFrontConfig.distributionId,
    });

    const response = await cloudFrontClient.send(command);

    return {
      enabled: response.Distribution?.DistributionConfig?.Enabled || false,
      status: response.Distribution?.Status || 'unknown',
      domainName: response.Distribution?.DomainName || '',
    };
  } catch (error: any) {
    logger.error('Erro ao verificar status do CloudFront', {
      error: error.message,
    });

    return {
      enabled: false,
      status: 'error',
      domainName: '',
    };
  }
}

/**
 * Valida configuração do CloudFront
 */
export function validateCloudFrontConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (cloudFrontConfig.enabled) {
    if (!cloudFrontConfig.distributionId) {
      errors.push('AWS_CLOUDFRONT_DISTRIBUTION_ID não configurado');
    }

    if (!cloudFrontConfig.domain) {
      errors.push('AWS_CLOUDFRONT_DOMAIN não configurado');
    }

    // Validar formato do domain
    if (cloudFrontConfig.domain && !cloudFrontConfig.domain.includes('.cloudfront.net')) {
      errors.push('AWS_CLOUDFRONT_DOMAIN deve ser um domínio .cloudfront.net');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
