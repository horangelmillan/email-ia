import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.js';

describe('parseEnv', () => {
  it('applies defaults when env is empty', () => {
    const env = parseEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.OTEL_ENABLED).toBe(false);
    expect(env.OTEL_SERVICE_NAME).toBe('email-ia');
    expect(env.OTEL_EXPORTER_OTLP_ENDPOINT).toBe('http://localhost:4318');
  });

  it('parses PORT from string', () => {
    expect(parseEnv({ PORT: '4000' }).PORT).toBe(4000);
  });

  it('parses OTEL_ENABLED from string true/false', () => {
    expect(parseEnv({ OTEL_ENABLED: 'true' }).OTEL_ENABLED).toBe(true);
    expect(parseEnv({ OTEL_ENABLED: 'false' }).OTEL_ENABLED).toBe(false);
    expect(parseEnv({ OTEL_ENABLED: '1' }).OTEL_ENABLED).toBe(true);
    expect(parseEnv({ OTEL_ENABLED: '' }).OTEL_ENABLED).toBe(false);
    expect(parseEnv({ OTEL_ENABLED: 'TRUE' }).OTEL_ENABLED).toBe(true);
  });

  it('rejects invalid LOG_LEVEL', () => {
    expect(() => parseEnv({ LOG_LEVEL: 'verbose' as unknown as string })).toThrow();
  });

  it('rejects invalid PORT', () => {
    expect(() => parseEnv({ PORT: '99999' })).toThrow();
  });

  it('rejects non-numeric PORT string', () => {
    expect(() => parseEnv({ PORT: 'abc' })).toThrow();
  });

  it('parses OTEL_EXPORTER_OTLP_ENDPOINT url', () => {
    expect(
      parseEnv({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector:4318' })
        .OTEL_EXPORTER_OTLP_ENDPOINT,
    ).toBe('http://collector:4318');
  });

  it('keeps optional DATABASE_URL undefined by default', () => {
    expect(parseEnv({}).DATABASE_URL).toBeUndefined();
  });

  it('parses NODE_ENV and LOG_LEVEL', () => {
    expect(parseEnv({ NODE_ENV: 'production' }).NODE_ENV).toBe('production');
    expect(parseEnv({ LOG_LEVEL: 'debug' }).LOG_LEVEL).toBe('debug');
  });

  it('parses DATABASE_URL when provided', () => {
    expect(parseEnv({ DATABASE_URL: 'file:./test.db' }).DATABASE_URL).toBe('file:./test.db');
  });

  it('loadEnv reads from process.env with defaults', async () => {
    const { loadEnv } = await import('./env.js');
    const prev = process.env.OTEL_ENABLED;
    process.env.OTEL_ENABLED = 'false';
    try {
      const env = loadEnv();
      expect(env.OTEL_ENABLED).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.OTEL_ENABLED;
      else process.env.OTEL_ENABLED = prev;
    }
  });
});
