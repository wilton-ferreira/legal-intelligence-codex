import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { mkdtemp, cp, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createServer } from '../src/server.js';

test('MCP initializes, lists semantic tools/resources and reports missing credential without network', async () => {
  const server=createServer(); const client=new Client({name:'test',version:'1.0.0'});
  const [a,b]=InMemoryTransport.createLinkedPair();
  try {
    await Promise.all([server.connect(a),client.connect(b)]);
    const list=await client.listTools();
    assert.equal(list.tools.length,11);
    assert.ok(list.tools.every(t=>t.annotations?.readOnlyHint));
    assert.ok(list.tools.some(t=>t.name==='publication_search'));
    const output=await client.callTool({name:'case_get',arguments:{tribunal:'tjsp',processo:'00000000000000000000'}});
    assert.equal(output.isError,true);
    assert.match(JSON.stringify(output),/CREDENTIAL_REQUIRED/);
    assert.ok(!JSON.stringify(output).includes('APIKey '));
    const invalid=await client.callTool({name:'publication_search',arguments:{processo:'00000000000000000000',inicio:'2026-02-30'}});
    assert.equal(invalid.isError,true);
    const evidence=await client.callTool({name:'precedent_check',arguments:{}});
    assert.match(JSON.stringify(evidence),/INSUFFICIENT_EVIDENCE/);
    const resource=await client.readResource({uri:'legal-br://coverage'});
    assert.ok(resource.contents.length);
  } finally { await client.close(); await server.close(); }
});

test('standalone bundled MCP starts from relocated Unicode/spaced directory without node_modules',async () => {
  const temp=await mkdtemp(path.join(os.tmpdir(),'legal-br-'));
  const plugin=path.join(temp,'Pasta com espaços — revisão');
  await mkdir(path.join(plugin,'mcp'),{recursive:true});
  await cp('mcp/server.bundle.mjs',path.join(plugin,'mcp/server.bundle.mjs'));
  const client=new Client({name:'portable-test',version:'1.0.0'});
  const transport=new StdioClientTransport({command:process.execPath,args:['./mcp/server.bundle.mjs'],cwd:plugin,stderr:'pipe'});
  let stderr=''; transport.stderr?.on('data',data=>{stderr+=String(data);});
  try {
    await client.connect(transport);
    const result=await client.callTool({name:'sources_list',arguments:{}});
    assert.ok(!result.isError); assert.match(JSON.stringify(result),/CATALOG_ONLY/);
    assert.equal(stderr,'');
  } finally { await client.close(); await rm(temp,{recursive:true,force:true}); }
});
