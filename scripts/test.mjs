import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const files = readdirSync('mcp/test').filter(f => f.endsWith('.test.ts')).sort().map(f => `mcp/test/${f}`);
const run = spawnSync(process.execPath, ['--import','tsx','--test',...files], { stdio:'inherit' });
process.exit(run.status ?? 1);
