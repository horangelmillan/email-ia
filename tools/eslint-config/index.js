import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export const base = tseslint.config(
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  eslintConfigPrettier,
);

export const node = {
  languageOptions: {
    globals: globals.node,
  },
};

export const browser = {
  languageOptions: {
    globals: globals.browser,
  },
};

export default { base, node, browser };
