import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { createRagRouter } from './routes.js';

describe('createRagRouter', () => {
  it('GET /rag/search returns results', async () => {
    const rag = {
      search: vi.fn(async () => [
        {
          chunk: {
            emailId: 'e1',
            accountId: 'a1',
            index: 0,
            content: 'hello',
            embedding: [1, 0],
            createdAt: new Date(),
          },
          score: 0.9,
        },
      ]),
      indexEmail: vi.fn(),
      indexAccount: vi.fn(),
    };
    const app = createApp();
    app.use('/rag', createRagRouter(rag as never));
    const res = await request(app).get('/rag/search').query({ q: 'hello' });
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(rag.search).toHaveBeenCalledWith('hello', { limit: 5, accountId: undefined });
  });

  it('GET /rag/search requires q param', async () => {
    const rag = { search: vi.fn(), indexEmail: vi.fn(), indexAccount: vi.fn() };
    const app = createApp();
    app.use('/rag', createRagRouter(rag as never));
    const res = await request(app).get('/rag/search');
    expect(res.status).toBe(400);
  });

  it('GET /rag/search respects limit and accountId', async () => {
    const rag = {
      search: vi.fn(async () => []),
      indexEmail: vi.fn(),
      indexAccount: vi.fn(),
    };
    const app = createApp();
    app.use('/rag', createRagRouter(rag as never));
    const res = await request(app)
      .get('/rag/search')
      .query({ q: 'hi', limit: '2', accountId: 'acc1' });
    expect(res.status).toBe(200);
    expect(rag.search).toHaveBeenCalledWith('hi', { limit: 2, accountId: 'acc1' });
  });

  it('GET /rag/search returns 400 for invalid limit', async () => {
    const rag = { search: vi.fn(), indexEmail: vi.fn(), indexAccount: vi.fn() };
    const app = createApp();
    app.use('/rag', createRagRouter(rag as never));
    const res = await request(app).get('/rag/search').query({ q: 'hi', limit: '999' });
    expect(res.status).toBe(400);
  });
});
