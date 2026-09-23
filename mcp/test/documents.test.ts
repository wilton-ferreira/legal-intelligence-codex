import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { fetchDocument, verificationEvidence } from '../src/documents.js';
import { SafeHttp } from '../src/http.js';
import { SourceError } from '../src/domain.js';

const url = 'https://www.stj.jus.br/documento';
const error = (code: string) => (e: unknown) => e instanceof SourceError && e.code === code;
function fixture(body: string | Buffer, contentType = 'text/plain; charset=utf-8') {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const calls: Array<{ url: string; options: unknown }> = [];
  const http = { async get(input: string, options: unknown) {
    calls.push({ url: input, options });
    return { url: input, bytes, contentType, retrievedAt: '2026-09-23T12:00:00Z', lastModified: 'Wed, 23 Sep 2026 10:00:00 GMT' };
  } } as unknown as SafeHttp;
  return { http, calls, bytes };
}

test('document validates destination and excerpt bounds before request', async () => {
  const f = fixture('documento');
  for (const max of [0, 99, 30001, 100.5, NaN]) await assert.rejects(fetchDocument(f.http, url, max), error('INVALID_INPUT'));
  await assert.rejects(fetchDocument(f.http, 'https://arbitrary.test/'), error('URL_DENIED'));
  assert.equal(f.calls.length, 0);
});

test('document hashes all response bytes while marking truncated excerpts', async () => {
  const f = fixture('a'.repeat(120) + 'fim');
  const result = await fetchDocument(f.http, url, 100);
  assert.deepEqual(f.calls[0].options, { maxBytes: 5_000_000 });
  assert.equal(result.excerpt, 'a'.repeat(100));
  assert.equal(result.bytes, f.bytes.length);
  assert.equal(result.truncated, true);
  assert.equal(result.source.contentSha256, createHash('sha256').update(f.bytes).digest('hex'));
  assert.notEqual(result.source.contentSha256, createHash('sha256').update(result.excerpt!).digest('hex'));
  assert.equal(result.source.hashScope, 'complete-http-response-body');
  assert.equal(result.source.retrievedAt, '2026-09-23T12:00:00Z');
  assert.equal(result.source.httpLastModified, 'Wed, 23 Sep 2026 10:00:00 GMT');
  assert.equal(result.verification.fullTextConfirmed, false);
  assert.equal(result.verification.currentnessCheckedAt, null);
  assert.equal(result.verification.precedentStatusChecked, false);
});

test('document recognizes PDF bytes without claiming extraction or legal verification', async () => {
  const f = fixture('%PDF-1.7\nsynthetic PDF payload', 'application/octet-stream');
  const result = await fetchDocument(f.http, url);
  assert.equal(result.representation, 'pdf-not-extracted');
  assert.equal(result.excerpt, null);
  assert.equal(result.truncated, false);
  assert.equal(result.verification.fullTextConfirmed, false);
  assert.equal(result.verification.legalDataCheckedUntil, null);
  assert.equal(result.verification.currentnessCheckedAt, null);
  assert.equal(result.source.contentSha256, createHash('sha256').update(f.bytes).digest('hex'));
});

test('document rejects unsupported or misdeclared media rather than interpreting binaries', async () => {
  for (const type of ['application/zip', 'application/octet-stream', 'application/pdf', 'image/png', ''])
    await assert.rejects(fetchDocument(fixture('not a PDF or supported text', type).http, url), error('UNSUPPORTED_MEDIA'));
});

test('document decodes declared text charset and strips HTML scripts/styles', async () => {
  const latin = await fetchDocument(fixture(Buffer.from('decis\xe3o', 'latin1'), 'text/plain; charset=iso-8859-1').http, url);
  assert.equal(latin.excerpt, 'decisão');
  const html = await fetchDocument(fixture('<html><style>.hidden{}</style><script>malicious()</script><p>Decisão</p><p>pública</p></html>', 'text/html; charset="UTF-8"').http, url);
  assert.equal(html.excerpt, 'Decisão pública');
  assert.equal(html.truncated, false);
  await assert.rejects(fetchDocument(fixture('text', 'text/plain; charset=unrecognized-charset').http, url), error('ENCODING_UNSUPPORTED'));
});

test('document rejects confidentiality markers throughout body before excerpt truncation', async () => {
  for (const text of ['Segredo de Justiça', 'SIGILO PROCESSUAL', 'a'.repeat(500) + ' segredo de justiça'])
    await assert.rejects(fetchDocument(fixture(text).http, url, 100), error('RESTRICTED_CONTENT'));
});

test('document detects confidentiality markers obscured by HTML entities or inline markup', async () => {
  for (const text of ['segredo&nbsp;de&nbsp;justi&ccedil;a', 'segredo de justi&#231;a', 'segredo de justi&#xE7;a',
    'segredo de justi&amp;ccedil;a', 'sigi<b>lo</b> processual', '<p>segredo</p><p>de justiça</p>'])
    await assert.rejects(fetchDocument(fixture(text, 'text/html').http, url), error('RESTRICTED_CONTENT'));
});

test('document challenge pages fail through SafeHttp and are never returned as excerpts', async () => {
  const http = new SafeHttp(async () => ({ status: 200, headers: { 'content-type': 'text/html' }, bytes: Buffer.from('<title>Access Denied</title>') }),
    async () => [{ address: '8.8.8.8', family: 4 }], 0);
  await assert.rejects(fetchDocument(http, url), error('SOURCE_BLOCKED'));
});

test('verification without a document consults no source and preserves insufficient evidence', async () => {
  const f = fixture('document');
  for (const kind of ['legislation', 'jurisprudence', 'precedent'] as const) {
    const value = await verificationEvidence(f.http, kind);
    assert.equal(value.status, 'INSUFFICIENT_EVIDENCE');
    assert.equal(value.evidence, null);
    assert(value.sourcesToConsult.length > 0);
    assert(value.sourcesToConsult.every(source => source.consulted === false));
    assert.equal(value.verification.fullTextConfirmed, false);
    assert.equal(value.verification.precedentStatusChecked, false);
    assert.equal(value.verification.currentnessCheckedAt, null);
  }
  assert.equal(f.calls.length, 0);
});

test('retrieving one official document never upgrades currentness or precedent verification', async () => {
  const f = fixture('Decisão publicada');
  const value = await verificationEvidence(f.http, 'precedent', url);
  assert.equal(f.calls.length, 1);
  assert.equal(value.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(value.evidence?.status, 'DOCUMENT_RETRIEVED');
  assert.equal(value.verification.state, 'insufficient_evidence');
  assert.equal(value.verification.precedentStatusChecked, false);
  assert.equal(value.verification.currentnessCheckedAt, null);
  assert(value.pending.length > 0);
  assert(value.sourcesToConsult.every(source => source.consulted === false));
});
