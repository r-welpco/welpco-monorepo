#!/usr/bin/env node
/**
 * Idempotent pre-commit hook installer — runs from the root `prepare`
 * script after husky has laid down `.husky/_`. Creates `.husky/pre-commit`
 * only if it doesn't already exist so manual edits are preserved.
 */
import { existsSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const hookPath = ".husky/pre-commit";
const hookBody = "pnpm exec lint-staged\n";

mkdirSync(dirname(hookPath), { recursive: true });
if (!existsSync(hookPath)) {
  writeFileSync(hookPath, hookBody);
  chmodSync(hookPath, 0o755);
  console.log(`[husky] wrote ${hookPath}`);
} else {
  console.log(`[husky] ${hookPath} already exists — leaving as-is`);
}
