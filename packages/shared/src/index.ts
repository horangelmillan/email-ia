export const SHARED_PACKAGE = '@email-ia/shared' as const;

export function identity<T>(value: T): T {
  return value;
}

export { envSchema, loadEnv, parseEnv } from './config/env.js';
export type { Env } from './config/env.js';
