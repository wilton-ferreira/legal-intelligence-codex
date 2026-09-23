import { createHash } from 'node:crypto';

export class SourceError extends Error {
  constructor(public code: string, message: string, public retryAfterSeconds?: number) {
    super(message);
  }
}
export type Tier = 'official-primary' | 'official-index' | 'official-publication';
export type Retrieved = { url: string; bytes: Buffer; contentType: string; retrievedAt: string; lastModified: string | null };
export function provenance(authority: string, tier: Tier, r: Retrieved) {
  return { authority, tier, sourceUri: r.url, retrievedAt: r.retrievedAt,
    contentSha256: createHash('sha256').update(r.bytes).digest('hex'),
    hashScope: 'complete-http-response-body', httpLastModified: r.lastModified };
}
export const unverified = () => ({
  state: 'discovered', fullTextConfirmed: false, precedentStatusChecked: false,
  currentnessCheckedAt: null, legalDataCheckedUntil: null,
});
export function result(items: unknown[], source: unknown, coverage: Record<string, unknown> = {}) {
  return { status: items.length ? 'RESULTS' : 'NO_MATCH_IN_QUERIED_SOURCE',
    claimOfAbsence: false, items, source, verification: unverified(), coverage };
}
export function processNumber(value: string) {
  if (!/^(?:\d{20}|\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})$/.test(value))
    throw new SourceError('INVALID_INPUT', 'Use 20 dígitos ou a máscara CNJ.');
  return value.replace(/\D/g, '');
}
export function parseJson(r: Retrieved): any {
  try { return JSON.parse(r.bytes.toString('utf8')); }
  catch { throw new SourceError('SCHEMA_CHANGED', 'A fonte não retornou o JSON esperado; não foi possível consultar.'); }
}
export function asArray<T>(v: T | T[] | undefined): T[] { return v === undefined ? [] : Array.isArray(v) ? v : [v]; }
export function publicLink(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; }
  catch { return null; }
}
