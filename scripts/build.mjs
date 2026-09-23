import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const built = await build({ entryPoints: ['mcp/src/main.ts'], outfile: 'mcp/server.bundle.mjs', bundle: true,
  platform: 'node', format: 'esm', target: 'node22', metafile: true,
  banner: { js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);" },
});
const names = new Set(Object.keys(built.metafile.inputs).filter(p => p.includes('node_modules/')).map(p => {
  const seg = p.split('node_modules/').at(-1).split('/'); return seg[0].startsWith('@') ? seg.slice(0,2).join('/') : seg[0];
}));
let notice = '# Dependências incluídas no bundle MCP\n\nO código de terceiros mantém suas licenças originais.\n';
for (const name of [...names].sort()) {
  const dir = path.join('node_modules',name); const pkg = JSON.parse(await readFile(path.join(dir,'package.json'),'utf8'));
  notice += `\n## ${name} ${pkg.version}\n\nLicença declarada: ${pkg.license ?? 'consulte o pacote'}\n`;
  for (const f of ['LICENSE','LICENSE.md','LICENSE.txt','license','license.md']) {
    try { notice += '\n```text\n'+await readFile(path.join(dir,f),'utf8')+'\n```\n'; break; } catch {}
  }
}
await writeFile('mcp/THIRD_PARTY_NOTICES.md',notice);
console.log('Bundle MCP e avisos de dependências gerados.');
