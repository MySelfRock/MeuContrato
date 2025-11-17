/**
 * Script de configuração da infraestrutura AWS
 *
 * Este script configura:
 * 1. S3 Lifecycle Policies - Move PDFs antigos para Glacier
 * 2. S3 Versioning - Habilita versionamento de PDFs
 * 3. S3 Access Logs - Habilita logs de acesso
 * 4. Cross-Region Replication - Replica para região secundária
 * 5. CloudFront Distribution - CDN para entrega rápida
 *
 * Uso: npm run setup:aws
 *
 * Pré-requisitos:
 * - AWS CLI configurado
 * - Credenciais com permissões de administrador
 * - Variáveis de ambiente configuradas
 */

import {
  S3Client,
  PutBucketLifecycleConfigurationCommand,
  PutBucketVersioningCommand,
  PutBucketLoggingCommand,
  PutBucketReplicationCommand,
  GetBucketLocationCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  CreateDistributionCommand,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import { env } from '../config/env';
import { logger } from '../middlewares/logger.middleware';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const cloudFrontClient = new CloudFrontClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configurações
const BUCKET_NAME = env.AWS_S3_BUCKET;
const LOGS_BUCKET = `${BUCKET_NAME}-logs`;
const REPLICA_BUCKET = `${BUCKET_NAME}-replica`;
const REPLICA_REGION = process.env.AWS_REPLICA_REGION || 'us-west-2';
const REPLICATION_ROLE_ARN = process.env.AWS_REPLICATION_ROLE_ARN || '';

/**
 * 1. Configura S3 Lifecycle Policies
 */
async function setupLifecyclePolicies() {
  logger.info('📋 Configurando S3 Lifecycle Policies...');

  try {
    const command = new PutBucketLifecycleConfigurationCommand({
      Bucket: BUCKET_NAME,
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'archive-old-pdfs',
            Status: 'Enabled',
            Filter: {
              Prefix: 'contracts/',
            },
            Transitions: [
              {
                // Após 90 dias, move para Glacier Instant Retrieval
                Days: 90,
                StorageClass: 'GLACIER_IR',
              },
              {
                // Após 180 dias, move para Glacier Flexible Retrieval
                Days: 180,
                StorageClass: 'GLACIER',
              },
              {
                // Após 365 dias, move para Deep Archive
                Days: 365,
                StorageClass: 'DEEP_ARCHIVE',
              },
            ],
            NoncurrentVersionTransitions: [
              {
                // Versões antigas vão direto para Deep Archive após 30 dias
                NoncurrentDays: 30,
                StorageClass: 'DEEP_ARCHIVE',
              },
            ],
          },
          {
            Id: 'delete-old-logs',
            Status: 'Enabled',
            Filter: {
              Prefix: 'logs/',
            },
            Expiration: {
              // Deleta logs após 90 dias
              Days: 90,
            },
          },
          {
            Id: 'cleanup-multipart-uploads',
            Status: 'Enabled',
            AbortIncompleteMultipartUpload: {
              // Remove uploads incompletos após 7 dias
              DaysAfterInitiation: 7,
            },
          },
        ],
      },
    });

    await s3Client.send(command);

    logger.info('✅ Lifecycle Policies configuradas com sucesso', {
      rules: 3,
      transitions: 'Standard → Glacier IR (90d) → Glacier (180d) → Deep Archive (365d)',
      logRetention: '90 dias',
    });
  } catch (error: any) {
    logger.error('❌ Erro ao configurar Lifecycle Policies', { error: error.message });
    throw error;
  }
}

/**
 * 2. Habilita S3 Versioning
 */
async function setupVersioning() {
  logger.info('🔄 Habilitando S3 Versioning...');

  try {
    const command = new PutBucketVersioningCommand({
      Bucket: BUCKET_NAME,
      VersioningConfiguration: {
        Status: 'Enabled',
        MFADelete: 'Disabled', // Pode habilitar para segurança extra
      },
    });

    await s3Client.send(command);

    logger.info('✅ Versioning habilitado com sucesso', {
      bucket: BUCKET_NAME,
      mfaDelete: false,
    });
  } catch (error: any) {
    logger.error('❌ Erro ao habilitar Versioning', { error: error.message });
    throw error;
  }
}

/**
 * 3. Configura S3 Access Logs
 */
