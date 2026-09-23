import { parseJson, provenance, publicLink, result, SourceError, unverified } from '../domain.js';
import type { SafeHttp } from '../http.js';
import { pageInput, queryInput, searchLexml } from './legislation.js';

type Args = { fonte: 'stj' | 'tse'; consulta: string; pagina?: number; limite?: number };
// STJ links its machine access to https://docs.ckan.org/en/2.9/api/.
// Both official portals publish dataset catalogs. package_search searches their
// catalog metadata only; no resource content is downloaded or treated as a case.
const hosts = { stj: 'https://dadosabertos.web.stj.jus.br', tse: 'https://dadosabertos.tse.jus.br' };
const portals = { stj: 'https://scon.stj.jus.br/SCON/', tse: 'https://jurisprudencia.tse.jus.br/' };
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

export async function searchDatasets(http: SafeHttp, args: Args): Promise<unknown> {
  if (args.fonte !== 'stj' && args.fonte !== 'tse') throw new SourceError('INVALID_INPUT', 'Catálogo não suportado.');
  const query = queryInput(args.consulta), { page, limit, offset } = pageInput(args);
  const url = new URL(`${hosts[args.fonte]}/api/3/action/package_search`);
  url.search = new URLSearchParams({ q: query, rows: String(limit), start: String(offset) }).toString();
  const retrieved = await http.get(url.href, { headers: { accept: 'application/json' } });
  const body = parseJson(retrieved);
  if (body?.success === false) throw new SourceError('SOURCE_QUERY_ERROR', 'Catálogo CKAN recusou a consulta; não é ausência de resultados.');
  if (body?.success !== true || !object(body.result) || !Number.isSafeInteger(body.result.count) || body.result.count < 0 || !Array.isArray(body.result.results))
    throw new SourceError('SCHEMA_CHANGED', 'Resposta do catálogo não corresponde a package_search CKAN.');
  const rows = body.result.results;
  if (rows.some((row: unknown) => !object(row) || typeof row.id !== 'string' || !row.id || typeof row.name !== 'string' || !row.name || !Array.isArray(row.resources)))
    throw new SourceError('SCHEMA_CHANGED', 'Dataset sem identificação ou lista de recursos.');
  if (body.result.count < rows.length || (body.result.count > offset && rows.length === 0))
    throw new SourceError('SCHEMA_CHANGED', 'Contagem do catálogo inconsistente com os datasets.');
  const source = provenance(args.fonte.toUpperCase(), 'official-index', retrieved);
  const items = rows.slice(0, limit).map((row: any) => {
    if (row.resources.some((r: unknown) => !object(r) || typeof r.url !== 'string'))
      throw new SourceError('SCHEMA_CHANGED', 'Recurso CKAN sem URL.');
    return { kind: 'dataset', id: row.id, title: row.title ?? row.name, description: row.notes ?? null,
      catalogUrl: `${hosts[args.fonte]}/dataset/${encodeURIComponent(row.name)}`,
      sourceUpdatedAt: row.metadata_modified ?? null, createdAt: row.metadata_created ?? null,
      license: { id: row.license_id ?? null, title: row.license_title ?? null, url: publicLink(row.license_url), verified: false },
      resources: row.resources.slice(0, 50).map((r: any) => ({ id: r.id ?? null, title: r.name ?? null,
        url: publicLink(r.url), format: r.format ?? null, sourceUpdatedAt: r.last_modified ?? null,
        downloaded: false, contentSha256: null })),
      resourceCountReported: row.resources.length, resourcesTruncated: row.resources.length > 50,
      source, verification: unverified() };
  });
  return result(items, source, { mode: 'dataset-discovery', page, limit, totalReported: body.result.count,
    nextPage: offset + items.length < body.result.count ? page + 1 : null,
    decisionsSearched: false, confirmationPortal: portals[args.fonte],
    limitations: ['Busca nos metadados do catálogo; os resultados são conjuntos de dados, não decisões judiciais.',
      'Arquivos listados não foram obtidos ou indexados. URLs de recursos podem exigir acesso manual ou não estar na lista permitida.',
      'Atualização do catálogo e licença declarada não verificam atualidade jurídica nem autorização de todos os usos.'] });
}

export async function searchJurisprudence(http: SafeHttp, args: { fonte: 'lexml' | 'stj' | 'tse'; consulta: string; pagina?: number; limite?: number }): Promise<unknown> {
  if (args.fonte === 'lexml') return searchLexml(http, args, 'jurisprudence');
  if (args.fonte !== 'stj' && args.fonte !== 'tse') throw new SourceError('INVALID_INPUT', 'Fonte de jurisprudência não suportada.');
  return searchDatasets(http, { ...args, fonte: args.fonte });
}
