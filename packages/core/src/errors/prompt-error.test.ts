import { describe, expect, it } from 'vitest';
import { AppError, PromptError } from '../index.js';

describe('PromptError', () => {
  it('es un AppError con código PROMPT_ERROR', () => {
    const err = new PromptError('fallo prompt', { field: 'x' });
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('PROMPT_ERROR');
    expect(err.status).toBe(400);
    expect(err.details).toEqual({ field: 'x' });
    expect(err.name).toBe('PromptError');
  });

  it('soporta solo mensaje', () => {
    const err = new PromptError('boom');
    expect(err.details).toBeUndefined();
    expect(err.status).toBe(400);
  });
});