async function setupAccessLogs() {
  logger.info('📊 Configurando S3 Access Logs...');

  try {
    // Criar bucket de logs se não existir
    await ensureBucketExists(LOGS_BUCKET, env.AWS_REGION);

    // Configurar logging
    const command = new PutBucketLoggingCommand({
      Bucket: BUCKET_NAME,
      BucketLoggingStatus: {
        LoggingEnabled: {
          TargetBucket: LOGS_BUCKET,
          TargetPrefix: 's3-access-logs/',
        },
      },
    });

    await s3Client.send(command);

    logger.info('✅ Access Logs configurados com sucesso', {
      sourceBucket: BUCKET_NAME,
      logsBucket: LOGS_BUCKET,
      prefix: 's3-access-logs/',
    });
  } catch (error: any) {
    logger.error('❌ Erro ao configurar Access Logs', { error: error.message });
    throw error;
  }
}

/**
 * 4. Configura Cross-Region Replication
 */
async function setupReplication() {
  logger.info('🌍 Configurando Cross-Region Replication...');

  if (!REPLICATION_ROLE_ARN) {
    logger.warn('⚠️  AWS_REPLICATION_ROLE_ARN não configurado. Pulando replicação.');
    logger.info('   Para habilitar, crie uma IAM Role com permissões de replicação.');
    return;
  }

  try {
    // Criar bucket de réplica se não existir
    await ensureBucketExists(REPLICA_BUCKET, REPLICA_REGION);

    // Habilitar versioning no bucket de réplica (obrigatório)
    const replicaS3Client = new S3Client({
      region: REPLICA_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    await replicaS3Client.send(
      new PutBucketVersioningCommand({
        Bucket: REPLICA_BUCKET,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      })
    );

    // Configurar replicação
    const command = new PutBucketReplicationCommand({
      Bucket: BUCKET_NAME,
      ReplicationConfiguration: {
        Role: REPLICATION_ROLE_ARN,
        Rules: [
          {
            Id: 'replicate-all-pdfs',
            Status: 'Enabled',
            Priority: 1,
            Filter: {
              Prefix: 'contracts/',
            },
            Destination: {
              Bucket: `arn:aws:s3:::${REPLICA_BUCKET}`,
              ReplicationTime: {
                Status: 'Enabled',
                Time: {
                  Minutes: 15, // RTC: replica em até 15 minutos
                },
              },
              Metrics: {
                Status: 'Enabled',
                EventThreshold: {
                  Minutes: 15,
                },
              },
              StorageClass: 'STANDARD_IA', // Usar storage mais barato na réplica
            },
            DeleteMarkerReplication: {
              Status: 'Enabled', // Replica deleções
            },
          },
        ],
      },
    });

    await s3Client.send(command);

    logger.info('✅ Cross-Region Replication configurada com sucesso', {
      sourceBucket: BUCKET_NAME,
      sourceRegion: env.AWS_REGION,
      replicaBucket: REPLICA_BUCKET,
      replicaRegion: REPLICA_REGION,
      replicationTime: '15 minutos',
    });
  } catch (error: any) {
    logger.error('❌ Erro ao configurar Replication', { error: error.message });
    throw error;
  }
}

/**
 * 5. Cria CloudFront Distribution
 */
async function setupCloudFront() {
  logger.info('☁️  Configurando CloudFront Distribution...');

  const distributionId = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;

  if (distributionId) {
    // Verificar se já existe
    try {
      const getCommand = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(getCommand);

      logger.info('✅ CloudFront Distribution já existe', {
        id: distributionId,
        domain: response.Distribution?.DomainName,
        status: response.Distribution?.Status,
      });
      return;
    } catch (error) {
      logger.warn('Distribution ID configurado mas não encontrado. Criando nova...');
    }
  }

  try {
    const command = new CreateDistributionCommand({
      DistributionConfig: {
        CallerReference: `meucontrato-${Date.now()}`,
        Comment: 'MeuContrato - Distribuição de PDFs',
        Enabled: true,
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: `S3-${BUCKET_NAME}`,
              DomainName: `${BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com`,
              S3OriginConfig: {
                OriginAccessIdentity: '', // Usar OAI em produção
              },
            },
          ],
        },
        DefaultCacheBehavior: {
          TargetOriginId: `S3-${BUCKET_NAME}`,
          ViewerProtocolPolicy: 'redirect-to-https',
          AllowedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD'],
          },
          CachedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD'],
          },
          ForwardedValues: {
            QueryString: false,
            Cookies: {
              Forward: 'none',
            },
          },
          MinTTL: 0,
          DefaultTTL: 86400, // 24 horas
          MaxTTL: 31536000, // 1 ano
          Compress: true, // Compressão automática
          TrustedSigners: {
            Enabled: false,
            Quantity: 0,
          },
        },
        PriceClass: 'PriceClass_100', // Apenas EUA, Europa, Israel
        ViewerCertificate: {
          CloudFrontDefaultCertificate: true,
        },
      },
    });

    const response = await cloudFrontClient.send(command);

    logger.info('✅ CloudFront Distribution criada com sucesso', {
      id: response.Distribution?.Id,
      domain: response.Distribution?.DomainName,
      status: response.Distribution?.Status,
    });

    logger.info('');
    logger.info('📝 Adicione ao seu .env:');
    logger.info(`AWS_CLOUDFRONT_DISTRIBUTION_ID="${response.Distribution?.Id}"`);
    logger.info(`AWS_CLOUDFRONT_DOMAIN="${response.Distribution?.DomainName}"`);
    logger.info(`AWS_CLOUDFRONT_ENABLED="true"`);
  } catch (error: any) {
    logger.error('❌ Erro ao criar CloudFront Distribution', { error: error.message });
    logger.info('💡 Você pode criar manualmente no Console AWS e configurar o ID no .env');
    // Não lançar erro - CloudFront é opcional
  }
}

