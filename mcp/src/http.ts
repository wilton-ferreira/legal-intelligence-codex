import https from 'node:https';
import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { SourceError, type Retrieved } from './domain.js';

// Exact hosts only. A .gov.br/.jus.br suffix alone is not an authorization.
export const HOSTS = new Set([
  'api-publica.datajud.cnj.jus.br', 'comunicaapi.pje.jus.br',
  'dadosabertos.web.stj.jus.br', 'scon.stj.jus.br', 'processo.stj.jus.br', 'www.stj.jus.br',
  'www.lexml.gov.br', 'lexml.gov.br', 'legis.senado.leg.br', 'www12.senado.leg.br',
  'dadosabertos.camara.leg.br', 'www.camara.leg.br', 'www2.camara.leg.br',
  'www.planalto.gov.br', 'www4.planalto.gov.br', 'portal.stf.jus.br', 'jurisprudencia.stf.jus.br',
  'dadosabertos.tse.jus.br', 'www.tse.jus.br', 'jurisprudencia.tse.jus.br',
  'www.tst.jus.br', 'jurisprudencia.tst.jus.br', 'jurisprudencia.cjf.jus.br',
  'www.cjf.jus.br', 'www.cnj.jus.br', 'atos.cnj.jus.br', 'pangeabnp.pdpj.jus.br',
  'sites.tcu.gov.br', 'pesquisa.apps.tcu.gov.br', 'carf.fazenda.gov.br',
  'normas.receita.fazenda.gov.br',
]);
export function validateUrl(input: string): URL {
  let u: URL;
  try { u = new URL(input); } catch { throw new SourceError('URL_DENIED', 'URL inválida.'); }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') || !HOSTS.has(u.hostname))
    throw new SourceError('URL_DENIED', 'Use HTTPS em um host oficial explicitamente permitido, sem credenciais ou porta alternativa.');
  u.hash = ''; return u;
}
export function isPublicAddress(address: string) {
  try { return ipaddr.process(address).range() === 'unicast'; } catch { return false; }
}
type Address = { address: string; family: number };
type Wire = { status: number; headers: Record<string, string>; bytes: Buffer };
type Transport = (u: URL, options: { method: string; headers: Record<string,string>; body?: string; address: Address; maxBytes: number; timeout: number }) => Promise<Wire>;
export const rawTransport: Transport = (u, options) => new Promise((resolve, reject) => {
  const req = https.request(u, {
    method: options.method, headers: options.headers,
    // Pin the checked address. TLS still verifies the original hostname.
    lookup: (_hostname, opts, cb) => {
      if (opts.all) cb(null, [options.address]); else cb(null, options.address.address, options.address.family);
    },
  }, res => {
    const headers: Record<string,string> = {};
    for (const [k,v] of Object.entries(res.headers)) if (v !== undefined) headers[k] = Array.isArray(v) ? v.join(', ') : v;
    if (Number(headers['content-length']) > options.maxBytes) {
      res.destroy(); reject(new SourceError('RESPONSE_TOO_LARGE', 'Resposta excede o limite de bytes.')); return;
    }
    const chunks: Buffer[] = []; let length = 0;
    res.on('data', chunk => {
      length += chunk.length;
      if (length > options.maxBytes) { res.destroy(new SourceError('RESPONSE_TOO_LARGE', 'Resposta excede o limite de bytes.')); return; }
      chunks.push(Buffer.from(chunk));
    });
    res.on('end', () => resolve({ status: res.statusCode ?? 0, headers, bytes: Buffer.concat(chunks) }));
    res.on('error', reject);
  });
  const timer = setTimeout(() => req.destroy(new SourceError('TIMEOUT', 'Tempo limite de consulta atingido.')), options.timeout);
  req.on('close', () => clearTimeout(timer)); req.on('error', reject);
  req.end(options.body);
});
export class SafeHttp {
  private busy = new Set<string>();
  private nextRequest = new Map<string, number>();
  constructor(private transport: Transport = rawTransport,
    private resolve: (host: string) => Promise<Address[]> = host => lookup(host, { all: true }),
    private interval = 1000) {}

