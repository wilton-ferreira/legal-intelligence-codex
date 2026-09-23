import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = process.cwd();
const manifest = JSON.parse(await readFile('.codex-plugin/plugin.json','utf8'));
assert.equal(manifest.name,'legal-intelligence-codex');
assert.match(manifest.version,/^\d+\.\d+\.\d+$/);
assert.equal(manifest.mcpServers,'./.mcp.json');
const mcp = JSON.parse(await readFile('.mcp.json','utf8')).mcpServers['legal-br'];
assert.equal(mcp.cwd,'.'); assert.equal(mcp.command,'node');
assert.deepEqual(mcp.args,['./mcp/server.bundle.mjs']);
assert.ok(mcp.env_vars.includes('DATAJUD_API_KEY'));
assert.ok((await stat('mcp/server.bundle.mjs')).size > 0);
for (const key of ['composerIcon','logo']) assert.ok((await stat(manifest.interface[key])).isFile());
assert.equal(manifest.interface.defaultPrompt.length,3);
const skills = await readdir('skills',{withFileTypes:true});
for (const entry of skills.filter(e=>e.isDirectory())) {
  const dir=path.join('skills',entry.name); const skill=await readFile(path.join(dir,'SKILL.md'),'utf8');
  assert.match(skill,new RegExp(`^---\\r?\\nname: ${entry.name}\\r?\\n`));
  assert.match(skill,/\ndescription: .+/);
  assert.ok(!skill.includes('[TODO:'));
  const metadata=await readFile(path.join(dir,'agents/openai.yaml'),'utf8');
  assert.ok(metadata.includes(`$${entry.name}`));
}
async function walk(dir) {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith('.md')) {
      const text=await readFile(file,'utf8');
      for(const match of text.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
        const target=match[1].split('#')[0];
        if(!target || /^[a-z]+:/i.test(target) || target.startsWith('/')) continue;
        const resolved=path.resolve(path.dirname(file),decodeURIComponent(target));
        assert.ok(resolved.startsWith(root+path.sep),`Referência fora do plugin: ${file}`);
        assert.ok((await stat(resolved)).isFile(),`Referência ausente: ${file} -> ${target}`);
      }
    }
  }
}
await walk('skills'); await walk('references');
console.log(`Plugin, MCP, ${skills.filter(e=>e.isDirectory()).length} skills e referências verificados.`);
