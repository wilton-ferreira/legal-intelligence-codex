import assert from 'node:assert/strict';
import test from 'node:test';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { SafeHttp, validateUrl, isPublicAddress, rawTransport } from '../src/http.js';
import { SourceError } from '../src/domain.js';

const url = 'https://www.stj.jus.br/documento';
const address = { address: '8.8.8.8', family: 4 };
const resolver = async () => [address];
const error = (code: string) => (e: unknown) => e instanceof SourceError && e.code === code;
const wire = (status = 200, headers: Record<string, string> = {}, body = '{}') => ({ status, headers, bytes: Buffer.from(body) });

test('HTTP allows only exact approved HTTPS hosts with no credentials or alternate ports', () => {
  assert.equal(validateUrl(`${url}#section`).href, url);
  assert.equal(validateUrl('https://www.stj.jus.br:443/').href, 'https://www.stj.jus.br/');
  for (const input of ['http://www.stj.jus.br/', 'file:///tmp/a', 'https://unlisted.jus.br/', 'https://www.stj.jus.br.evil.test/',
    'https://evil-www.stj.jus.br/', 'https://www.stj.jus.br@evil.test/', 'https://user:pass@www.stj.jus.br/',
    'https://www.stj.jus.br:444/', 'https://127.0.0.1/', 'https://[::1]/', 'invalid'])
    assert.throws(() => validateUrl(input), error('URL_DENIED'));
});

test('HTTP rejects private, reserved, loopback and mapped private IP addresses', () => {
  for (const ip of ['127.0.0.1', '10.2.3.4', '192.168.1.1', '172.16.0.1', '169.254.169.254', '0.0.0.0', '100.64.0.1',
    '224.0.0.1', '192.0.2.1', '::1', '::', 'fc00::1', 'fe80::1', 'ff02::1', '2001:db8::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', 'not-an-ip'])
    assert.equal(isPublicAddress(ip), false, ip);
  for (const ip of ['8.8.8.8', '2606:4700:4700::1111', '::ffff:8.8.8.8']) assert.equal(isPublicAddress(ip), true, ip);
});

test('HTTP validates all resolved addresses before transport and pins the checked address', async () => {
  let calls = 0;
  for (const addresses of [[], [{ address: '127.0.0.1', family: 4 }], [address, { address: '::ffff:10.0.0.1', family: 6 }]]) {
    const http = new SafeHttp(async () => { calls++; return wire(); }, async () => addresses, 0);
    await assert.rejects(http.get(url), error('ADDRESS_DENIED'));
  }
  assert.equal(calls, 0);
  const http = new SafeHttp(async (u, opts) => {
    assert.equal(u.hostname, 'www.stj.jus.br');
    assert.deepEqual(opts.address, address);
    assert.equal(opts.headers['accept-encoding'], 'identity');
    assert.equal(opts.maxBytes, 12345);
    assert.equal(opts.timeout, 20000);
    return wire(200, { 'content-type': 'application/json', 'last-modified': 'Wed, 23 Sep 2026 10:00:00 GMT' });
  }, async host => { assert.equal(host, 'www.stj.jus.br'); return [address]; }, 0);
  const retrieved = await http.get(url, { maxBytes: 12345 });
  assert.equal(retrieved.url, url);
  assert.equal(retrieved.contentType, 'application/json');
  assert.equal(retrieved.lastModified, 'Wed, 23 Sep 2026 10:00:00 GMT');
  assert(Number.isFinite(Date.parse(retrieved.retrievedAt)));
});

test('HTTP revalidates each redirect host and DNS result', async () => {
  for (const location of ['https://evil.test/a', 'http://www.stj.jus.br/a', 'https://127.0.0.1/a']) {
    let calls = 0;
    const http = new SafeHttp(async () => { calls++; return wire(302, { location }); }, resolver, 0);
    await assert.rejects(http.get(url), error('URL_DENIED'));
    assert.equal(calls, 1);
  }
  let calls = 0;
  const hosts: string[] = [];
  const http = new SafeHttp(async () => { calls++; return wire(302, { location: 'https://www.cnj.jus.br/final' }); }, async host => {
    hosts.push(host); return host === 'www.stj.jus.br' ? [address] : [{ address: '10.0.0.1', family: 4 }];
  }, 0);
  await assert.rejects(http.get(url), error('ADDRESS_DENIED'));
  assert.equal(calls, 1);
  assert.deepEqual(hosts, ['www.stj.jus.br', 'www.cnj.jus.br']);
});

test('HTTP rejects credential forwarding on redirect regardless of header capitalization', async () => {
  for (const name of ['Authorization', 'authorization', 'AUTHORIZATION', 'Cookie', 'cookie', 'Proxy-Authorization', 'X-Api-Key']) {
    let calls = 0;
    const http = new SafeHttp(async () => { calls++; return calls === 1 ? wire(302, { location: 'https://www.cnj.jus.br/final' }) : wire(); }, resolver, 0);
    await assert.rejects(http.get(url, { headers: { [name]: 'Bearer synthetic-secret' } }), error('REDIRECT_DENIED'));
    assert.equal(calls, 1, 'Credentials must never reach the redirected transport');
  }
});

test('HTTP rejects redirected POST, absent redirect destinations and redirect loops', async () => {
  const post = new SafeHttp(async () => wire(307, { location: '/other' }), resolver, 0);
  await assert.rejects(post.get(url, { method: 'POST', body: 'sensitive-data' }), error('REDIRECT_DENIED'));
  await assert.rejects(new SafeHttp(async () => wire(302), resolver, 0).get(url), error('REDIRECT_DENIED'));
  let calls = 0;
  const loop = new SafeHttp(async () => { calls++; return wire(302, { location: '/again' }); }, resolver, 0);
  await assert.rejects(loop.get(url), error('REDIRECT_LIMIT'));
  assert.equal(calls, 4);
});

