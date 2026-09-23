import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { asArray, parseJson, provenance, publicLink, result, SourceError, unverified } from '../domain.js';
import type { SafeHttp } from '../http.js';

type Paging = { pagina?: number; limite?: number };
type LegislationArgs = Paging & {
  fonte: 'lexml' | 'camara' | 'senado'; consulta?: string; tipo?: string; numero?: number; ano?: number;
};

export function pageInput(args: Paging) {
  const page = args.pagina ?? 1, limit = args.limite ?? 10;
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50)
    throw new SourceError('INVALID_INPUT', 'pagina deve ser de 1 a 1000 e limite de 1 a 50.');
  return { page, limit, offset: (page - 1) * limit };
}

export function queryInput(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 500 || /[\u0000-\u001f]/.test(value))
    throw new SourceError('INVALID_INPUT', 'consulta deve conter de 1 a 500 caracteres, sem caracteres de controle.');
  return value.trim();
}
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
function text(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (object(value) && typeof value['#text'] === 'string') return value['#text'];
  return null;
}
function values(value: unknown): string[] { return asArray(value).map(text).filter((v): v is string => v !== null); }

// Contracts checked 2026-09-23:
// https://www12.senado.leg.br/dados-abertos/legislativo/legislacao/acervo-do-portal-lexml
// https://legis.senado.leg.br/dadosabertos/v3/api-docs
// https://dadosabertos.camara.leg.br/api/v2/api-docs
// LexML's official Senate catalog links this SRU endpoint. The default CQL
// index is deliberately used: no undocumented document-type index is assumed.
export async function searchLexml(http: SafeHttp, args: Paging & { consulta: string }, requestedDomain: 'legislation' | 'jurisprudence') {
  const query = queryInput(args.consulta), { page, limit, offset } = pageInput(args);
  const url = new URL('https://www.lexml.gov.br/busca/SRU');
  url.search = new URLSearchParams({ operation: 'searchRetrieve', version: '1.1',
    query: `"${query.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`,
    maximumRecords: String(limit), startRecord: String(offset + 1), recordPacking: 'xml' }).toString();
  const retrieved = await http.get(url.href, { headers: { accept: 'application/xml' } });
  const xml = retrieved.bytes.toString('utf8');
  if (/captcha|verifica[çc][aã]o de seguran[çc]a|challenge-platform|cf[-_]chl|<title>\s*(?:Access Denied|Just a moment)/i.test(xml))
    throw new SourceError('SOURCE_BLOCKED', 'LexML exige verificação interativa; consulta não realizada.');
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml))
    throw new SourceError('UNSAFE_XML', 'DTD e declarações de entidades XML não são permitidas.');
  if (XMLValidator.validate(xml) !== true) throw new SourceError('SCHEMA_CHANGED', 'Resposta LexML não é XML válido.');
  let parsed: any;
  try { parsed = new XMLParser({ removeNSPrefix: true, ignoreAttributes: false, parseTagValue: false }).parse(xml); }
  catch { throw new SourceError('SCHEMA_CHANGED', 'Não foi possível interpretar a resposta LexML.'); }
  const body = parsed.searchRetrieveResponse;
  if (!object(body)) throw new SourceError('SCHEMA_CHANGED', 'Resposta não contém searchRetrieveResponse SRU.');
  if (body.diagnostics) throw new SourceError('SOURCE_QUERY_ERROR', 'LexML retornou diagnóstico SRU; consulta não concluída.');
  const countText = text(body.numberOfRecords);
  if (!countText || !/^\d+$/.test(countText) || !Number.isSafeInteger(Number(countText)))
    throw new SourceError('SCHEMA_CHANGED', 'Contagem SRU ausente ou inválida.');
  const count = Number(countText), records = asArray(body.records?.record);
  if ((count === 0 && records.length) || (count > offset && records.length === 0))
    throw new SourceError('SCHEMA_CHANGED', 'Contagem SRU inconsistente com os registros retornados.');
  const source = provenance('LexML Brasil', 'official-index', retrieved);
  const items = records.slice(0, limit).map(record => {
    if (!object(record) || !object(record.recordData)) throw new SourceError('SCHEMA_CHANGED', 'Registro SRU sem metadados XML.');
    if (record.recordData.diagnostic) throw new SourceError('SOURCE_QUERY_ERROR', 'LexML retornou diagnóstico para um registro.');
    const dc = record.recordData.dc;
    if (!object(dc) || (!dc.identifier && !dc.urn && !dc.title))
      throw new SourceError('SCHEMA_CHANGED', 'Registro LexML sem identificação Dublin Core.');
    return { kind: 'indexed-document', requestedDomain, titles: values(dc.title), identifiers: values(dc.identifier),
      urns: values(dc.urn), documentTypes: values(dc.tipoDocumento ?? dc.type), description: values(dc.description),
      documentDates: values(dc.date), authorities: values(dc.autoridade ?? dc.creator),
      urls: values(dc.identifier).map(publicLink).filter((v): v is string => v !== null),
      source, verification: unverified() };
  });
  return result(items, source, { page, limit, totalReported: count, nextPage: offset + items.length < count ? page + 1 : null,
    domainFilterApplied: false, requestedDomain, searchMode: 'CQL-default-index-literal',
    limitations: ['Índice de metadados com classes documentais mistas; conferir tipo, jurisdição e texto na autoridade de origem.',
      'Busca textual não confirma correspondência exata de número/ano, vigência ou situação de precedente.'] });
}

