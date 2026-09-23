import { confidentialText } from '../privacy.js';
import { SourceError, parseJson, processNumber, provenance, result, unverified } from '../domain.js';
import type { SafeHttp } from '../http.js';

// Snapshot of the OFFICIAL endpoint list, consulted 2026-09-23:
// https://datajud-wiki.cnj.jus.br/api-publica/endpoints/
// In particular TRE endpoints contain a hyphen and the published DF alias is tre-dft.
const DATAJUD_ALIASES = new Set(`stj stm tse tst
  tjac tjal tjam tjap tjba tjce tjdft tjes tjgo tjma tjmg tjms tjmt tjpa tjpb tjpe tjpi tjpr tjrj tjrn tjro tjrr tjrs tjsc tjse tjsp tjto
  tjmmg tjmrs tjmsp
  trf1 trf2 trf3 trf4 trf5 trf6
  trt1 trt2 trt3 trt4 trt5 trt6 trt7 trt8 trt9 trt10 trt11 trt12 trt13 trt14 trt15 trt16 trt17 trt18 trt19 trt20 trt21 trt22 trt23 trt24
  tre-ac tre-al tre-am tre-ap tre-ba tre-ce tre-dft tre-es tre-go tre-ma tre-mg tre-ms tre-mt tre-pa tre-pb tre-pe tre-pi tre-pr tre-rj tre-rn tre-ro tre-rr tre-rs tre-sc tre-se tre-sp tre-to`.split(/\s+/));
const schema = () => new SourceError('SCHEMA_CHANGED', 'A fonte retornou estrutura inesperada; resultado não confirmado.');
const invalid = (message: string) => new SourceError('INVALID_INPUT', message);
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const text = (v: unknown): string | null => typeof v === 'string' ? v : null;
const code = (v: unknown): string | number | null => typeof v === 'string' || integer(v) ? v : null;
function cnj(value: unknown) {
  if (typeof value !== 'string') throw invalid('Informe o número CNJ como texto.');
  return processNumber(value);
}
function coded(v: unknown) {
  if (v == null) return null;
  if (!object(v)) throw schema();
  return { codigo: code(v.codigo), nome: text(v.nome) };
}
function dateInput(v: unknown) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v)
    throw invalid('Use uma data de calendário válida no formato AAAA-MM-DD.');
  return v;
}

