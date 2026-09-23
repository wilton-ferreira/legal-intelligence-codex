export function confidentialText(v: unknown) {
  if (typeof v !== 'string') return false;
  const named: Record<string, string> = { amp: '&', nbsp: ' ', ccedil: 'ç', Ccedil: 'Ç', atilde: 'ã', Atilde: 'Ã', aacute: 'á', Aacute: 'Á', iacute: 'í', Iacute: 'Í', oacute: 'ó', Oacute: 'Ó', eacute: 'é', Eacute: 'É', uacute: 'ú', Uacute: 'Ú' };
  let decoded = v;
  // Two passes also cover escaped HTML (&amp;ccedil;).
  for (let i = 0; i < 2; i++) decoded = decoded.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, entity: string) => {
    if (!entity.startsWith('#')) return named[entity] ?? whole;
    const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
  });
  // Consider both inline markup within a word and block markup between words.
  return ['', ' '].some(separator => {
    const normalized = decoded.replace(/<[^>]*>/g, separator).normalize('NFD').replace(/[\p{M}\p{Cf}]/gu, '').toLowerCase();
    return /\bsigilo(?:so|sa|sos|sas)?\b|\bsegredo\s+(?:de\s+)?justica\b/.test(normalized);
  });
}
