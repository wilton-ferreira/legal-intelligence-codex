import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { unzipSync } from 'fflate';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const manifest = JSON.parse(await readFile('.codex-plugin/plugin.json', 'utf8'));
const archive = `dist/${manifest.name}-${manifest.version}.zip`;
const bytes = await readFile(archive);
const checksum = createHash('sha256').update(bytes).digest('hex');
assert.equal((await readFile(`${archive}.sha256`, 'utf8')).trim(), `${checksum}  ${path.basename(archive)}`);
const files = unzipSync(bytes);
const prefix = `plugins/${manifest.name}/`;
const catalogPath = '.agents/plugins/marketplace.json';
const catalog = JSON.parse(Buffer.from(files[catalogPath]).toString('utf8'));
assert.equal(catalog.plugins[0].source.path, `./plugins/${manifest.name}`);
const packedManifest = JSON.parse(Buffer.from(files[`${prefix}.codex-plugin/plugin.json`]).toString('utf8'));
assert.deepEqual(packedManifest, manifest);
assert.equal(Object.keys(files).filter(name => name.startsWith(`${prefix}skills/`) && name.endsWith('/SKILL.md')).length, 17);
const temp = await mkdtemp(path.join(os.tmpdir(), 'Pacote jurídico com espaços — '));
const client = new Client({ name: 'package-validation', version: '1.0.0' });
try {
  for (const [name, content] of Object.entries(files)) {
    assert.ok(name === catalogPath || name.startsWith(prefix), `Entrada fora do pacote: ${name}`);
    assert.ok(!name.includes('\\') && !name.split('/').includes('..'), `Caminho inválido: ${name}`);
    assert.ok(!name.split('/').some(part => ['.git', '.env', 'node_modules'].includes(part)), `Arquivo indevido: ${name}`);
    const destination = path.join(temp, name);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
  const plugin = path.join(temp, 'plugins', manifest.name);
  const config = JSON.parse(await readFile(path.join(plugin, '.mcp.json'), 'utf8')).mcpServers['legal-br'];
  assert.equal(config.command, 'node');
  assert.equal(config.cwd, '.');
  const transport = new StdioClientTransport({ command: process.execPath, args: config.args, cwd: plugin, stderr: 'pipe' });
  await client.connect(transport);
  assert.equal((await client.listTools()).tools.length, 11);
  const response = await client.callTool({ name: 'sources_list', arguments: {} });
  assert.ok(!response.isError);
  assert.match(JSON.stringify(response), /CATALOG_ONLY/);
  console.log('ZIP validado: integridade, estrutura e MCP portátil em diretório temporário.');
} finally {
  await client.close();
  await rm(temp, { recursive: true, force: true });
}
