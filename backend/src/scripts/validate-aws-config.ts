/**
 * Script de validação da configuração AWS
 *
 * Verifica:
 * 1. Credenciais AWS estão configuradas
 * 2. Bucket S3 existe e está acessível
 * 3. Versioning está habilitado
 * 4. Lifecycle policies estão configuradas
 * 5. CloudFront está configurado (se habilitado)
 * 6. Replicação está configurada (se habilitada)
 * 7. Access logs estão habilitados
 *
 * Uso: npm run validate:aws
 */

import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketLoggingCommand,
  GetBucketReplicationCommand,
} from '@aws-sdk/client-s3';
import { env } from '../config/env';
import { logger } from '../middlewares/logger.middleware';
import { getCloudFrontStatus, validateCloudFrontConfig } from '../config/cloudfront';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

interface ValidationResult {
  category: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

const results: ValidationResult[] = [];

/**
 * 1. Validar credenciais e bucket
 */
async function validateBucket(): Promise<void> {
  logger.info('🔍 Validando bucket S3...');

  try {
    const command = new HeadBucketCommand({
      Bucket: env.AWS_S3_BUCKET,
    });

    await s3Client.send(command);

    results.push({
      category: 'S3 Bucket',
      status: 'success',
      message: `Bucket "${env.AWS_S3_BUCKET}" está acessível`,
    });
  } catch (error: any) {
    results.push({
      category: 'S3 Bucket',
      status: 'error',
      message: `Erro ao acessar bucket: ${error.message}`,
      details: {
        bucket: env.AWS_S3_BUCKET,
        region: env.AWS_REGION,
      },
    });
  }
}

/**
 * 2. Validar versioning
 */
async function validateVersioning(): Promise<void> {
  logger.info('🔍 Validando versioning...');

  try {
    const command = new GetBucketVersioningCommand({
      Bucket: env.AWS_S3_BUCKET,
    });

    const response = await s3Client.send(command);

    if (response.Status === 'Enabled') {
      results.push({
        category: 'S3 Versioning',
        status: 'success',
        message: 'Versioning está habilitado',
        details: {
          mfaDelete: response.MFADelete,
        },
      });
    } else {
      results.push({
        category: 'S3 Versioning',
        status: 'warning',
        message: 'Versioning não está habilitado',
        details: {
          howToFix: 'Execute: npm run setup:aws',
        },
      });
    }
  } catch (error: any) {
    results.push({
      category: 'S3 Versioning',
      status: 'error',
      message: `Erro ao verificar versioning: ${error.message}`,
    });
  }
}

/**
 * 3. Validar lifecycle policies
 */
async function validateLifecycle(): Promise<void> {
  logger.info('🔍 Validando lifecycle policies...');

  try {
    const command = new GetBucketLifecycleConfigurationCommand({
      Bucket: env.AWS_S3_BUCKET,
    });

    const response = await s3Client.send(command);

    if (response.Rules && response.Rules.length > 0) {
      const enabledRules = response.Rules.filter((r) => r.Status === 'Enabled');

      results.push({
        category: 'S3 Lifecycle',
        status: 'success',
        message: `${enabledRules.length} lifecycle policies configuradas`,
        details: {
          rules: enabledRules.map((r) => ({
            id: r.Id,
            transitions: r.Transitions?.length || 0,
          })),
        },
      });
    } else {
      results.push({
        category: 'S3 Lifecycle',
        status: 'warning',
        message: 'Nenhuma lifecycle policy configurada',
        details: {
          howToFix: 'Execute: npm run setup:aws',
        },
      });
    }
  } catch (error: any) {
    if (error.name === 'NoSuchLifecycleConfiguration') {
      results.push({
        category: 'S3 Lifecycle',
        status: 'warning',
        message: 'Lifecycle policies não configuradas',
        details: {
          howToFix: 'Execute: npm run setup:aws',
        },
      });
    } else {
      results.push({
        category: 'S3 Lifecycle',
        status: 'error',
        message: `Erro ao verificar lifecycle: ${error.message}`,
      });
    }
  }
}

/**
 * 4. Validar access logs
 */
async function validateAccessLogs(): Promise<void> {
  logger.info('🔍 Validando access logs...');

  try {
    const command = new GetBucketLoggingCommand({
      Bucket: env.AWS_S3_BUCKET,
    });

    const response = await s3Client.send(command);

    if (response.LoggingEnabled) {
      results.push({
        category: 'S3 Access Logs',
        status: 'success',
        message: 'Access logs habilitados',
        details: {
          targetBucket: response.LoggingEnabled.TargetBucket,
          targetPrefix: response.LoggingEnabled.TargetPrefix,
        },
      });
    } else {
      results.push({
        category: 'S3 Access Logs',
        status: 'warning',
        message: 'Access logs não configurados',
        details: {
          howToFix: 'Execute: npm run setup:aws',
        },
      });
    }
  } catch (error: any) {
    results.push({
      category: 'S3 Access Logs',
      status: 'error',
      message: `Erro ao verificar access logs: ${error.message}`,
    });
  }
}

/**
 * 5. Validar replicação
 */
async function validateReplication(): Promise<void> {
  logger.info('🔍 Validando replicação...');

  const replicationRoleArn = process.env.AWS_REPLICATION_ROLE_ARN;

  if (!replicationRoleArn) {
    results.push({
      category: 'S3 Replication',
      status: 'warning',
      message: 'Replicação não configurada (opcional)',
      details: {
        howToEnable: 'Configure AWS_REPLICATION_ROLE_ARN no .env e execute: npm run setup:aws',
      },
    });
    return;
  }

  try {
    const command = new GetBucketReplicationCommand({
      Bucket: env.AWS_S3_BUCKET,
    });

    const response = await s3Client.send(command);

    if (response.ReplicationConfiguration?.Rules) {
      const enabledRules = response.ReplicationConfiguration.Rules.filter(
        (r) => r.Status === 'Enabled'
      );

      results.push({
        category: 'S3 Replication',
        status: 'success',
        message: `Cross-region replication configurada (${enabledRules.length} rules)`,
        details: {
          rules: enabledRules.map((r) => ({
            id: r.Id,
            destination: r.Destination?.Bucket,
          })),
        },
      });
    }
  } catch (error: any) {
    if (error.name === 'ReplicationConfigurationNotFoundError') {
      results.push({
        category: 'S3 Replication',
        status: 'warning',
        message: 'Replicação não configurada',
        details: {
          howToFix: 'Execute: npm run setup:aws',
        },
      });
    } else {
      results.push({
        category: 'S3 Replication',
        status: 'error',
        message: `Erro ao verificar replicação: ${error.message}`,
      });
    }
  }
}

/**
 * 6. Validar CloudFront
 */
async function validateCloudFront(): Promise<void> {
  logger.info('🔍 Validando CloudFront...');

  // Validar configuração
  const configValidation = validateCloudFrontConfig();

  if (!process.env.AWS_CLOUDFRONT_ENABLED || process.env.AWS_CLOUDFRONT_ENABLED === 'false') {
    results.push({
      category: 'CloudFront CDN',
      status: 'warning',
      message: 'CloudFront não habilitado (opcional mas recomendado)',
      details: {
        howToEnable: 'Execute: npm run setup:aws e configure as variáveis no .env',
      },
    });
    return;
  }

  if (!configValidation.valid) {
    results.push({
      category: 'CloudFront CDN',
      status: 'error',
      message: 'Configuração do CloudFront inválida',
      details: {
        errors: configValidation.errors,
      },
    });
    return;
  }

  // Verificar status da distribuição
  try {
    const status = await getCloudFrontStatus();

    if (status.status === 'Deployed' && status.enabled) {
      results.push({
        category: 'CloudFront CDN',
        status: 'success',
        message: 'CloudFront configurado e ativo',
        details: {
          domain: status.domainName,
          status: status.status,
        },
      });
    } else {
      results.push({
        category: 'CloudFront CDN',
        status: 'warning',
        message: `CloudFront status: ${status.status}`,
        details: {
          domain: status.domainName,
          enabled: status.enabled,
        },
      });
    }
  } catch (error: any) {
    results.push({
      category: 'CloudFront CDN',
      status: 'error',
      message: `Erro ao verificar CloudFront: ${error.message}`,
    });
  }
}

/**
 * Função principal
 */
async function validateConfiguration() {
  logger.info('🚀 Iniciando validação da configuração AWS...');
  logger.info('');

  // Executar todas as validações
  await validateBucket();
  await validateVersioning();
  await validateLifecycle();
  await validateAccessLogs();
  await validateReplication();
  await validateCloudFront();

  logger.info('');
  logger.info('📊 Resultados da Validação:');
  logger.info('');

  // Exibir resultados
  results.forEach((result) => {
    const icon =
      result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';

    logger.info(`${icon} ${result.category}`);
    logger.info(`   ${result.message}`);

    if (result.details) {
      logger.info(`   Detalhes: ${JSON.stringify(result.details, null, 2)}`);
    }

    logger.info('');
  });

  // Resumo
  const successCount = results.filter((r) => r.status === 'success').length;
  const warningCount = results.filter((r) => r.status === 'warning').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  logger.info('📈 Resumo:');
  logger.info(`   ✅ Sucesso: ${successCount}`);
  logger.info(`   ⚠️  Avisos: ${warningCount}`);
  logger.info(`   ❌ Erros: ${errorCount}`);
  logger.info('');

  if (errorCount > 0) {
    logger.error('❌ Configuração AWS com erros. Verifique acima.');
    process.exit(1);
  } else if (warningCount > 0) {
    logger.warn('⚠️  Configuração AWS parcial. Considere habilitar recursos opcionais.');
    logger.info('💡 Execute "npm run setup:aws" para configurar automaticamente.');
  } else {
    logger.info('✅ Configuração AWS completa e funcional!');
  }
}

// Executar validação
validateConfiguration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Erro na validação:', error);
    process.exit(1);
  });