/**
 * Função auxiliar: garante que bucket existe
 */
async function ensureBucketExists(bucketName: string, region: string): Promise<void> {
  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Verificar se bucket existe
    await client.send(new HeadBucketCommand({ Bucket: bucketName }));
    logger.info(`✓ Bucket ${bucketName} já existe`);
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      // Criar bucket
      logger.info(`Criando bucket ${bucketName} em ${region}...`);

      const createParams: any = {
        Bucket: bucketName,
      };

      // LocationConstraint não é necessário para us-east-1
      if (region !== 'us-east-1') {
        createParams.CreateBucketConfiguration = {
          LocationConstraint: region,
        };
      }

      await client.send(new CreateBucketCommand(createParams));
      logger.info(`✓ Bucket ${bucketName} criado com sucesso`);
    } else {
      throw error;
    }
  }
}

/**
 * Função principal
 */
async function setupInfrastructure() {
  logger.info('🚀 Iniciando configuração da infraestrutura AWS...');
  logger.info('');

  const results = {
    lifecycle: false,
    versioning: false,
    accessLogs: false,
    replication: false,
    cloudfront: false,
  };

  // 1. Lifecycle Policies
  try {
    await setupLifecyclePolicies();
    results.lifecycle = true;
  } catch (error) {
    logger.error('Falha ao configurar Lifecycle Policies');
  }

  logger.info('');

  // 2. Versioning
  try {
    await setupVersioning();
    results.versioning = true;
  } catch (error) {
    logger.error('Falha ao habilitar Versioning');
  }

  logger.info('');

  // 3. Access Logs
  try {
    await setupAccessLogs();
    results.accessLogs = true;
  } catch (error) {
    logger.error('Falha ao configurar Access Logs');
  }

  logger.info('');

  // 4. Replication
  try {
    await setupReplication();
    results.replication = true;
  } catch (error) {
    logger.error('Falha ao configurar Replication');
  }

  logger.info('');

  // 5. CloudFront
  try {
    await setupCloudFront();
    results.cloudfront = true;
  } catch (error) {
    logger.error('Falha ao configurar CloudFront');
  }

  logger.info('');
  logger.info('📊 Resumo da Configuração:');
  logger.info(`   ${results.lifecycle ? '✅' : '❌'} Lifecycle Policies`);
  logger.info(`   ${results.versioning ? '✅' : '❌'} Versioning`);
  logger.info(`   ${results.accessLogs ? '✅' : '❌'} Access Logs`);
  logger.info(`   ${results.replication ? '✅' : '❌'} Cross-Region Replication`);
  logger.info(`   ${results.cloudfront ? '✅' : '❌'} CloudFront Distribution`);
  logger.info('');

  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  if (successCount === totalCount) {
    logger.info('✅ Todas as configurações foram aplicadas com sucesso!');
  } else {
    logger.warn(`⚠️  ${successCount}/${totalCount} configurações aplicadas. Verifique os erros acima.`);
  }
}

// Executar script
setupInfrastructure()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Erro na configuração da infraestrutura:', error);
    process.exit(1);
  });
