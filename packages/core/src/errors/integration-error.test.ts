import { describe, expect, it } from 'vitest';
import { AppError, IntegrationError } from '../index.js';

describe('IntegrationError', () => {
  it('es un AppError con código INTEGRATION_ERROR', () => {
    const err = new IntegrationError('fallo integración', 502, { provider: 'gmail' });
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('INTEGRATION_ERROR');
    expect(err.message).toBe('fallo integración');
    expect(err.status).toBe(502);
    expect(err.details).toEqual({ provider: 'gmail' });
    expect(err.name).toBe('IntegrationError');
  });

  it('soporta solo mensaje', () => {
    const err = new IntegrationError('boom');
    expect(err.status).toBeUndefined();
    expect(err.details).toBeUndefined();
  });

  it('soporta status sin details', () => {
    const err = new IntegrationError('x', 400);
    expect(err.status).toBe(400);
    expect(err.details).toBeUndefined();
  });
});
