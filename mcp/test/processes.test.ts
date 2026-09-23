import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { queryCase, searchPublications } from '../src/adapters/processes.js';
import type { SafeHttp } from '../src/http.js';
import { SourceError } from '../src/domain.js';

const processo = '00000000020268010001';
function fake(payload: unknown) {
  const calls: Array<{ url: string; options: any }> = [];
  const bytes = Buffer.from(JSON.stringify(payload));
  const http = { async get(url: string, options: any) {
    calls.push({ url, options });
    return { url, bytes, contentType: 'application/json', retrievedAt: '2026-09-23T12:00:00.000Z', lastModified: null };
  } } as unknown as SafeHttp;
  return { http, calls, bytes };
}
const sourceCase = (extra: Record<string, unknown> = {}) => ({ numeroProcesso: processo, tribunal: 'TJAC', nivelSigilo: 0,
  grau: 'G1', dataAjuizamento: '2026-01-01T00:00:00', dataHoraUltimaAtualizacao: '2026-09-01T00:00:00',
  classe: { codigo: 7, nome: 'Procedimento Comum' }, assuntos: [{ codigo: 8, nome: 'Assunto' }],
  movimentos: [{ codigo: 26, nome: 'Distribuição', dataHora: '2026-01-01T00:00:00', partes: ['PESSOA-SECRETA'], complementosTabelados: [{ nome: 'PESSOA-SECRETA' }] }],
  partes: ['PESSOA-SECRETA'], ...extra });
const cases = (sources: unknown[] = [sourceCase()], total = sources.length) => ({ hits: { total: { value: total, relation: 'eq' }, hits: sources.map(_source => ({ _source })) } });
const publication = (extra: Record<string, unknown> = {}) => ({ id: 1, numero_processo: processo, siglaTribunal: 'TJAC', data_disponibilizacao: '2026-09-20', ativo: true,
  texto: '<p>Texto PESSOA-SECRETA</p>', destinatarios: [{ nome: 'PESSOA-SECRETA' }], destinatarioadvogados: [{ nome: 'PESSOA-SECRETA' }],
  hash: 'Ab123cZ', link: 'https://pje.tjac.jus.br/documento/1', tipoComunicacao: 'Intimação', ...extra });
const publications = (items: unknown[] = [publication()], count = items.length) => ({ status: 'success', count, items });
const error = (code: string) => (e: unknown) => e instanceof SourceError && e.code === code;

test('DataJud validates credentials and arguments before any request', async () => {
  const f = fake(cases());
  await assert.rejects(queryCase(f.http, { tribunal: 'tjac', processo }), error('CREDENTIAL_REQUIRED'));
  for (const tribunal of ['stf', 'tre-df', 'tresP', '../tjac', 'https://arbitrary.test', 'trf7'])
    await assert.rejects(queryCase(f.http, { tribunal, processo }, 'test-key'), error('INVALID_INPUT'));
  await assert.rejects(queryCase(f.http, { tribunal: 'tjac', processo: '123' }, 'test-key'), error('INVALID_INPUT'));
  await assert.rejects(queryCase(f.http, { tribunal: 'tjac', processo }, 'secret\r\nother'), error('INVALID_INPUT'));
  await assert.rejects(queryCase(f.http, { tribunal: 'tjac', processo, movimentos: 'true' as any }, 'test-key'), error('INVALID_INPUT'));
  assert.equal(f.calls.length, 0);
});

test('DataJud uses official TRE aliases, exact process request and minimal source fields', async () => {
  const f = fake(cases([]));
  for (const tribunal of ['TRE-SP', 'TRE-DFT']) await queryCase(f.http, { tribunal, processo }, 'test-key');
  assert.equal(new URL(f.calls[0].url).pathname, '/api_publica_tre-sp/_search');
  assert.equal(new URL(f.calls[1].url).pathname, '/api_publica_tre-dft/_search');
  const request = JSON.parse(f.calls[0].options.body);
  assert.equal(request.query.match.numeroProcesso, processo);
  assert.equal(request.size, 20);
  assert(!request._source.includes('movimentos'));
  assert(!request._source.includes('partes'));
  assert.equal(f.calls[0].options.headers.Authorization, 'APIKey test-key');
});

