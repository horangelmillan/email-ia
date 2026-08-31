export function stripSignatures(body: string): string {
  if (!body) return '';
  const normalized = body.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  const delimiters = [
    '\n--\n',
    '\n-- \n',
    '\nEnviado desde',
    '\n____',
    '\n> ',
    '\n>',
    '\nSent from my',
    '\nSent from',
  ];
  const lower = normalized.toLowerCase();
  let cut = normalized.length;
  for (const d of delimiters) {
    const idx = lower.indexOf(d.toLowerCase());
    if (idx !== -1 && idx < cut) cut = idx;
  }
  return normalized.slice(0, cut).trim();
}

export function chunkText(text: string, opts: { size: number; overlap: number }): string[] {
  if (text.length === 0) return [];
  const size = opts.size;
  let overlap = opts.overlap;
  if (size <= 0) return text ? [text] : [];
  if (overlap < 0) overlap = 0;
  if (overlap >= size) overlap = size - 1;
  const step = size - overlap;
  const result: string[] = [];
  for (let i = 0; i < text.length; i += step) {
    const chunk = text.slice(i, i + size);
    if (chunk) result.push(chunk);
  }
  return result;
}