test('HTTP follows a bounded relative redirect and returns final provenance URL', async () => {
  let calls = 0;
  const http = new SafeHttp(async () => ++calls === 1 ? wire(302, { location: '/final#anchor' }) : wire(), resolver, 0);
  const value = await http.get(url);
  assert.equal(value.url, 'https://www.stj.jus.br/final');
  assert.equal(calls, 2);
});

test('HTTP enforces rate-limit cooldown after 429 without retry', async () => {
  for (const retry of ['120', '0', 'not-a-date', new Date(Date.now() + 180000).toUTCString()]) {
    let calls = 0;
    const http = new SafeHttp(async () => { calls++; return wire(429, { 'retry-after': retry }); }, resolver, 0);
    await assert.rejects(http.get(url), (e: unknown) => e instanceof SourceError && e.code === 'RATE_LIMITED' && (e.retryAfterSeconds ?? 0) >= 60);
    await assert.rejects(http.get(url), error('RATE_LIMITED'));
    assert.equal(calls, 1);
  }
});

test('HTTP rejects concurrent same-host calls and enforces ordinary cooldown', async () => {
  let resolveWire!: (value: ReturnType<typeof wire>) => void;
  const pending = new Promise<ReturnType<typeof wire>>(resolve => { resolveWire = resolve; });
  const http = new SafeHttp(async () => pending, resolver, 60000);
  const first = http.get(url);
  await assert.rejects(http.get(url), error('SOURCE_BUSY'));
  resolveWire(wire());
  await first;
  await assert.rejects(http.get(url), error('RATE_LIMITED'));
});

test('HTTP sanitizes unexpected network errors and preserves structured failures', async () => {
  const http = new SafeHttp(async () => { throw new Error('synthetic-secret'); }, resolver, 0);
  await assert.rejects(http.get(url), (e: unknown) => e instanceof SourceError && e.code === 'NETWORK_ERROR' && !e.message.includes('synthetic-secret'));
  const expected = new SourceError('RESPONSE_TOO_LARGE', 'limit');
  await assert.rejects(new SafeHttp(async () => { throw expected; }, resolver, 0).get(url), e => e === expected);
  await assert.rejects(new SafeHttp(async () => wire(403, {}, 'sensitive upstream body'), resolver, 0).get(url), error('HTTP_403'));
});

test('HTTP refuses challenge responses and unsupported transfer encodings', async () => {
  for (const body of ['<html>captcha</html>', '<title>Access Denied</title>', 'Verificação de segurança', '<div class="cf-chl-"></div>'])
    await assert.rejects(new SafeHttp(async () => wire(200, { 'content-type': 'text/html' }, body), resolver, 0).get(url), error('SOURCE_BLOCKED'));
  await assert.rejects(new SafeHttp(async () => wire(200, { 'content-encoding': 'gzip' }), resolver, 0).get(url), error('ENCODING_UNSUPPORTED'));
});

test('raw transport pins DNS and enforces advertised and streamed byte limits without network', async t => {
  type Scenario = { headers: Record<string, string>; chunks: Buffer[]; stall?: boolean };
  let scenario: Scenario = { headers: {}, chunks: [Buffer.from('ok')] };
  let requestOptions: any;
  let requestUrl: URL | undefined;
  t.mock.method(https, 'request', (u: URL, options: unknown, callback: (response: any) => void) => {
    requestOptions = options; requestUrl = u;
    const req: any = new EventEmitter();
    req.destroy = (err?: Error) => { if (err) req.emit('error', err); req.emit('close'); };
    req.end = () => queueMicrotask(() => {
      if (scenario.stall) return;
      const res: any = new EventEmitter();
      let destroyed = false;
      res.statusCode = 200; res.headers = scenario.headers;
      res.destroy = (err?: Error) => { destroyed = true; if (err) res.emit('error', err); };
      callback(res);
      for (const chunk of scenario.chunks) { if (destroyed) break; res.emit('data', chunk); }
      if (!destroyed) res.emit('end');
      req.emit('close');
    });
    return req;
  });
  const options = { method: 'GET', headers: {}, address, maxBytes: 5, timeout: 1000 };
  const response = await rawTransport(new URL(url), options);
  assert.equal(response.bytes.toString(), 'ok');
  assert.equal(requestUrl?.hostname, 'www.stj.jus.br');
  requestOptions.lookup('www.stj.jus.br', {}, (err: unknown, ip: string, family: number) => {
    assert.equal(err, null); assert.equal(ip, address.address); assert.equal(family, address.family);
  });
  requestOptions.lookup('www.stj.jus.br', { all: true }, (err: unknown, entries: unknown[]) => {
    assert.equal(err, null); assert.deepEqual(entries, [address]);
  });
  scenario = { headers: { 'content-length': '6' }, chunks: [] };
  await assert.rejects(rawTransport(new URL(url), options), error('RESPONSE_TOO_LARGE'));
  scenario = { headers: {}, chunks: [Buffer.from('123'), Buffer.from('456')] };
  await assert.rejects(rawTransport(new URL(url), options), error('RESPONSE_TOO_LARGE'));
  scenario = { headers: {}, chunks: [Buffer.from('12345')] };
  assert.equal((await rawTransport(new URL(url), options)).bytes.length, 5);
  scenario = { headers: {}, chunks: [], stall: true };
  await assert.rejects(rawTransport(new URL(url), { ...options, timeout: 1 }), error('TIMEOUT'));
});
