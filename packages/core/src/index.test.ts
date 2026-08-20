import { describe, expect, it } from 'vitest';
import { AppError, coreName, CORE_PACKAGE, ProviderError } from './index.js';

describe('core', () => {
  it('exposes the package name', () => {
    expect(coreName()).toBe(CORE_PACKAGE);
  });
});

describe('AppError', () => {
  it('carga código, nombre y opciones', () => {
    const error = new AppError('boom', 'TEST_ERROR', { status: 400, details: { campo: 'x' } });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.status).toBe(400);
    expect(error.details).toEqual({ campo: 'x' });
    expect(error.message).toBe('boom');
  });

  it('omite status y details cuando no se proporcionan', () => {
    const error = new AppError('boom', 'TEST_ERROR');

    expect(error.status).toBeUndefined();
    expect(error.details).toBeUndefined();
  });
});

describe('ProviderError', () => {
  it('es un AppError con código de proveedor', () => {
    const error = new ProviderError('fallo del proveedor');

    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('ProviderError');
    expect(error.code).toBe('PROVIDER_ERROR');
    expect(error.status).toBeUndefined();
  });

  it('conserva el status HTTP cuando se indica', () => {
    const error = new ProviderError('HTTP 500', 500);

    expect(error.status).toBe(500);
  });
});
