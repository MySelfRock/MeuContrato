import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Garantir que diretório de logs existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuração de rotação diária para erros
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m', // Máximo 20MB por arquivo
  maxFiles: '30d', // Manter logs por 30 dias
  zippedArchive: true, // Comprimir logs antigos
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
});

// Configuração de rotação diária para logs combinados
const combinedRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // Manter logs combinados por 14 dias
  zippedArchive: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

// Configuração de rotação para logs de requisições (access log)
const accessRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'access-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '50m', // Access logs podem ser maiores
  maxFiles: '7d', // Manter apenas 7 dias
  zippedArchive: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

// Configure Winston logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json()
  ),
  transports: [
    // Console (apenas em desenvolvimento)
    ...(process.env.NODE_ENV !== 'production'
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length
                  ? `\n${JSON.stringify(meta, null, 2)}`
                  : '';
                return `${timestamp} [${level}]: ${message}${metaStr}`;
              })
            ),
          }),
        ]
      : []),

    // Logs rotativos
    errorRotateTransport,
    combinedRotateTransport,
  ],
  // Não sair em caso de erro no logger
  exitOnError: false,
});

// Logger separado para access logs
export const accessLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [accessRotateTransport],
  exitOnError: false,
});

// Eventos de rotação de logs
errorRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info(`Log rotacionado: ${oldFilename} → ${newFilename}`);
});

combinedRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info(`Log rotacionado: ${oldFilename} → ${newFilename}`);
});

// Request logging middleware com request ID
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = generateRequestId();

  // Adicionar request ID ao request (útil para correlacionar logs)
  (req as any).requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      referer: req.get('referer'),
      contentLength: res.get('content-length'),
    };

    // Logar em ambos os loggers
    accessLogger.info('HTTP Request', logData);

    // Se erro (4xx ou 5xx), logar também no logger principal
    if (res.statusCode >= 400) {
      logger.warn('HTTP Error', logData);
    }
  });

  next();
};

// Gerar ID único para requisição
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Stream para uso com morgan (opcional)
export const logStream = {
  write: (message: string) => {
    accessLogger.info(message.trim());
  },
};

// Helper para adicionar contexto aos logs
export function logWithContext(level: string, message: string, context: Record<string, any> = {}) {
  logger.log(level, message, context);
}

// Exportar níveis de log
export const LogLevels = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
};
