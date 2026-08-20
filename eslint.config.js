import { base, browser, node } from '@email-ia/eslint-config';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
  ...base,
  {
    ...node,
    files: ['**/*.{ts,mts,cts,js,mjs,cjs}'],
  },
  {
    ...browser,
    files: ['packages/frontend/**/*.{ts,mts,cts,js,mjs,cjs}'],
  },
];
