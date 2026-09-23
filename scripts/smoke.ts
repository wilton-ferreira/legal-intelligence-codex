// Optional live checks: npm run smoke. Never part of the offline test suite.
// Three small sequential requests; no retries, personal cases, or response text.
import { SafeHttp } from '../mcp/src/http.js';
import { SourceError } from '../mcp/src/domain.js';
import { searchPublications } from '../mcp/src/adapters/processes.js';
import { searchLegislation } from '../mcp/src/adapters/legislation.js';

const http = new SafeHttp();
const checks: { name: string; run: () => Promise<unknown> }[] = [
  { name: 'DJEN', run: () => searchPublications(http, { processo: '00000000000000000000', itens: 5 }) },
  { name: 'Câmara', run: () => searchLegislation(http, { fonte: 'camara', tipo: 'PL', ano: 2024, limite: 1 }) },
  { name: 'Senado', run: () => searchLegislation(http, { fonte: 'senado', tipo: 'PL', numero: 21, ano: 2020, limite: 1 }) },
];

for (const check of checks) {
  try {
    const value = await check.run() as {
      status?: unknown; items?: unknown;
      source?: { authority?: unknown; contentSha256?: unknown; retrievedAt?: unknown };
    };
    if (!value || !['RESULTS', 'NO_MATCH_IN_QUERIED_SOURCE'].includes(String(value.status)) ||
      !Array.isArray(value.items) || typeof value.source?.authority !== 'string' ||
      typeof value.source.contentSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.source.contentSha256) ||
      typeof value.source.retrievedAt !== 'string' || !Number.isFinite(Date.parse(value.source.retrievedAt))) {
      throw new SourceError('SMOKE_INVALID_RESULT', 'Resumo técnico da resposta inválido.');
    }
    console.log(JSON.stringify({
      name: check.name, status: value.status, count: value.items.length,
      source: value.source.authority, contentSha256: value.source.contentSha256,
      retrievedAt: value.source.retrievedAt,
    }));
  } catch (error) {
    process.exitCode = 1;
    console.error(JSON.stringify({
      name: check.name, status: 'NOT_VERIFIED',
      code: error instanceof SourceError ? error.code : 'SMOKE_FAILED',
    }));
  }
}