test('DataJud separates movements, dates and provenance without exposing parties', async () => {
  const f = fake(cases());
  const value: any = await queryCase(f.http, { tribunal: 'tjac', processo, movimentos: true }, 'test-key');
  assert.equal(value.items[0].movimentos.length, 1);
  assert.equal(value.items[0].movimentos[0].codigo, 26);
  assert.equal(value.items[0].dataAjuizamento, '2026-01-01T00:00:00');
  assert.equal(value.source.contentSha256, createHash('sha256').update(f.bytes).digest('hex'));
  assert.equal(value.verification.fullTextConfirmed, false);
  assert(!JSON.stringify(value).includes('PESSOA-SECRETA'));
  assert(!JSON.stringify(value).includes('test-key'));
  const noMoves: any = await queryCase(f.http, { tribunal: 'tjac', processo }, 'test-key');
  assert.equal(noMoves.items[0].movimentos, null);
  assert.equal(noMoves.items[0].movimentosSolicitados, false);
});

test('DataJud excludes restricted and undeclared visibility and marks partial coverage', async () => {
  const f = fake(cases([sourceCase({ nivelSigilo: 1 }), sourceCase({ nivelSigilo: undefined }), sourceCase({ nivelSigilo: '0' })]));
  const value: any = await queryCase(f.http, { tribunal: 'tjac', processo }, 'test-key');
  assert.equal(value.items.length, 0);
  assert.equal(value.claimOfAbsence, false);
  assert.equal(value.coverage.excludedRestricted, 1);
  assert.equal(value.coverage.excludedUnknownConfidentiality, 2);
  assert.equal(value.coverage.partial, true);
});

test('DataJud rejects changed schemas and incomplete upstream results', async () => {
  for (const payload of [{}, { hits: { hits: [] } }, cases([sourceCase({ numeroProcesso: 'different' })]), cases([sourceCase({ movimentos: {} })])]) {
    await assert.rejects(queryCase(fake(payload).http, { tribunal: 'tjac', processo, movimentos: true }, 'key'), error('SCHEMA_CHANGED'));
  }
  await assert.rejects(queryCase(fake({ ...cases(), timed_out: true }).http, { tribunal: 'tjac', processo }, 'key'), error('INCOMPLETE_SOURCE_RESPONSE'));
  await assert.rejects(queryCase(fake({ ...cases(), _shards: { failed: 1 } }).http, { tribunal: 'tjac', processo }, 'key'), error('INCOMPLETE_SOURCE_RESPONSE'));
  await assert.rejects(queryCase(fake({ error: { reason: 'sensitive error' } }).http, { tribunal: 'tjac', processo }, 'key'), error('SOURCE_ERROR'));
});

test('DataJud makes truncation and no-match explicit', async () => {
  const partial: any = await queryCase(fake(cases([sourceCase()], 25)).http, { tribunal: 'tjac', processo }, 'key');
  assert.equal(partial.coverage.partial, true);
  const empty: any = await queryCase(fake(cases([])).http, { tribunal: 'tjac', processo }, 'key');
  assert.equal(empty.status, 'NO_MATCH_IN_QUERIED_SOURCE');
  assert.equal(empty.claimOfAbsence, false);
  const payload = cases(); payload.hits.total.relation = 'gte';
  const lowerBound: any = await queryCase(fake(payload).http, { tribunal: 'tjac', processo }, 'key');
  assert.equal(lowerBound.coverage.partial, true);
});

test('DJEN uses one bounded GET and reports publication metadata only', async () => {
  const f = fake(publications());
  const value: any = await searchPublications(f.http, { processo, tribunal: 'tjac', inicio: '2026-09-01', fim: '2026-09-23' });
  assert.equal(f.calls.length, 1);
  const u = new URL(f.calls[0].url);
  assert.equal(u.searchParams.get('numeroProcesso'), processo);
  assert.equal(u.searchParams.get('itensPorPagina'), '5');
  assert.equal(u.searchParams.get('siglaTribunal'), 'TJAC');
  assert.equal(u.searchParams.get('dataDisponibilizacaoInicio'), '2026-09-01');
  assert.equal(f.calls[0].options.method, undefined);
  assert(!JSON.stringify(value).includes('PESSOA-SECRETA'));
  assert.equal(value.items[0].certificateUrl, 'https://comunicaapi.pje.jus.br/api/v1/comunicacao/Ab123cZ/certidao');
  assert.equal(value.items[0].certificateHash, 'Ab123cZ');
  assert.equal(value.source.contentSha256, createHash('sha256').update(f.bytes).digest('hex'));
  assert.equal(value.items[0].verification.fullTextConfirmed, false);
});

