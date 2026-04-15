import cors from 'cors';
import express from 'express';
import { pinoHttp } from 'pino-http';
import authRoutes from './routes/auth.js';
import strategyRoutes from './routes/strategies.js';
import dataRoutes from './routes/data.js';
import { logger } from './utils/logger.js';

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));
  app.use('/api/auth', authRoutes);
  app.use('/api/strategies', strategyRoutes);
  app.use('/api/data', dataRoutes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
};
