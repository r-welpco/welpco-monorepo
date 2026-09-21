import { ESLint } from 'eslint';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseline = JSON.parse(await readFile(new URL('./design-lint-baseline.json', import.meta.url), 'utf8'));
const results = await new ESLint({ cwd: root }).lintFiles([
  'packages/ui/src', 'apps/web', 'apps/admin', 'apps/design-system/stories',
]);
let failures = 0;
let warnings = 0;
for (const result of results) {
  const file = path.relative(root, result.filePath).split(path.sep).join('/');
  const counts = {};
  for (const message of result.messages) {
    if (message.severity === 2) {
      console.error(`${file}:${message.line}: ${message.message}`);
      failures++;
    }
    if (message.ruleId?.startsWith('@welpco/design/')) {
      counts[message.ruleId] = (counts[message.ruleId] ?? 0) + 1;
      warnings++;
    }
  }
  for (const [rule, count] of Object.entries(counts)) {
    const allowance = baseline[file]?.[rule] ?? 0;
    if (count > allowance) {
      console.error(`${file}: ${rule}: ${count} violations exceeds baseline ${allowance}`);
      failures++;
    }
  }
}
console.log(`Design lint: ${warnings} findings; ${failures} errors or baseline increases.`);
process.exitCode = failures ? 1 : 0;
