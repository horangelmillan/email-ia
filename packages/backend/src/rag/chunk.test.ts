import { describe, expect, it } from 'vitest';
import { chunkText, stripSignatures } from './chunk.js';

describe('stripSignatures', () => {
  it('returns empty for empty body', () => {
    expect(stripSignatures('')).toBe('');
  });

  it('trims body without signature', () => {
    expect(stripSignatures('  hello world  ')).toBe('hello world');
  });

  it('cuts at \\n--\\n', () => {
    expect(stripSignatures('hi\n--\nsig')).toBe('hi');
  });

  it('cuts at Enviado desde', () => {
    expect(stripSignatures('body text\nEnviado desde mi iPhone\nsignature')).toBe('body text');
  });

  it('cuts at ____', () => {
    expect(stripSignatures('hello\n____\nfooter')).toBe('hello');
  });

  it('cuts at quoted >', () => {
    expect(stripSignatures('hello\n> quoted line\nmore')).toBe('hello');
  });

  it('cuts at Sent from my', () => {
    expect(stripSignatures('hi there\nSent from my iPhone\nsig')).toBe('hi there');
  });

  it('cuts at Sent from variant', () => {
    expect(stripSignatures('hi\nSent from my Android\nsig')).toBe('hi');
  });

  it('picks earliest delimiter', () => {
    expect(stripSignatures('a\n--\nb\nEnviado desde c')).toBe('a');
  });

  it('handles CRLF normalization', () => {
    expect(stripSignatures('hi\r\n--\r\nsig')).toBe('hi');
  });

  it('returns trimmed result', () => {
    expect(stripSignatures('  hi  \n--\n sig ')).toBe('hi');
  });

  it('case-insensitive Enviado', () => {
    expect(stripSignatures('body\nENVIADO DESDE mi móvil')).toBe('body');
  });

  it('handles Enviado desde without extra text', () => {
    expect(stripSignatures('content\nEnviado desde')).toBe('content');
  });
});

describe('chunkText', () => {
  it('chunks with overlap', () => {
    // size 4 overlap 2 step 2 on 10 chars -> 5 slices including trailing 'ij'
    expect(chunkText('abcdefghij', { size: 4, overlap: 2 })).toEqual([
      'abcd',
      'cdef',
      'efgh',
      'ghij',
      'ij',
    ]);
  });

  it('handles overlap >= size → overlap=size-1', () => {
    const res = chunkText('abcde', { size: 3, overlap: 5 });
    // overlap clamped to 2, step 1
    expect(res[0]).toBe('abc');
    expect(res[1]).toBe('bcd');
    expect(res[2]).toBe('cde');
    expect(res.length).toBeGreaterThan(1);
  });

  it('handles overlap equal size', () => {
    const res = chunkText('abcdef', { size: 2, overlap: 2 });
    expect(res).toEqual(['ab', 'bc', 'cd', 'de', 'ef', 'f']);
  });

  it('size <=0 returns [text] if text else []', () => {
    expect(chunkText('hello', { size: 0, overlap: 0 })).toEqual(['hello']);
    expect(chunkText('', { size: 0, overlap: 0 })).toEqual([]);
    expect(chunkText('hi', { size: -1, overlap: 0 })).toEqual(['hi']);
  });

  it('returns [] for empty text', () => {
    expect(chunkText('', { size: 10, overlap: 2 })).toEqual([]);
  });

  it('single chunk when text shorter than size', () => {
    expect(chunkText('hi', { size: 10, overlap: 2 })).toEqual(['hi']);
  });

  it('no overlap', () => {
    expect(chunkText('abcdefgh', { size: 4, overlap: 0 })).toEqual(['abcd', 'efgh']);
  });

  it('negative overlap treated as 0', () => {
    expect(chunkText('abcdefgh', { size: 4, overlap: -5 })).toEqual(['abcd', 'efgh']);
  });

  it('filters empty chunks', () => {
    const res = chunkText('ab', { size: 2, overlap: 0 });
    expect(res).toEqual(['ab']);
    expect(res.every(Boolean)).toBe(true);
  });
});
