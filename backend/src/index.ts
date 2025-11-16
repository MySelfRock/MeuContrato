import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables FIRST
dotenv.config();

// Validate environment variables before anything else
import { env } from './config/env';

// Routes
import authRoutes from './routes/auth.routes';
import templateRoutes from './routes/template.routes';
import contractRoutes from './routes/contract.routes';
import userRoutes from './routes/user.routes';
import stripeRoutes from './routes/stripe.routes';
import signatureRoutes from './routes/signature.routes';

// Middlewares
import { errorHandler } from './middlewares/error.middleware';
import { rateLimiter } from './middlewares/rateLimit.middleware';
import { requestLogger } from './middlewares/logger.middleware';

const app: Express = express();
const PORT = env.PORT;

// Security & Parsing Middlewares
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Middlewares
app.use(requestLogger);
app.use(rateLimiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MeuContrato API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/signatures', signatureRoutes);

// Servir arquivos estáticos (PDFs)
app.use('/pdfs', express.static('public/pdfs'));

// Error Handler (must be last)
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 API: http://localhost:${PORT}`);
  console.log(`✨ Sistema pronto para uso!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
