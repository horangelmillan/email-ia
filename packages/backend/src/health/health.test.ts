import { describe, expect, it } from 'vitest';
import { getHealth, getReadiness } from './health.js';

describe('health', () => {
  it('getHealth returns ok with timestamp and uptime', () => {
    const h = getHealth();
    expect(h.status).toBe('ok');
    expect(typeof h.timestamp).toBe('string');
    expect(typeof h.uptime).toBe('number');
    expect(new Date(h.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('getReadiness returns ok when no errors', () => {
    const r = getReadiness({ db: 'ok', ai: 'ok' });
    expect(r.status).toBe('ok');
    expect(r.checks).toEqual({ db: 'ok', ai: 'ok' });
  });

  it('getReadiness returns error when any check fails', () => {
    const r = getReadiness({ db: 'error' });
    expect(r.status).toBe('error');
  });
});
