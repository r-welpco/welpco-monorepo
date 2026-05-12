"use strict";

/**
 * Root flat-config for the Welpco monorepo.
 *
 * Enforces the UI/UX bible (packages/ui/ui-ux-bible.md) via the custom
 * @welpco/eslint-plugin-design plugin. All rules ship as "warn" for now
 * (see ROADMAP Workstream B) — promote to "error" once the residual
 * violations in welper-header.tsx / customer-header.tsx land.
 */

const tsParser = require("@typescript-eslint/parser");
const designPlugin = require("@welpco/eslint-plugin-design");

// Lightweight shim so inline `eslint-disable-next-line <rule>` directives
// that reference plugins we don't load at the root (Next, React, TS) don't
// produce "Definition for rule X was not found" errors. Each rule is a
// no-op; we rely solely on the design-plugin preset for bible enforcement.
const noopRule = { meta: { type: "problem", schema: [] }, create: () => ({}) };
const noopPlugin = (ruleNames) => ({
  rules: Object.fromEntries(ruleNames.map((n) => [n, noopRule])),
});

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  {
    // Flat-config's `ignores` (no `files` sibling) replaces .eslintignore.
    // Keep this tight — these paths must never be linted.
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/storybook-static/**",
      "**/*.test.js",
      "**/.turbo/**",
      "**/.next/**",
      "**/coverage/**",
      "**/build/**",
      "**/.husky/**",
      "**/.vercel/**",
      "pnpm-lock.yaml",
    ],
  },
  {
    // Only lint our authored TS/TSX. ESLint picks up other files by default
    // otherwise, including generated .js chunks under .next/.
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    // Avoid blowing up on inline `eslint-disable` comments that reference
    // rules from plugins we don't load at the root (e.g. next/typescript).
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  // Register no-op shim rules referenced by inline disable comments.
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@next/next": noopPlugin(["no-img-element", "no-html-link-for-pages"]),
      "@next/internal": noopPlugin(["no-ambiguous-jsx"]),
      "@typescript-eslint": noopPlugin(["no-unused-vars", "no-explicit-any", "no-empty-object-type"]),
      "react-hooks": noopPlugin(["rules-of-hooks", "exhaustive-deps"]),
      react: noopPlugin(["no-unescaped-entities", "display-name"]),
      import: noopPlugin(["no-extraneous-dependencies", "no-unresolved"]),
    },
  },
  // Apply the design bible preset only to TS/TSX so we don't lint the
  // plugin's own plain-JS files or generic tooling scripts.
  {
    ...designPlugin.configs.recommended,
    files: ["**/*.ts", "**/*.tsx"],
  },
];
