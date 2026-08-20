import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@email-ia/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
      '@email-ia/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@email-ia/db': fileURLToPath(new URL('./packages/db/src/index.ts', import.meta.url)),
      '@email-ia/ai-provider': fileURLToPath(
        new URL('./packages/ai-provider/src/index.ts', import.meta.url),
      ),
      '@email-ia/backend': fileURLToPath(
        new URL('./packages/backend/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['packages/{shared,core,db,ai-provider,backend}/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/{shared,core,db,ai-provider,backend}/src/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