  async get(input: string, options: { method?: 'GET'|'POST'; headers?: Record<string,string>; body?: string; maxBytes?: number } = {}): Promise<Retrieved> {
    let u = validateUrl(input);
    for (let hop = 0; hop < 4; hop++) {
      const host = u.hostname;
      if (this.busy.has(host)) throw new SourceError('SOURCE_BUSY', 'Já há consulta a esta fonte; consulte sequencialmente.');
      const wait = (this.nextRequest.get(host) ?? 0) - Date.now();
      if (wait > 0) throw new SourceError('RATE_LIMITED', 'Aguarde antes de consultar novamente esta fonte.', Math.ceil(wait / 1000));
      this.busy.add(host);
      let wire: Wire;
      try {
        let timer: NodeJS.Timeout | undefined;
        const addresses = await Promise.race([
          this.resolve(host),
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new SourceError('TIMEOUT', 'DNS indisponível.')), 10000); }),
        ]).finally(() => clearTimeout(timer));
        if (!addresses.length || addresses.some(a => !isPublicAddress(a.address)))
          throw new SourceError('ADDRESS_DENIED', 'Destino não público bloqueado.');
        wire = await this.transport(u, {
          method: options.method ?? 'GET', headers: {
            'user-agent': 'legal-intelligence-codex/0.1.0',
            accept: 'application/json, application/xml, text/html, application/pdf;q=0.9',
            'accept-encoding': 'identity', ...options.headers,
          }, body: options.body, address: addresses[0], maxBytes: options.maxBytes ?? 2_000_000, timeout: 20000,
        });
      } catch (e) {
        if (e instanceof SourceError) throw e;
        throw new SourceError('NETWORK_ERROR', 'Não foi possível consultar a fonte oficial.');
      } finally { this.busy.delete(host); this.nextRequest.set(host, Date.now() + this.interval); }
      if (wire.status === 429) {
        const retry = wire.headers['retry-after'];
        const numeric = Number(retry);
        const seconds = retry && !Number.isNaN(numeric) ? numeric : (Date.parse(retry ?? '') - Date.now()) / 1000;
        const delay = Number.isFinite(seconds) ? Math.max(60, Math.ceil(seconds)) : 60;
        this.nextRequest.set(host, Date.now() + delay * 1000);
        throw new SourceError('RATE_LIMITED', 'A fonte limitou as consultas. Não houve nova tentativa.', delay);
      }
      if ([301,302,303,307,308].includes(wire.status)) {
        const sensitiveHeaders = Object.keys(options.headers ?? {}).some(k => /^(authorization|proxy-authorization|cookie|x-api-key)$/i.test(k));
        if (!wire.headers.location || sensitiveHeaders || options.method === 'POST')
          throw new SourceError('REDIRECT_DENIED', 'Redirecionamento de consulta autenticada ou sem destino rejeitado.');
        u = validateUrl(new URL(wire.headers.location, u).href);
        if (u.hostname === host) this.nextRequest.set(host, 0);
        continue;
      }
      if (wire.status < 200 || wire.status >= 300) throw new SourceError(`HTTP_${wire.status}`, `Fonte retornou HTTP ${wire.status}; conteúdo não confirmado.`);
      const contentType = wire.headers['content-type'] ?? '';
      if (wire.headers['content-encoding'] && wire.headers['content-encoding'] !== 'identity')
        throw new SourceError('ENCODING_UNSUPPORTED', 'Resposta comprimida inesperada; conteúdo não processado.');
      const sample = wire.bytes.subarray(0, 20000).toString('utf8');
      if (/verifica[çc][aã]o de seguran[çc]a|captcha|cf-chl-|challenge-platform|<title>\s*Access Denied/i.test(sample))
        throw new SourceError('SOURCE_BLOCKED', 'A fonte exige verificação interativa; bloqueio não contornado.');
      return { url: u.href, bytes: wire.bytes, contentType, retrievedAt: new Date().toISOString(), lastModified: wire.headers['last-modified'] ?? null };
    }
    throw new SourceError('REDIRECT_LIMIT', 'Limite de redirecionamentos atingido.');
  }
}
