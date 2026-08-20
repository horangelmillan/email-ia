import { describe, expect, it } from 'vitest';
import { coreName, CORE_PACKAGE } from './index.js';

describe('core', () => {
  it('exposes the package name', () => {
    expect(coreName()).toBe(CORE_PACKAGE);
  });
});
