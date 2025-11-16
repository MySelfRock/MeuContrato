/**
 * Configuração do AWS S3
 */

import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { env } from './env';

// Configuração do cliente S3
const s3Config: S3ClientConfig = {
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
};

// Se estiver usando LocalStack ou MinIO para desenvolvimento
if (env.NODE_ENV === 'development' && env.AWS_ENDPOINT) {
  s3Config.endpoint = env.AWS_ENDPOINT;
  s3Config.forcePathStyle = true; // Necessário para LocalStack/MinIO
}

// Cliente S3 singleton
export const s3Client = new S3Client(s3Config);

// Configurações do bucket
export const S3_CONFIG = {
  BUCKET_NAME: env.AWS_S3_BUCKET,
  REGION: env.AWS_REGION,
  // URLs pré-assinadas expiram em 1 hora
  PRESIGNED_URL_EXPIRATION: 3600,
  // Pasta para PDFs de contratos
  CONTRACTS_FOLDER: 'contracts',
  // Tamanho máximo de arquivo (50MB)
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  // ACL padrão (private para segurança)
  DEFAULT_ACL: 'private' as const,
};

export default s3Client;
