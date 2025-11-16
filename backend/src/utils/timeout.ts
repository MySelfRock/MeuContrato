/**
 * Utilitários para gerenciar timeouts em operações assíncronas
 */

import { AppError } from '../middlewares/error.middleware';

/**
 * Executa uma promise com timeout
 * @param promise Promise a ser executada
 * @param timeoutMs Timeout em milissegundos
 * @param operationName Nome da operação (para mensagem de erro)
 * @returns Resultado da promise
 * @throws AppError se timeout for excedido
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string = 'operação'
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new AppError(
          408,
          `Timeout: ${operationName} excedeu o tempo limite de ${timeoutMs / 1000}s`
        )
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

/**
 * Retry com backoff exponencial
 * @param fn Função a ser executada
 * @param maxRetries Número máximo de tentativas
 * @param initialDelayMs Delay inicial em ms
 * @param operationName Nome da operação
 * @returns Resultado da função
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
  operationName: string = 'operação'
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `⚠️  ${operationName} falhou (tentativa ${attempt}/${maxRetries}). Tentando novamente em ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new AppError(
    500,
    `${operationName} falhou após ${maxRetries} tentativas: ${lastError!.message}`
  );
}

/**
 * Combina timeout e retry
 * @param fn Função a ser executada
 * @param timeoutMs Timeout em ms
 * @param maxRetries Número máximo de tentativas
 * @param operationName Nome da operação
 * @returns Resultado da função
 */
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000,
  maxRetries: number = 2,
  operationName: string = 'operação'
): Promise<T> {
  return retryWithBackoff(
    async () => withTimeout(fn(), timeoutMs, operationName),
    maxRetries,
    2000,
    operationName
  );
}
