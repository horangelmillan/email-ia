import { base, browser, node } from '@email-ia/eslint-config';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-electron/**',
      '**/release/**',
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
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
