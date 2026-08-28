import dotenv from 'dotenv';
import { z } from 'zod';

function booleanFromString(defaultValue: boolean) {
  return z.preprocess((val) => {
    if (val === undefined || val === '') return defaultValue;
    if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
    return Boolean(val);
  }, z.boolean());
}

const portSchema = z.preprocess((val) => {
  if (val === undefined || val === '') return undefined;
  if (typeof val === 'string') {
    const n = Number(val);
    return Number.isNaN(n) ? val : n;
  }
  return val;
}, z.number().int().min(1).max(65535));

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: portSchema.default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  OTEL_ENABLED: booleanFromString(false).default(false),
  OTEL_SERVICE_NAME: z.string().min(1).default('email-ia'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().default('http://localhost:4318'),
  DATABASE_URL: z.string().optional(),
  DATABASE_ENCRYPTION_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | string[] | undefined>): Env {
  return envSchema.parse(raw);
}

export function loadEnv(): Env {
  dotenv.config();
  return parseEnv(process.env as Record<string, string | undefined>);
}
