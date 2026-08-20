import { describe, expect, it } from 'vitest';
import { backendName, BACKEND_PACKAGE } from './index.js';

describe('backend', () => {
  it('exposes the package name', () => {
    expect(backendName()).toContain(BACKEND_PACKAGE);
  });

  it('resolves workspace dependencies', () => {
    expect(backendName()).toContain('@email-ia/core');
    expect(backendName()).toContain('@email-ia/db');
    expect(backendName()).toContain('@email-ia/ai-provider');
    expect(backendName()).toContain('@email-ia/shared');
  });
});
