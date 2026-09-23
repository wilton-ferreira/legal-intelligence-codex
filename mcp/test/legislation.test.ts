import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { searchLegislation, searchLexml } from '../src/adapters/legislation.js';
import { SafeHttp } from '../src/http.js';

function fixture(body: unknown, contentType = 'application/json') {
  const bytes = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  const requests: URL[] = [];
  const http = new SafeHttp(async u => {
    requests.push(u);
    return { status: 200, headers: { 'content-type': contentType }, bytes };
  }, async () => [{ address: '1.1.1.1', family: 4 }], 0);
  return { http, requests, hash: createHash('sha256').update(bytes).digest('hex') };
}
const xml = (inner: string) => `<?xml version="1.0"?><srw:searchRetrieveResponse xmlns:srw="http://www.loc.gov/zing/srw/">${inner}</srw:searchRetrieveResponse>`;
const record = `<srw:records><srw:record><srw:recordData><srw_dc:dc xmlns:srw_dc="info:srw/schema/1/dc-v1.1" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Lei &amp; exemplo</dc:title><dc:identifier>https://www.planalto.gov.br/exemplo</dc:identifier><dc:identifier>urn:lex:br:federal:lei:2024;1</dc:identifier><dc:date>2024-01-01</dc:date></srw_dc:dc></srw:recordData></srw:record></srw:records>`;

test('Câmara encodes filters, retains provenance and never treats a proposal as current law', async () => {
  const f = fixture({ dados: [{ id: 1, siglaTipo: 'PL', numero: 1, ano: 2024, ementa: 'Texto', dataApresentacao: '2024-01-01', uri: 'https://dadosabertos.camara.leg.br/api/v2/proposicoes/1' }], links: [{ rel: 'next', href: 'https://dadosabertos.camara.leg.br/api/v2/proposicoes?pagina=3' }] });
  const r: any = await searchLegislation(f.http, { fonte: 'camara', consulta: 'proteção de dados', ano: 2024, tipo: 'PL', pagina: 2, limite: 5 });
  assert.equal(f.requests[0].searchParams.get('keywords'), 'proteção de dados');
  assert.equal(f.requests[0].searchParams.get('pagina'), '2');
  assert.equal(f.requests[0].searchParams.get('siglaTipo'), 'PL');
  assert.equal(r.source.contentSha256, f.hash);
  assert.equal(r.items[0].kind, 'legislative-proposal');
  assert.equal(r.verification.currentnessCheckedAt, null);
  assert.equal(r.coverage.nextPage, 3);
});

test('Senado uses processo contract and explicitly slices its unpaginated response', async () => {
  const f = fixture([{ id: 1, identificacao: 'PL 21/2020' }, { id: 2, identificacao: 'PL 22/2020', dataUltimaAtualizacao: '2026-01-01', normaGerada: 'Lei 100' }]);
  const r: any = await searchLegislation(f.http, { fonte: 'senado', ano: 2020, pagina: 2, limite: 1 });
  assert.equal(f.requests[0].pathname, '/dadosabertos/processo');
  assert.equal(f.requests[0].searchParams.has('pagina'), false);
  assert.equal(r.items[0].id, 2);
  assert.equal(r.items[0].sourceUpdatedAt, '2026-01-01');
  assert.equal(r.items[0].verification.currentnessCheckedAt, null);
  assert.equal(r.coverage.pagination, 'local-slice-of-single-source-response');
  assert.equal(r.coverage.nextPage, null);
});

test('Senado refuses unconstrained query instead of silently searching only active proposals', async () => {
  const f = fixture([]);
  await assert.rejects(searchLegislation(f.http, { fonte: 'senado', consulta: 'contratos' }), { code: 'INVALID_INPUT' });
  assert.equal(f.requests.length, 0);
});

test('Legislative validation rejects malformed inputs and upstream shapes', async () => {
  for (const input of [{ fonte: 'other' }, { fonte: 'camara', ano: 2024, pagina: 0 }, { fonte: 'camara', numero: -1 }, { fonte: 'camara', ano: 2024, limite: 51 }, { fonte: 'camara', ano: 2 }]) {
    await assert.rejects(searchLegislation(fixture({}).http, input as any), { code: 'INVALID_INPUT' });
  }
  for (const body of [{}, { dados: [null], links: [] }, { dados: [], links: null }]) {
    await assert.rejects(searchLegislation(fixture(body).http, { fonte: 'camara', ano: 2024 }), { code: 'SCHEMA_CHANGED' });
  }
  await assert.rejects(searchLegislation(fixture({ processos: [] }).http, { fonte: 'senado', ano: 2024 }), { code: 'SCHEMA_CHANGED' });
});

test('LexML reads namespaced Dublin Core, bounds pagination and separates metadata from verification', async () => {
  const f = fixture(xml(`<srw:numberOfRecords>3</srw:numberOfRecords>${record}`), 'application/xml');
  const r: any = await searchLexml(f.http, { consulta: 'lei "dados"', pagina: 2, limite: 1 }, 'legislation');
  assert.equal(f.requests[0].searchParams.get('startRecord'), '2');
  assert.equal(f.requests[0].searchParams.get('query'), '"lei \\"dados\\""');
  assert.equal(r.items[0].titles[0], 'Lei & exemplo');
  assert.equal(r.items[0].identifiers.length, 2);
  assert.deepEqual(r.items[0].urls, ['https://www.planalto.gov.br/exemplo']);
  assert.deepEqual(r.items[0].documentDates, ['2024-01-01']);
  assert.equal(r.source.contentSha256, f.hash);
  assert.equal(r.coverage.domainFilterApplied, false);
  assert.equal(r.items[0].verification.fullTextConfirmed, false);
});

test('LexML distinguishes genuine zero from SRU errors, blocked HTML, unsafe XML and schema drift', async () => {
  const zero: any = await searchLexml(fixture(xml('<srw:numberOfRecords>0</srw:numberOfRecords>')).http, { consulta: 'exemplo' }, 'legislation');
  assert.equal(zero.status, 'NO_MATCH_IN_QUERIED_SOURCE');
  assert.equal(zero.claimOfAbsence, false);
  for (const [body, code] of [
    [xml('<srw:diagnostics><diagnostic>bad query</diagnostic></srw:diagnostics>'), 'SOURCE_QUERY_ERROR'],
    ['<html><head><title>Access Denied</title></head></html>', 'SOURCE_BLOCKED'],
    ['<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><x>&e;</x>', 'UNSAFE_XML'],
    ['<broken>', 'SCHEMA_CHANGED'],
    [xml('<srw:numberOfRecords>1</srw:numberOfRecords>'), 'SCHEMA_CHANGED'],
    [xml('<srw:numberOfRecords>n/a</srw:numberOfRecords>'), 'SCHEMA_CHANGED'],
  ]) await assert.rejects(searchLexml(fixture(body, 'application/xml').http, { consulta: 'exemplo' }, 'legislation'), { code });
});
