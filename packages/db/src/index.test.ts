import { describe, expect, it } from 'vitest';
import { dbName, DB_PACKAGE } from './index.js';

describe('db', () => {
  it('exposes the package name', () => {
    expect(dbName()).toContain(DB_PACKAGE);
  });
});
