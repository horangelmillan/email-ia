import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { AppError } from '@email-ia/core';
import { createApp } from './app.js';

describe('createApp', () => {
  it('GET /health returns 200 ok', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /ready returns 200 when checks ok', async () => {
    const app = createApp({ readinessChecks: () => ({ db: 'ok' }) });
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks).toEqual({ db: 'ok' });
  });

  it('GET /ready returns 503 when checks error', async () => {
    const app = createApp({ readinessChecks: () => ({ db: 'error' }) });
    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
  });

  it('applies helmet/cors/compression headers', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('handles AppError via error middleware', async () => {
    const app = createApp({
      setup(app) {
        app.get('/boom', (_req, _res, next) => {
          next(new AppError('not found', 'NOT_FOUND', { status: 404 }));
        });
      },
    });
    const res = await request(app).get('/boom');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('works with pino logger without crashing', async () => {
    const { Writable } = await import('node:stream');
    let buf = '';
    const stream = new Writable({
      write(chunk, _enc, cb) {
        buf += chunk.toString();
        cb();
      },
    });
    const { createLogger } = await import('./observability/logger.js');
    const logger = createLogger(
      { level: 'silent' },
      stream as unknown as import('pino').DestinationStream,
    );
    // ensure logger has pino levels (real instance)
    expect(logger.level).toBe('silent');
    const app = createApp({ logger });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    void buf;
  });

  it('handles generic Error via 500', async () => {
    const app = createApp({
      setup(app) {
        app.get('/boom2', (_req, _res, next) => {
          next(new Error('generic failure'));
        });
      },
    });
    const res = await request(app).get('/boom2');
    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });

  it('handles unknown error via 500', async () => {
    const app = createApp({
      setup(app) {
        app.get('/boom3', (_req, _res, next) => {
          next('string-error' as unknown as Error);
        });
      },
    });
    const res = await request(app).get('/boom3');
    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });

  it('supports async readinessChecks', async () => {
    const app = createApp({ readinessChecks: async () => ({ db: 'ok', cache: 'ok' }) });
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.checks.cache).toBe('ok');
  });
});
