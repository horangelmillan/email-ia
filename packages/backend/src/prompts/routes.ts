import { Router, type Request, type Response, type NextFunction } from 'express';
import type { PromptPort, GoldenCase } from '@email-ia/core';

export function createPromptRouter(prompt: PromptPort): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await prompt.list();
      res.json({ templates });
    } catch (e) {
      next(e);
    }
  });

  router.get('/:name', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const name = req.params.name as string;
      const version = typeof req.query.version === 'string' ? req.query.version : undefined;
      const tpl = await prompt.get(name, version);
      if (!tpl) {
        res.status(404).json({ code: 'NOT_FOUND', message: `Prompt not found: ${name}` });
        return;
      }
      res.json({ template: tpl });
    } catch (e) {
      next(e);
    }
  });

  router.post('/render', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, variables, version } = req.body as {
        name?: string;
        variables?: Record<string, unknown>;
        version?: string;
      };
      if (!name || typeof name !== 'string') {
        res.status(400).json({ code: 'VALIDATION_ERROR', message: 'name is required' });
        return;
      }
      if (
        variables !== undefined &&
        (typeof variables !== 'object' || variables === null || Array.isArray(variables))
      ) {
        res.status(400).json({ code: 'VALIDATION_ERROR', message: 'variables must be object' });
        return;
      }
      const messages = await prompt.render(
        name,
        (variables ?? {}) as Record<string, unknown>,
        version,
      );
      res.json({ messages });
    } catch (e) {
      next(e);
    }
  });

  // note: must be registered before GET /:name to avoid collision, but POST so fine
  router.post('/evaluate', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cases } = req.body as { cases?: GoldenCase[] };
      if (!Array.isArray(cases)) {
        res.status(400).json({ code: 'VALIDATION_ERROR', message: 'cases must be array' });
        return;
      }
      const result = await prompt.evaluate(cases);
      res.json({ result });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