export async function queryCase(http: SafeHttp, args: { tribunal: string; processo: string; movimentos?: boolean }, apiKey?: string): Promise<unknown> {
  if (!object(args)) throw invalid('Informe os parâmetros da consulta.');
  const processo = cnj(args.processo);
  if (typeof args.tribunal !== 'string') throw invalid('Informe a sigla do tribunal.');
  const alias = args.tribunal.trim().toLowerCase();
  if (!DATAJUD_ALIASES.has(alias)) throw invalid('Tribunal sem endpoint DataJud validado. Use a sigla da lista oficial (ex.: tjsp, trf1, tre-sp, tre-dft).');
  if (args.movimentos !== undefined && typeof args.movimentos !== 'boolean') throw invalid('movimentos deve ser booleano.');
  if (!apiKey) throw new SourceError('CREDENTIAL_REQUIRED', 'Configure DATAJUD_API_KEY com a chave de acesso publicada pelo CNJ; consulte os termos oficiais antes do uso.');
  if (typeof apiKey !== 'string' || !apiKey.trim() || /[\r\n]/.test(apiKey)) throw invalid('A configuração da chave DataJud é inválida.');
  const fields = ['tribunal', 'numeroProcesso', 'dataAjuizamento', 'grau', 'nivelSigilo', 'classe', 'assuntos', 'orgaoJulgador', 'dataHoraUltimaAtualizacao', '@timestamp'];
  if (args.movimentos) fields.push('movimentos.codigo', 'movimentos.nome', 'movimentos.dataHora', 'movimentos.orgaoJulgador');
  const r = await http.get(`https://api-publica.datajud.cnj.jus.br/api_publica_${alias}/_search`, {
    method: 'POST', headers: { Authorization: `APIKey ${apiKey.trim()}`, 'content-type': 'application/json' },
    body: JSON.stringify({ size: 20, query: { match: { numeroProcesso: processo } }, _source: fields }), maxBytes: 2_000_000,
  });
  const body = parseJson(r);
  if (!object(body)) throw schema();
  if (body.error) throw new SourceError('SOURCE_ERROR', 'DataJud informou erro de consulta; dados não confirmados.');
  if (body.timed_out === true || (object(body._shards) && body._shards.failed > 0))
    throw new SourceError('INCOMPLETE_SOURCE_RESPONSE', 'DataJud informou consulta parcial ou expirada.');
  if (!object(body.hits) || !Array.isArray(body.hits.hits) || body.hits.hits.length > 20) throw schema();
  const total = integer(body.hits.total) ? body.hits.total : body.hits.total?.value;
  const relation = integer(body.hits.total) ? 'eq' : body.hits.total?.relation;
  if (!integer(total) || !['eq', 'gte'].includes(relation) || total < body.hits.hits.length) throw schema();
  const source = provenance('CNJ — DataJud', 'official-index', r);
  let excludedRestricted = 0;
  let excludedUnknownConfidentiality = 0;
  let movementsTruncated = false;
  const items: unknown[] = [];
  for (const hit of body.hits.hits) {
    if (!object(hit) || !object(hit._source)) throw schema();
    const s = hit._source;
    if (integer(s.nivelSigilo) && s.nivelSigilo > 0) { excludedRestricted++; continue; }
    // Fail closed if the visibility declaration disappears or changes type.
    if (s.nivelSigilo !== 0) { excludedUnknownConfidentiality++; continue; }
    if (s.numeroProcesso !== processo || typeof s.tribunal !== 'string') throw schema();
    if (s.assuntos != null && !Array.isArray(s.assuntos)) throw schema();
    if (args.movimentos && s.movimentos != null && !Array.isArray(s.movimentos)) throw schema();
    const movements = args.movimentos && Array.isArray(s.movimentos) ? s.movimentos.slice(0, 2000).map((m: unknown) => {
      if (!object(m) || !integer(m.codigo) || typeof m.dataHora !== 'string') throw schema();
      const orgao = m.orgaoJulgador;
      if (orgao != null && !object(orgao)) throw schema();
      return { codigo: m.codigo, nome: text(m.nome), dataHora: m.dataHora,
        orgaoJulgador: orgao ? { codigoOrgao: code(orgao.codigoOrgao), nomeOrgao: text(orgao.nomeOrgao) } : null };
    }) : null;
    if (args.movimentos && s.movimentos?.length > 2000) movementsTruncated = true;
    items.push({ kind: 'case-metadata', processo, tribunal: s.tribunal, grau: text(s.grau), nivelSigilo: 0,
      dataAjuizamento: text(s.dataAjuizamento), classe: coded(s.classe), assuntos: (s.assuntos ?? []).map(coded), orgaoJulgador: coded(s.orgaoJulgador),
      dataHoraUltimaAtualizacao: text(s.dataHoraUltimaAtualizacao), indexUpdatedAt: text(s['@timestamp']),
      movimentos: movements, movimentosSolicitados: args.movimentos ?? false,
      verification: unverified(), source,
    });
  }
  return result(items, source, { source: 'DataJud', tribunalAlias: alias, pagesQueried: 1, pageSize: 20,
    reportedTotal: total, totalRelation: relation, partial: relation !== 'eq' || total > body.hits.hits.length || movementsTruncated || excludedRestricted > 0 || excludedUnknownConfidentiality > 0,
    excludedRestricted, excludedUnknownConfidentiality, movementsTruncated,
    scope: 'Metadados e movimentos informados ao DataJud; não é o inteiro teor dos autos nem consulta de jurisprudência.',
    limitations: ['Atualização do índice não confirma atualidade processual ou vigência jurídica.', 'Ausência nesta consulta não demonstra inexistência de processo ou movimento.', 'Não contém partes, complementos livres ou cálculo de prazo.'],
  });
}


function restricted(item: Record<string, any>) {
  for (const key of ['sigilo', 'sigiloso', 'segredoJustica', 'segredo_justica', 'nivelSigilo']) {
    const v = item[key];
    if (v != null && v !== false && v !== 0 && v !== '0' && v !== 'false') return true;
  }
  return ['texto', 'tipoDocumento', 'tipoComunicacao', 'nomeOrgao', 'nomeClasse'].some(key => confidentialText(item[key]));
}
function judicialLink(v: unknown) {
  if (typeof v !== 'string') return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && u.hostname.endsWith('.jus.br') && !u.username && !u.password && (!u.port || u.port === '443') ? u.href : null;
  } catch { return null; }
}

