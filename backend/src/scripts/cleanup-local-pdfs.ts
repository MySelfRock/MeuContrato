/**
 * Script para limpar PDFs locais após migração para S3
 *
 * Este script:
 * 1. Lista todos os PDFs no diretório local (public/pdfs)
 * 2. Verifica se existem no S3
 * 3. Remove os arquivos locais se já estiverem no S3
 *
 * Uso: npm run cleanup:pdfs
 */

import fs from 'fs';
import path from 'path';
import { S3Service } from '../services/s3.service';
import { logger } from '../middlewares/logger.middleware';

const PDF_DIR = path.join(process.cwd(), 'public', 'pdfs');

async function cleanupLocalPDFs() {
  logger.info('🧹 Iniciando limpeza de PDFs locais...');

  if (!fs.existsSync(PDF_DIR)) {
    logger.info('✅ Diretório de PDFs locais não existe. Nada para limpar.');
    return;
  }

  const files = fs.readdirSync(PDF_DIR);

  if (files.length === 0) {
    logger.info('✅ Nenhum PDF local encontrado.');
    return;
  }

  logger.info(`📄 Encontrados ${files.length} arquivos locais`);

  let deletedCount = 0;
  let keptCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(PDF_DIR, file);

    // Ignorar diretórios
    if (fs.statSync(filePath).isDirectory()) {
      continue;
    }

    // Apenas arquivos PDF
    if (!file.endsWith('.pdf')) {
      logger.warn(`⚠️  Ignorando arquivo não-PDF: ${file}`);
      keptCount++;
      continue;
    }

    try {
      // Verificar se existe no S3
      const s3Key = `contracts/${file}`;
      const existsInS3 = await S3Service.fileExists(s3Key);

      if (existsInS3) {
        // Arquivo já está no S3, pode deletar local
        fs.unlinkSync(filePath);
        logger.info(`✅ Removido (já no S3): ${file}`);
        deletedCount++;
      } else {
        // Arquivo não está no S3, manter local
        logger.warn(`⚠️  Mantido (não encontrado no S3): ${file}`);
        keptCount++;
      }
    } catch (error: any) {
      logger.error(`❌ Erro ao processar ${file}:`, error.message);
      errorCount++;
    }
  }

  logger.info('\n📊 Resumo da limpeza:');
  logger.info(`   ✅ Removidos: ${deletedCount}`);
  logger.info(`   ⚠️  Mantidos: ${keptCount}`);
  logger.info(`   ❌ Erros: ${errorCount}`);

  // Se diretório estiver vazio, remover
  const remainingFiles = fs.readdirSync(PDF_DIR);
  if (remainingFiles.length === 0) {
    fs.rmdirSync(PDF_DIR);
    logger.info('🗑️  Diretório de PDFs locais removido (vazio)');
  }

  logger.info('✅ Limpeza concluída!');
}

// Executar script
cleanupLocalPDFs()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Erro na limpeza:', error);
    process.exit(1);
  });
