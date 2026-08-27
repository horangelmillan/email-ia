import { describe, expect, it } from 'vitest';
import { Writable } from 'node:stream';
import { createLogger } from './logger.js';

function captureStream() {
  let buf = '';
  const stream = new Writable({
    write(chunk, _enc, cb) {
      buf += chunk.toString();
      cb();
    },
  });
  return { stream: stream as unknown as import('pino').DestinationStream, get: () => buf };
}

describe('createLogger', () => {
  it('creates logger with given level', () => {
    const { stream } = captureStream();
    const logger = createLogger({ level: 'info' }, stream);
    expect(logger.level).toBe('info');
  });

  it('writes structured json with msg', () => {
    const { stream, get } = captureStream();
    const logger = createLogger({ level: 'debug' }, stream);
    logger.info({ foo: 'bar' }, 'hello');
    const line = get().trim();
    const json = JSON.parse(line);
    expect(json.msg).toBe('hello');
    expect(json.foo).toBe('bar');
    expect(json.level).toBe(30);
  });

  it('respects silent when disabled', () => {
    const { stream, get } = captureStream();
    const logger = createLogger({ level: 'info', enabled: false }, stream);
    logger.info('should not appear');
    expect(get()).toBe('');
  });

  it('filters below level', () => {
    const { stream, get } = captureStream();
    const logger = createLogger({ level: 'error' }, stream);
    logger.info('filtered');
    expect(get()).toBe('');
    logger.error('visible');
    expect(get()).toContain('visible');
  });
});
