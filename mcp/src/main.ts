import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

const server = createServer({ datajudKey: process.env.DATAJUD_API_KEY });
await server.connect(new StdioServerTransport());
