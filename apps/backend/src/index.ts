import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './db/mongoose.js';
import { AlertService } from './services/alertService.js';
import { ObserverManager } from './services/observerManager.js';
import { RealtimeHub } from './services/realtimeHub.js';
import { StrategyEngine } from './services/strategyEngine.js';
import { logger } from './utils/logger.js';

const bootstrap = async () => {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);
  const hub = new RealtimeHub(server);
  const strategyEngine = new StrategyEngine(new AlertService());

  server.listen(env.port, () => {
    logger.info({ port: env.port }, 'Backend listening');
  });

  const observer = new ObserverManager(hub, strategyEngine);
  observer.start();
};

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to bootstrap application');
  process.exit(1);
});
