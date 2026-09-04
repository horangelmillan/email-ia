import { Router, type Request, type Response, type NextFunction } from 'express';
import type { RagPort } from '@email-ia/core';

export function createRagRouter(rag: RagPort): Router {
  const router = Router();

  router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      if (!q) {
        res.status(400).json({ code: 'VALIDATION_ERROR', message: 'query param q is required' });
        return;
      }
      const rawLimit = req.query.limit;
      let limit = 5;
      if (rawLimit !== undefined) {
        const parsed = Number.parseInt(String(rawLimit), 10);
        if (Number.isNaN(parsed) || parsed < 1 || parsed > 50) {
          res
            .status(400)
            .json({ code: 'VALIDATION_ERROR', message: 'limit must be integer 1..50' });
          return;
        }
        limit = parsed;
      }
      const accountId = typeof req.query.accountId === 'string' ? req.query.accountId : undefined;
      const results = await rag.search(q, {
        limit,
        ...(accountId !== undefined ? { accountId } : {}),
      });
      res.json({ results });
    } catch (e) {
      next(e);
    }
  });

  return router;
}
