import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (Number(process.versions.node.split('.')[0]) !== 22) {
  throw new Error('Design-system checks require the repository-supported Node 22 runtime.');
}
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', env: process.env });
  child.on('error', reject);
  child.on('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} failed (${signal ?? code})`)));
});

await run('pnpm', ['--filter', '@welpco/ui', 'build']);
await run('pnpm', ['--filter', '@welpco/design-system', 'type-check']);
await run('pnpm', ['--filter', '@welpco/design-system', 'build-storybook']);
await run(process.execPath, ['scripts/check-design-lint.mjs']);

const directory = path.join(root, 'apps/design-system/storybook-static');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(directory, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(directory + path.sep)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((resolve, reject) => { server.on('error', reject); server.listen(0, '127.0.0.1', resolve); });
const url = `http://127.0.0.1:${server.address().port}`;
try {
  await run('pnpm', ['--filter', '@welpco/design-system', 'exec', 'test-storybook', '--ci', '--url', url, '--maxWorkers=2']);
  await run(process.execPath, ['apps/design-system/scripts/check-matrix.mjs', url]);
  await run(process.execPath, ['apps/web/scripts/check-design-dialogs.mjs']);
} finally {
  await new Promise((resolve) => server.close(resolve));
}
