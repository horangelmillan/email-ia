import { describe, expect, it } from 'vitest';
import { aiProviderName, AI_PROVIDER_PACKAGE } from './index.js';

describe('ai-provider', () => {
  it('exposes the package name', () => {
    expect(aiProviderName()).toBe(AI_PROVIDER_PACKAGE);
  });
});
