/**
 * Service para operações com AWS S3
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_CONFIG } from '../config/s3';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../middlewares/logger.middleware';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import {
  getCloudFrontUrl,
  invalidateCloudFrontCache,
  cloudFrontConfig,
} from '../config/cloudfront';

export interface UploadParams {
  file: Buffer | Readable;
  fileName: string;
  contentType: string;
  folder?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size?: number;
}

export class S3Service {
  /**
   * Faz upload de um arquivo para o S3
   */
  static async uploadFile(params: UploadParams): Promise<UploadResult> {
    const { file, fileName, contentType, folder, metadata } = params;

    try {
      // Gerar nome único para o arquivo
      const fileKey = this.generateFileKey(fileName, folder);

      // Validar tamanho do arquivo (se for Buffer)
      if (Buffer.isBuffer(file) && file.length > S3_CONFIG.MAX_FILE_SIZE) {
        throw new AppError(
          413,
          `Arquivo excede o tamanho máximo de ${S3_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`
        );
      }

      const command = new PutObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: fileKey,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
        ServerSideEncryption: 'AES256', // Criptografia no lado do servidor
        StorageClass: 'STANDARD', // Usar INTELLIGENT_TIERING em produção para otimização de custos
      });

      await s3Client.send(command);

      logger.info(`Arquivo enviado para S3: ${fileKey}`, {
        key: fileKey,
        bucket: S3_CONFIG.BUCKET_NAME,
        contentType,
      });

      return {
        key: fileKey,
        url: this.getPublicUrl(fileKey),
        bucket: S3_CONFIG.BUCKET_NAME,
        size: Buffer.isBuffer(file) ? file.length : undefined,
      };
    } catch (error: any) {
      logger.error('Erro ao fazer upload para S3', {
        error: error.message,
        fileName,
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, `Erro ao fazer upload do arquivo: ${error.message}`);
    }
  }

  /**
   * Gera URL pré-assinada para download (expira em 1 hora)
   * Se CloudFront estiver configurado, retorna URL do CloudFront (sem expiração)
   * Senão, retorna presigned URL do S3 (com expiração)
   */
  static async getPresignedUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      // Se CloudFront estiver habilitado, usar URL do CloudFront
      if (cloudFrontConfig.enabled) {
        const cloudFrontUrl = getCloudFrontUrl(key);
        if (cloudFrontUrl) {
          logger.info('Usando CloudFront URL para download', { key });
          return cloudFrontUrl;
        }
      }

      // Fallback: gerar presigned URL do S3
      const command = new GetObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(
        s3Client,
        command,
        { expiresIn: expiresIn || S3_CONFIG.PRESIGNED_URL_EXPIRATION }
      );

      return url;
    } catch (error: any) {
      logger.error('Erro ao gerar URL pré-assinada', {
        error: error.message,
        key,
      });
      throw new AppError(500, `Erro ao gerar URL de download: ${error.message}`);
    }
  }

  /**
   * Deleta um arquivo do S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);

      logger.info(`Arquivo deletado do S3: ${key}`, { key });

      // Invalidar cache do CloudFront se estiver habilitado
      if (cloudFrontConfig.enabled) {
        await this.invalidateCache([key]);
      }
    } catch (error: any) {
      logger.error('Erro ao deletar arquivo do S3', {
        error: error.message,
        key,
      });
      throw new AppError(500, `Erro ao deletar arquivo: ${error.message}`);
    }
  }

  /**
   * Invalida cache do CloudFront para arquivos específicos
   */
  static async invalidateCache(keys: string[]): Promise<void> {
    if (!cloudFrontConfig.enabled) {
      logger.debug('CloudFront não habilitado, pulando invalidação de cache');
      return;
    }

    try {
      // Converter chaves S3 para paths do CloudFront
      const paths = keys.map((key) => {
        // Remover 'contracts/' do início se existir
        const path = key.startsWith('contracts/') ? key.substring(10) : key;
        return `/contracts/${path}`;
      });

      await invalidateCloudFrontCache(paths);
    } catch (error: any) {
      logger.error('Erro ao invalidar cache do CloudFront', {
        error: error.message,
        keys: keys.length,
      });
      // Não lançar erro - cache eventualmente expirará
    }
  }

  /**
   * Verifica se um arquivo existe no S3
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Lista arquivos em uma pasta específica
   */
  static async listFiles(folder: string, maxKeys: number = 100): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Prefix: folder.endsWith('/') ? folder : `${folder}/`,
        MaxKeys: maxKeys,
      });

      const response = await s3Client.send(command);
      return response.Contents?.map((item) => item.Key!) || [];
    } catch (error: any) {
      logger.error('Erro ao listar arquivos do S3', {
        error: error.message,
        folder,
      });
      throw new AppError(500, `Erro ao listar arquivos: ${error.message}`);
    }
  }

  /**
   * Obtém informações sobre um arquivo
   */
  static async getFileInfo(key: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);

      return {
        key,
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata,
        etag: response.ETag,
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        throw new AppError(404, 'Arquivo não encontrado');
      }
      throw new AppError(500, `Erro ao obter informações do arquivo: ${error.message}`);
    }
  }

  /**
   * Gera chave única para o arquivo
   */
  private static generateFileKey(fileName: string, folder?: string): string {
    // Remover caracteres especiais do nome do arquivo
    const sanitizedName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_');

    // Gerar hash único para evitar conflitos
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();

    // Extrair extensão
    const extension = sanitizedName.includes('.')
      ? sanitizedName.substring(sanitizedName.lastIndexOf('.'))
      : '';

    const baseName = extension
      ? sanitizedName.substring(0, sanitizedName.lastIndexOf('.'))
      : sanitizedName;

    // Criar nome único
    const uniqueName = `${baseName}_${timestamp}_${hash}${extension}`;

    // Combinar com pasta
    const baseFolder = folder || S3_CONFIG.CONTRACTS_FOLDER;
    return `${baseFolder}/${uniqueName}`;
  }

  /**
   * Gera URL pública (não funciona com bucket privado, use getPresignedUrl)
   */
  private static getPublicUrl(key: string): string {
    // Para buckets privados, esta URL não funcionará diretamente
    // Use getPresignedUrl() para gerar URLs acessíveis
    return `https://${S3_CONFIG.BUCKET_NAME}.s3.${S3_CONFIG.REGION}.amazonaws.com/${key}`;
  }

  /**
   * Deleta múltiplos arquivos (útil para cleanup)
   */
  static async deleteMultipleFiles(keys: string[]): Promise<void> {
    try {
      const deletePromises = keys.map((key) => this.deleteFile(key));
      await Promise.all(deletePromises);

      logger.info(`${keys.length} arquivos deletados do S3`, {
        count: keys.length,
      });
    } catch (error: any) {
      logger.error('Erro ao deletar múltiplos arquivos', {
        error: error.message,
        count: keys.length,
      });
      throw new AppError(500, 'Erro ao deletar arquivos');
    }
  }

  /**
   * Limpa arquivos antigos de uma pasta (útil para manutenção)
   */
  static async cleanupOldFiles(folder: string, daysOld: number = 30): Promise<number> {
    try {
      const files = await this.listFiles(folder, 1000);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const filesToDelete: string[] = [];

      for (const key of files) {
        const info = await this.getFileInfo(key);
        if (info.lastModified && info.lastModified < cutoffDate) {
          filesToDelete.push(key);
        }
      }

      if (filesToDelete.length > 0) {
        await this.deleteMultipleFiles(filesToDelete);
        logger.info(`Cleanup: ${filesToDelete.length} arquivos antigos removidos`, {
          folder,
          daysOld,
          count: filesToDelete.length,
        });
      }

      return filesToDelete.length;
    } catch (error: any) {
      logger.error('Erro no cleanup de arquivos antigos', {
        error: error.message,
        folder,
      });
      return 0;
    }
  }
}
