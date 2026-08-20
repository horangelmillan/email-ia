import { describe, expect, it } from 'vitest';
import { identity, SHARED_PACKAGE } from './index.js';

describe('shared', () => {
  it('exposes the package name', () => {
    expect(SHARED_PACKAGE).toBe('@email-ia/shared');
  });

  it('returns the value passed to identity', () => {
    expect(identity('value')).toBe('value');
  });
});
