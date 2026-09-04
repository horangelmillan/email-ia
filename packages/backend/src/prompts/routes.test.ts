import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { createPromptRouter } from './routes.js';
import type { PromptTemplate, GoldenCase } from '@email-ia/core';

const tpl: PromptTemplate = {
  name: 'summarize-email',
  version: '1.0.0',
  variables: [{ name: 'body', type: 'string', required: true }],
  messages: [{ role: 'user', content: 'Summarize {{body}}' }],
};

describe('createPromptRouter', () => {
  it('GET /prompts lists templates', async () => {
    const svc = {
      list: vi.fn(async () => [tpl]),
      get: vi.fn(),
      render: vi.fn(),
      evaluate: vi.fn(),
    };
    const app = createApp();
    app.use('/prompts', createPromptRouter(svc as never));
    const res = await request(app).get('/prompts');
    expect(res.status).toBe(200);
    expect(res.body.templates).toHaveLength(1);
  });

  it('GET /prompts/:name returns template', async () => {
    const svc = {
      list: vi.fn(),
      get: vi.fn(async () => tpl),
      render: vi.fn(),
      evaluate: vi.fn(),
    };
    const app = createApp();
    app.use('/prompts', createPromptRouter(svc as never));
    const res = await request(app).get('/prompts/summarize-email');
    expect(res.status).toBe(200);
    expect(res.body.template.name).toBe('summarize-email');
  });

  it('GET /prompts/:name returns 404 if not found', async () => {
    const svc = {
      list: vi.fn(),
      get: vi.fn(async () => null),
      render: vi.fn(),
      evaluate: vi.fn(),
    };
    const app = createApp();
    app.use('/prompts', createPromptRouter(svc as never));
    const res = await request(app).get('/prompts/missing');
    expect(res.status).toBe(404);
  });

  it('POST /prompts/render renders messages', async () => {
    const svc = {
      list: vi.fn(),
      get: vi.fn(),
      render: vi.fn(async () => [{ role: 'user', content: 'hi' }]),
      evaluate: vi.fn(),
    };
    const app = createApp();
    app.use('/prompts', createPromptRouter(svc as never));
    const res = await request(app)
      .post('/prompts/render')
      .send({ name: 'summarize-email', variables: { body: 'hi' } });
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
  });

  it('POST /prompts/evaluate evaluates cases', async () => {
    const fakeResult = {
      total: 1,
      passed: 1,
      failed: 0,
      cases: [{ id: 'c1', passed: true, actual: 'hello', expected: 'hello' }],
    };
    const svc = {
      list: vi.fn(),
      get: vi.fn(),
      render: vi.fn(),
      evaluate: vi.fn(async (_cases: GoldenCase[]) => fakeResult),
    };
    const app = createApp();
    app.use('/prompts', createPromptRouter(svc as never));
    const res = await request(app)
      .post('/prompts/evaluate')
      .send({
        cases: [
          { id: 'c1', promptName: 'summarize-email', variables: { body: 'hi' }, expected: 'hello' },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.result.passed).toBe(1);
  });

  it('POST /prompts/render returns 400 if missing name', async () => {
    const svc = { list: vi.fn(), get: vi.fn(), render: vi.fn(), evaluate: vi.fn() };
    const app = createApp();
    app.use('/prompts', createPromptRouter(svc as never));
    const res = await request(app).post('/prompts/render').send({ variables: {} });
    expect(res.status).toBe(400);
  });
});