export async function searchLegislation(http: SafeHttp, args: LegislationArgs): Promise<unknown> {
  if (!['lexml', 'camara', 'senado'].includes(args.fonte)) throw new SourceError('INVALID_INPUT', 'Fonte legislativa não suportada.');
  const { page, limit, offset } = pageInput(args);
  const query = args.consulta === undefined ? undefined : queryInput(args.consulta);
  if (args.tipo !== undefined && (typeof args.tipo !== 'string' || !/^[\p{L}][\p{L}. -]{0,49}$/u.test(args.tipo)))
    throw new SourceError('INVALID_INPUT', 'tipo deve ser uma sigla ou denominação legislativa de até 50 caracteres.');
  if (args.numero !== undefined && (!Number.isSafeInteger(args.numero) || args.numero < 1 || args.numero > 999999999))
    throw new SourceError('INVALID_INPUT', 'numero deve ser inteiro positivo de até 9 dígitos.');
  if (args.ano !== undefined && (!Number.isInteger(args.ano) || args.ano < 1800 || args.ano > 2100))
    throw new SourceError('INVALID_INPUT', 'ano deve estar entre 1800 e 2100.');
  if (!query && !args.tipo && args.numero === undefined && args.ano === undefined)
    throw new SourceError('INVALID_INPUT', 'Informe consulta ou filtros legislativos.');
  if (args.fonte === 'lexml') {
    const consulta = [query, args.tipo, args.numero, args.ano].filter(v => v !== undefined).join(' ');
    return searchLexml(http, { ...args, consulta }, 'legislation');
  }
  if (args.fonte === 'senado' && args.numero === undefined && args.ano === undefined)
    throw new SourceError('INVALID_INPUT', 'Para Senado informe numero ou ano; evita limitar implicitamente a matérias em tramitação.');
  const senate = args.fonte === 'senado';
  const url = new URL(senate ? 'https://legis.senado.leg.br/dadosabertos/processo' : 'https://dadosabertos.camara.leg.br/api/v2/proposicoes');
  if (query) url.searchParams.set(senate ? 'termo' : 'keywords', query);
  if (args.tipo) url.searchParams.set(senate ? 'sigla' : 'siglaTipo', args.tipo);
  if (args.numero !== undefined) url.searchParams.set('numero', String(args.numero));
  if (args.ano !== undefined) url.searchParams.set('ano', String(args.ano));
  if (!senate) { url.searchParams.set('pagina', String(page)); url.searchParams.set('itens', String(limit)); }
  const retrieved = await http.get(url.href, { headers: { accept: 'application/json' } });
  const body = parseJson(retrieved), rows = senate ? body : body?.dados;
  if (!Array.isArray(rows) || rows.some(row => !object(row) || !Number.isSafeInteger(row.id) || row.id <= 0))
    throw new SourceError('SCHEMA_CHANGED', 'Fonte legislativa retornou estrutura ou identificadores inesperados.');
  if (!senate && (!Array.isArray(body.links) || body.links.some((link: unknown) => !object(link) || typeof link.rel !== 'string' || typeof link.href !== 'string')))
    throw new SourceError('SCHEMA_CHANGED', 'Paginação da Câmara ausente ou inválida.');
  const source = provenance(senate ? 'Senado Federal' : 'Câmara dos Deputados', 'official-primary', retrieved);
  const items = (senate ? rows.slice(offset, offset + limit) : rows.slice(0, limit)).map(row => ({
    kind: 'legislative-proposal', id: row.id,
    identification: senate ? row.identificacao ?? null : `${row.siglaTipo ?? ''} ${row.numero ?? ''}/${row.ano ?? ''}`.trim(),
    summary: row.ementa ?? null, presentationDate: row.dataApresentacao ?? null,
    sourceUpdatedAt: row.dataUltimaAtualizacao ?? null, reportedSituation: row.situacaoAtual ?? null,
    situationDate: row.dataSituacaoAtual ?? null, resultingNormAsReported: row.normaGerada ?? null,
    documentUrl: publicLink(senate ? row.urlDocumento : row.uri), source, verification: unverified(),
  }));
  const hasNext = senate ? offset + items.length < rows.length : body.links.some((link: any) => link.rel === 'next');
  return result(items, source, { page, limit, nextPage: hasNext ? page + 1 : null,
    pagination: senate ? 'local-slice-of-single-source-response' : 'source',
    totalInResponse: rows.length, totalReported: null,
    limitations: ['Proposições e processos legislativos não equivalem a normas em vigor.',
      'Data de atualização e situação da proposição não confirmam vigência da norma eventualmente gerada.',
      ...(senate ? ['API do Senado sem paginação; cada chamada obtém resposta limitada em bytes e apresenta somente a fatia solicitada.'] : [])] });
}