export async function searchPublications(http: SafeHttp, args: { processo: string; tribunal?: string; inicio?: string; fim?: string; pagina?: number; itens?: number }): Promise<unknown> {
  if (!object(args)) throw invalid('Informe os parâmetros da consulta.');
  const processo = cnj(args.processo);
  const pagina = args.pagina === undefined ? 1 : args.pagina;
  const itens = args.itens === undefined ? 5 : args.itens;
  if (!Number.isSafeInteger(pagina) || pagina < 1 || ![5, 100].includes(itens) || (pagina - 1) * itens >= 10000)
    throw invalid('Use página positiva dentro do teto de 10.000 resultados e 5 ou 100 itens por página.');
  const url = new URL('https://comunicaapi.pje.jus.br/api/v1/comunicacao');
  url.searchParams.set('numeroProcesso', processo);
  url.searchParams.set('pagina', String(pagina));
  url.searchParams.set('itensPorPagina', String(itens));
  let tribunal: string | undefined;
  if (args.tribunal !== undefined) {
    if (typeof args.tribunal !== 'string' || !/^[a-z][a-z0-9-]{1,11}$/i.test(args.tribunal)) throw invalid('Use a sigla do tribunal.');
    tribunal = args.tribunal.toUpperCase();
    url.searchParams.set('siglaTribunal', tribunal);
  }
  if (args.inicio !== undefined) url.searchParams.set('dataDisponibilizacaoInicio', dateInput(args.inicio));
  if (args.fim !== undefined) url.searchParams.set('dataDisponibilizacaoFim', dateInput(args.fim));
  if (args.inicio && args.fim && args.inicio > args.fim) throw invalid('A data inicial deve ser anterior ou igual à final.');
  const r = await http.get(url.href, { maxBytes: 2_000_000 });
  const body = parseJson(r);
  if (!object(body) || typeof body.status !== 'string') throw schema();
  if (body.status !== 'success') throw new SourceError('SOURCE_ERROR', 'DJEN informou erro negocial; publicações não confirmadas.');
  if (!integer(body.count) || !Array.isArray(body.items) || body.items.length > itens || body.count < body.items.length) throw schema();
  const source = provenance('CNJ — DJEN', 'official-publication', r);
  let excludedRestricted = 0;
  const items: unknown[] = [];
  for (const item of body.items) {
    if (!object(item)) throw schema();
    if (restricted(item)) { excludedRestricted++; continue; }
    if (!integer(item.id) || typeof item.numero_processo !== 'string' || item.numero_processo.replace(/\D/g, '') !== processo ||
        typeof item.siglaTribunal !== 'string' || typeof item.data_disponibilizacao !== 'string' || typeof item.ativo !== 'boolean' || typeof item.texto !== 'string') throw schema();
    if (tribunal && item.siglaTribunal.toUpperCase() !== tribunal) throw schema();
    const certificateHash = typeof item.hash === 'string' && /^[a-z0-9_-]{1,200}$/i.test(item.hash) ? item.hash : null;
    items.push({ kind: 'publication-metadata', id: item.id, processo, tribunal: item.siglaTribunal,
      dataDisponibilizacao: item.data_disponibilizacao, tipoComunicacao: text(item.tipoComunicacao), tipoDocumento: text(item.tipoDocumento),
      orgao: text(item.nomeOrgao), classe: text(item.nomeClasse), codigoClasse: code(item.codigoClasse), meio: text(item.meio),
      numeroComunicacao: code(item.numeroComunicacao), ativo: item.ativo,
      link: judicialLink(item.link), certificateHash, certificateHashMeaning: 'Identificador fornecido pelo DJEN; algoritmo não declarado, não é SHA-256 calculado localmente.',
      certificateUrl: certificateHash ? `https://comunicaapi.pje.jus.br/api/v1/comunicacao/${encodeURIComponent(certificateHash)}/certidao` : null,
      verification: unverified(), source,
    });
  }
  const offset = (pagina - 1) * itens;
  const expected = Math.min(itens, Math.max(0, Math.min(body.count, 10000) - offset));
  const incompletePage = body.items.length < expected;
  const countMayBeCapped = body.count >= 10000;
  const hasMoreWithinCap = offset + body.items.length < Math.min(body.count, 10000);
  return result(items, source, { source: 'DJEN', pagesQueried: 1, page: pagina, pageSize: itens,
    reportedTotal: body.count, queryResultCap: 10000, countMayBeCapped, receivedOnPage: body.items.length,
    excludedRestricted, incompletePage, hasMoreWithinCap,
    partial: pagina > 1 || hasMoreWithinCap || incompletePage || countMayBeCapped || excludedRestricted > 0,
    scope: 'Metadados de comunicações; texto, destinatários e advogados omitidos. Certidão e links não foram obtidos.',
    limitations: ['Marcadores de sigilo no texto ou metadados causam exclusão conservadora; não é classificação jurídica.', 'Data de disponibilização não é data de publicação ou início de prazo calculada.', 'Ausência nesta página não demonstra inexistência de publicação.'],
  });
}
