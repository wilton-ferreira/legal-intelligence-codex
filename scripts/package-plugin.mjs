import { readdir, mkdir, readFile, writeFile, rm, stat, lstat } from 'node:fs/promises';
import path from 'node:path';
import { zipSync } from 'fflate';
import { createHash } from 'node:crypto';

const name='legal-intelligence-codex';
const manifest=JSON.parse(await readFile('.codex-plugin/plugin.json','utf8'));
const target=path.join('plugins',name);
const marker=path.join(target,'.generated');
try {
  await stat(target);
  if((await readFile(marker,'utf8')).trim() !== 'scripts/package-plugin.mjs') throw new Error('Destino não reconhecido como pacote gerado.');
  await rm(target,{recursive:true});
} catch(e) { if(e.code !== 'ENOENT') throw e; }
await mkdir(target,{recursive:true});
await writeFile(marker,'scripts/package-plugin.mjs\n');
const files={};
const zipOptions={level:6,mtime:new Date(2026,0,1,0,0,0)};
async function copy(relative) {
  const info=await lstat(relative);
  if(info.isSymbolicLink()) throw new Error(`Links simbólicos não são empacotados: ${relative}`);
  if(info.isDirectory()) {
    for(const child of (await readdir(relative)).sort()) await copy(path.join(relative,child));
    return;
  }
  const bytes=await readFile(relative); const dest=path.join(target,relative);
  await mkdir(path.dirname(dest),{recursive:true}); await writeFile(dest,bytes);
  files[`plugins/${name}/${relative.split(path.sep).join('/')}`]=[bytes,zipOptions];
}
// Explicit allowlist: no .git, .env, node_modules or machine-local files.
for(const item of ['.codex-plugin','.mcp.json','assets','skills','references','docs','README.md','LICENSE','mcp/server.bundle.mjs','mcp/THIRD_PARTY_NOTICES.md']) await copy(item);
const marketplace={name:'legal-intelligence-brasil',interface:{displayName:'Legal Intelligence Brasil'},plugins:[{
  name,source:{source:'local',path:`./plugins/${name}`},policy:{installation:'AVAILABLE',authentication:'ON_INSTALL'},category:'Productivity',
}]};
await mkdir('.agents/plugins',{recursive:true});
const catalog=JSON.stringify(marketplace,null,2)+'\n';
await writeFile('.agents/plugins/marketplace.json',catalog);
files['.agents/plugins/marketplace.json']=[Buffer.from(catalog),zipOptions];
await mkdir('dist',{recursive:true});
const archive=`dist/${name}-${manifest.version}.zip`;
const bytes=Buffer.from(zipSync(files)); await writeFile(archive,bytes);
const checksum=createHash('sha256').update(bytes).digest('hex');
await writeFile(`${archive}.sha256`,`${checksum}  ${path.basename(archive)}\n`);
console.log(`${archive} (${bytes.length} bytes)\nSHA-256 ${checksum}`);
