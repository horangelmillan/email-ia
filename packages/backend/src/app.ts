import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import * as pinoHttpImport from 'pino-http';
import type { Logger } from 'pino';
import { AppError, type PromptPort, type RagPort } from '@email-ia/core';
import { getHealth, getReadiness } from './health/health.js';
import { createPromptRouter } from './prompts/routes.js';
import { createRagRouter } from './rag/routes.js';

export interface CreateAppOptions {
  logger?: Logger;
  readinessChecks?: () => Record<string, 'ok' | 'error'> | Promise<Record<string, 'ok' | 'error'>>;
  setup?: (app: express.Express) => void;
  rag?: RagPort;
  prompts?: PromptPort;
}

export function createApp(options: CreateAppOptions = {}): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());

  if (options.logger) {
    const pinoHttp =
      (pinoHttpImport as unknown as { default?: typeof import('pino-http') }).default ??
      (pinoHttpImport as unknown as typeof import('pino-http'));
    app.use(
      (pinoHttp as unknown as (opts: unknown) => express.RequestHandler)({
        logger: options.logger,
      }),
    );
  }

  app.get('/health', (_req: Request, res: Response) => {
    res.json(getHealth());
  });

  app.get('/ready', async (_req: Request, res: Response) => {
    const checks = options.readinessChecks ? await options.readinessChecks() : {};
    const readiness = getReadiness(checks);
    const status = readiness.status === 'ok' ? 200 : 503;
    res.status(status).json(readiness);
  });

  if (options.rag) app.use('/rag', createRagRouter(options.rag));
  if (options.prompts) app.use('/prompts', createPromptRouter(options.prompts));

  if (options.setup) options.setup(app);

  // error handler — must be after routes
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      const status = err.status ?? 500;
      res.status(status).json({ code: err.code, message: err.message, details: err.details });
      return;
    }
    if (err instanceof Error) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: err.message });
      return;
    }
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unknown error' });
  });

  return app;
}