test('DJEN rejects invalid pagination, dates and process numbers without requests', async () => {
  const f = fake(publications());
  for (const extra of [{ pagina: 0 }, { pagina: null }, { itens: null }, { pagina: 1.5 }, { pagina: 2001 }, { pagina: 101, itens: 100 }, { itens: 10 }, { itens: '5' },
    { inicio: '2026-02-30' }, { inicio: '2026-2-01' }, { inicio: '2026-09-22', fim: '2026-09-01' }, { processo: 123 }, { tribunal: '../evil' }])
    await assert.rejects(searchPublications(f.http, { processo, ...extra } as any), error('INVALID_INPUT'));
  assert.equal(f.calls.length, 0);
});

test('DJEN conservatively excludes confidentiality markers including HTML entities and accents', async () => {
  const texts = ['<b>Segredo de Justiça</b>', 'segredo&nbsp;de&nbsp;justi&ccedil;a', 'segredo de justi&#231;a', 'segredo de justi&#xE7;a',
    'SEGREDO DE JUSTIÇA', 'segredo de justi&amp;ccedil;a', '<span>sigiloso</span>', 'sigi<b>lo</b>', 'SÍGILO',
    '<p>Segredo</p><p>de Justiça</p>', 'segredo<br>de<br>justiça', 'sigi\u200blo'];
  const f = fake(publications(texts.map(texto => publication({ texto })), texts.length));
  const value: any = await searchPublications(f.http, { processo, itens: 100 });
  assert.equal(value.coverage.excludedRestricted, texts.length);
  assert.equal(value.items.length, 0);
  assert.equal(value.claimOfAbsence, false);
  assert.equal(value.coverage.partial, true);
  const flags: any = await searchPublications(fake(publications([publication({ sigilo: true }), publication({ nivelSigilo: 1 })])).http, { processo });
  assert.equal(flags.coverage.excludedRestricted, 2);
});

test('DJEN recognizes page incompleteness, caps and requested page scope', async () => {
  const value: any = await searchPublications(fake(publications([publication()], 12)).http, { processo });
  assert.equal(value.coverage.incompletePage, true);
  assert.equal(value.coverage.hasMoreWithinCap, true);
  const capped: any = await searchPublications(fake(publications([], 10000)).http, { processo, pagina: 2 });
  assert.equal(capped.coverage.countMayBeCapped, true);
  assert.equal(capped.coverage.partial, true);
  assert.equal(capped.claimOfAbsence, false);
  const last: any = await searchPublications(fake(publications([publication()], 6)).http, { processo, pagina: 2 });
  assert.equal(last.coverage.incompletePage, false);
  assert.equal(last.coverage.hasMoreWithinCap, false);
  assert.equal(last.coverage.partial, true);
});

test('DJEN rejects business errors, changed schema and mismatched process', async () => {
  await assert.rejects(searchPublications(fake({ status: 'error', message: 'PESSOA-SECRETA' }).http, { processo }), error('SOURCE_ERROR'));
  for (const payload of [{}, [], { status: 'success', items: [] }, publications([publication({ numero_processo: 'different' })]),
    publications([publication({ texto: undefined })]), publications([publication({ ativo: undefined })]), publications([publication()], -1)])
    await assert.rejects(searchPublications(fake(payload).http, { processo }), error('SCHEMA_CHANGED'));
  await assert.rejects(searchPublications(fake(publications()).http, { processo, tribunal: 'TJSP' }), error('SCHEMA_CHANGED'));
});

test('DJEN exposes only judicial HTTPS links and validated certificate identifiers', async () => {
  for (const link of ['https://evil.test/x', 'javascript:alert(1)', 'https://user:secret@www.tjac.jus.br/', 'https://www.tjac.jus.br:444/x']) {
    const value: any = await searchPublications(fake(publications([publication({ link, hash: '../unsafe' })])).http, { processo });
    assert.equal(value.items[0].link, null);
    assert.equal(value.items[0].certificateUrl, null);
  }
});

test('adapters propagate HTTP failure without retry', async () => {
  let count = 0;
  const http = { get: async () => { count++; throw new SourceError('RATE_LIMITED', 'limite', 60); } } as unknown as SafeHttp;
  await assert.rejects(searchPublications(http, { processo }), error('RATE_LIMITED'));
  assert.equal(count, 1);
  await assert.rejects(queryCase(http, { tribunal: 'tjac', processo }, 'key'), error('RATE_LIMITED'));
  assert.equal(count, 2);
});
