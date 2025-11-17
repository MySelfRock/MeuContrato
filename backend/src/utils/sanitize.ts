/**
 * Utilitários para sanitização de inputs
 * Especialmente importante para prevenir prompt injection em IAs
 */

import { AppError } from '../middlewares/error.middleware';

/**
 * Limites de segurança
 */
const LIMITS = {
  MAX_STRING_LENGTH: 5000, // 5KB por campo
  MAX_TOTAL_SIZE: 100000, // 100KB total
  MAX_OBJECT_DEPTH: 5,
  MAX_ARRAY_LENGTH: 100,
};

/**
 * Padrões perigosos que podem indicar prompt injection
 */
const DANGEROUS_PATTERNS = [
  /ignore\s+(previous|all|above)\s+instructions?/gi,
  /forget\s+(everything|all|previous)/gi,
  /you\s+are\s+now/gi,
  /new\s+instructions?:/gi,
  /disregard\s+(previous|all)/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
  /\[SYSTEM\]/gi,
  /\[ASSISTANT\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
];

/**
 * Sanitiza uma string removendo padrões perigosos
 */
export function sanitizeString(value: string, fieldName: string = 'campo'): string {
  if (typeof value !== 'string') {
    throw new AppError(400, `${fieldName} deve ser uma string`);
  }

  // Validar tamanho
  if (value.length > LIMITS.MAX_STRING_LENGTH) {
    throw new AppError(
      400,
      `${fieldName} excede o tamanho máximo de ${LIMITS.MAX_STRING_LENGTH} caracteres`
    );
  }

  // Detectar padrões de prompt injection
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(value)) {
      console.warn(`⚠️  Possível tentativa de prompt injection detectada em ${fieldName}`);
      throw new AppError(
        400,
        `${fieldName} contém padrão não permitido. Por favor, reformule sua entrada.`
      );
    }
  }

  // Remover caracteres de controle perigosos (exceto \n, \t, \r)
  const sanitized = value.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Limitar múltiplas quebras de linha consecutivas
  const normalized = sanitized.replace(/\n{5,}/g, '\n\n\n\n');

  return normalized.trim();
}

/**
 * Sanitiza um número
 */
export function sanitizeNumber(value: any, fieldName: string = 'campo'): number {
  const num = Number(value);

  if (isNaN(num)) {
    throw new AppError(400, `${fieldName} deve ser um número válido`);
  }

  if (!isFinite(num)) {
    throw new AppError(400, `${fieldName} deve ser um número finito`);
  }

  return num;
}

/**
 * Sanitiza uma data
 */
export function sanitizeDate(value: any, fieldName: string = 'campo'): string {
  if (typeof value === 'string') {
    // Validar formato ISO ou DD/MM/YYYY
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    const brPattern = /^\d{2}\/\d{2}\/\d{4}$/;

    if (!isoPattern.test(value) && !brPattern.test(value)) {
      throw new AppError(
        400,
        `${fieldName} deve estar no formato YYYY-MM-DD ou DD/MM/YYYY`
      );
    }

    return value;
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  throw new AppError(400, `${fieldName} deve ser uma data válida`);
}

/**
 * Calcula o tamanho aproximado de um objeto em bytes
 */
function getObjectSize(obj: any, depth = 0): number {
  if (depth > LIMITS.MAX_OBJECT_DEPTH) {
    throw new AppError(400, `Objeto excede profundidade máxima de ${LIMITS.MAX_OBJECT_DEPTH}`);
  }

  let size = 0;

  if (typeof obj === 'string') {
    size = obj.length * 2; // 2 bytes por char (UTF-16)
  } else if (typeof obj === 'number') {
    size = 8; // 8 bytes para number
  } else if (typeof obj === 'boolean') {
    size = 4; // 4 bytes para boolean
  } else if (obj === null || obj === undefined) {
    size = 0;
  } else if (Array.isArray(obj)) {
    if (obj.length > LIMITS.MAX_ARRAY_LENGTH) {
      throw new AppError(400, `Array excede tamanho máximo de ${LIMITS.MAX_ARRAY_LENGTH} itens`);
    }
    for (const item of obj) {
      size += getObjectSize(item, depth + 1);
    }
  } else if (typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        size += key.length * 2; // tamanho da chave
        size += getObjectSize(obj[key], depth + 1); // tamanho do valor
      }
    }
  }

  return size;
}

