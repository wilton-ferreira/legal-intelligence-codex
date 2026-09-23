import test from 'node:test';
import assert from 'node:assert/strict';
import { searchDatasets, searchJurisprudence } from '../src/adapters/catalogs.js';
import { SafeHttp } from '../src/http.js';
function fixture(body: unknown, status = 200) {
  const requests: URL[] = [];
  const http = new SafeHttp(async u => { requests.push(u); return { status, headers: { 'content-type': 'application/json' }, bytes: Buffer.from(JSON.stringify(body)) }; }, async () => [{ address: '1.1.1.1', family: 4 }], 0);
  return { http, requests };
}
const dataset = { id: 'id-1', name: 'precedentes', title: 'Precedentes qualificados', metadata_modified: '2026-01-01', license_id: 'other', resources: [{ id: 'resource-1', url: 'https://dadosabertos.web.stj.jus.br/dataset/resource.json', format: 'JSON' }] };

test('STJ jurisprudence query explicitly discovers datasets and preserves unverified provenance', async () => {
  const f = fixture({ success: true, result: { count: 3, results: [dataset] } });
  const r: any = await searchJurisprudence(f.http, { fonte: 'stj', consulta: 'precedentes', pagina: 2, limite: 1 });
  assert.equal(f.requests[0].hostname, 'dadosabertos.web.stj.jus.br');
  assert.equal(f.requests[0].pathname, '/api/3/action/package_search');
  assert.equal(f.requests[0].searchParams.get('start'), '1');
  assert.equal(r.items[0].kind, 'dataset');
  assert.equal(r.coverage.decisionsSearched, false);
  assert.equal(r.coverage.confirmationPortal, 'https://scon.stj.jus.br/SCON/');
  assert.equal(r.items[0].sourceUpdatedAt, '2026-01-01');
  assert.equal(r.items[0].license.verified, false);
  assert.equal(r.verification.precedentStatusChecked, false);
  assert.equal(r.items[0].resources[0].downloaded, false);
  assert.equal(r.items[0].resources[0].contentSha256, null);
  assert.match(r.source.contentSha256, /^[a-f0-9]{64}$/);
  assert.equal(r.coverage.nextPage, 3);
});

test('TSE queries its own catalog and does not claim absence of case law on zero matches', async () => {
  const f = fixture({ success: true, result: { count: 0, results: [] } });
  const r: any = await searchDatasets(f.http, { fonte: 'tse', consulta: 'processual' });
  assert.equal(f.requests[0].hostname, 'dadosabertos.tse.jus.br');
  assert.equal(r.status, 'NO_MATCH_IN_QUERIED_SOURCE');
  assert.equal(r.claimOfAbsence, false);
  assert.equal(r.coverage.decisionsSearched, false);
});

test('Catalog URLs are never downloaded, unsafe links suppressed and resource output bounded', async () => {
  const f = fixture({ success: true, result: { count: 1, results: [{ ...dataset, name: '../unsafe', resources: Array.from({ length: 60 }, () => ({ url: 'file:///etc/passwd' })) }] } });
  const r: any = await searchDatasets(f.http, { fonte: 'stj', consulta: 'dados' });
  assert.equal(f.requests.length, 1);
  assert.equal(r.items[0].resources.length, 50);
  assert.equal(r.items[0].resources[0].url, null);
  assert.equal(r.items[0].resourceCountReported, 60);
  assert.equal(r.items[0].resourcesTruncated, true);
  assert.match(r.items[0].catalogUrl, /\.\.%2Funsafe$/);
});

test('CKAN errors and broken contracts do not turn into empty successful searches', async () => {
  await assert.rejects(searchDatasets(fixture({ success: false, error: { message: 'error' } }).http, { fonte: 'stj', consulta: 'x' }), { code: 'SOURCE_QUERY_ERROR' });
  for (const body of [{}, { success: true, result: { count: '0', results: [] } }, { success: true, result: { count: 2, results: [] } }, { success: true, result: { count: 1, results: [null] } }, { success: true, result: { count: 1, results: [{ ...dataset, resources: [null] }] } }])
    await assert.rejects(searchDatasets(fixture(body).http, { fonte: 'stj', consulta: 'x' }), { code: 'SCHEMA_CHANGED' });
  await assert.rejects(searchDatasets(fixture({}, 429).http, { fonte: 'tse', consulta: 'x' }), { code: 'RATE_LIMITED' });
});

test('Direct adapter calls validate source, query and paging before accessing network', async () => {
  const f = fixture({});
  for (const input of [{ fonte: 'other', consulta: 'x' }, { fonte: 'stj', consulta: '' }, { fonte: 'stj', consulta: 'x', pagina: Infinity }, { fonte: 'tse', consulta: 'x', limite: 51 }])
    await assert.rejects(searchDatasets(f.http, input as any), { code: 'INVALID_INPUT' });
  await assert.rejects(searchJurisprudence(f.http, { fonte: 'other', consulta: 'x' } as any), { code: 'INVALID_INPUT' });
  assert.equal(f.requests.length, 0);
});
