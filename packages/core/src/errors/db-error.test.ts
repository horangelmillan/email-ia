import { describe, expect, it } from 'vitest';
import { AppError, DbError } from '../index.js';

describe('DbError', () => {
  it('es un AppError con código DB_ERROR', () => {
    const err = new DbError('fallo bd', { reason: 'x' });
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('DB_ERROR');
    expect(err.message).toBe('fallo bd');
    expect(err.details).toEqual({ reason: 'x' });
    expect(err.name).toBe('DbError');
  });

  it('soporta detalles undefined', () => {
    const err = new DbError('boom');
    expect(err.details).toBeUndefined();
  });
});