/**
 * Sanitiza um objeto de respostas (usado em contratos)
 */
export function sanitizeAnswers(answers: Record<string, any>): Record<string, string> {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new AppError(400, 'Respostas devem ser um objeto válido');
  }

  // Validar tamanho total
  const totalSize = getObjectSize(answers);
  if (totalSize > LIMITS.MAX_TOTAL_SIZE) {
    throw new AppError(
      400,
      `Dados excedem o tamanho máximo permitido de ${LIMITS.MAX_TOTAL_SIZE / 1000}KB`
    );
  }

  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(answers)) {
    // Sanitizar a chave
    const sanitizedKey = sanitizeString(key, 'nome do campo');

    if (!sanitizedKey || sanitizedKey.length === 0) {
      continue; // Pular campos vazios
    }

    // Sanitizar o valor baseado no tipo
    if (value === null || value === undefined) {
      sanitized[sanitizedKey] = '';
    } else if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value, key);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = String(sanitizeNumber(value, key));
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value ? 'Sim' : 'Não';
    } else if (value instanceof Date) {
      sanitized[sanitizedKey] = sanitizeDate(value, key);
    } else if (typeof value === 'object') {
      // Converter objetos para string JSON sanitizado
      sanitized[sanitizedKey] = sanitizeString(JSON.stringify(value), key);
    } else {
      sanitized[sanitizedKey] = sanitizeString(String(value), key);
    }
  }

  // Validar que há pelo menos um campo
  if (Object.keys(sanitized).length === 0) {
    throw new AppError(400, 'Respostas não podem estar vazias');
  }

  return sanitized;
}

/**
 * Sanitiza texto de contrato (para revisão ou sugestões)
 */
export function sanitizeContractText(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new AppError(400, 'Texto do contrato deve ser uma string válida');
  }

  // Validar tamanho (contratos podem ser longos, mas não infinitos)
  const MAX_CONTRACT_LENGTH = 50000; // 50KB
  if (text.length > MAX_CONTRACT_LENGTH) {
    throw new AppError(
      400,
      `Texto do contrato excede o tamanho máximo de ${MAX_CONTRACT_LENGTH / 1000}KB`
    );
  }

  // Detectar padrões perigosos
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(text)) {
      console.warn('⚠️  Possível tentativa de prompt injection detectada no texto do contrato');
      throw new AppError(
        400,
        'Texto do contrato contém padrões não permitidos'
      );
    }
  }

  return text.trim();
}

/**
 * Sanitiza nome de template/categoria
 */
export function sanitizeIdentifier(value: string, fieldName: string = 'identificador'): string {
  if (typeof value !== 'string') {
    throw new AppError(400, `${fieldName} deve ser uma string`);
  }

  // Remover espaços e caracteres especiais
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .substring(0, 100);

  if (sanitized.length === 0) {
    throw new AppError(400, `${fieldName} inválido`);
  }

  return sanitized;
}

/**
 * Valida e sanitiza email
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    throw new AppError(400, 'Email deve ser uma string');
  }

  const sanitized = email.trim().toLowerCase();

  // Regex simples de validação de email
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(sanitized)) {
    throw new AppError(400, 'Email inválido');
  }

  if (sanitized.length > 254) {
    throw new AppError(400, 'Email muito longo');
  }

  return sanitized;
}

/**
 * Remove tags HTML e scripts (proteção XSS)
 */
export function stripHtml(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/gi, '')
    .trim();
}
