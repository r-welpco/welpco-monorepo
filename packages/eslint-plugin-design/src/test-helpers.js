"use strict";

/**
 * Shared helpers for rule unit tests. Centralises the parser configuration
 * so every rule test uses @typescript-eslint/parser with JSX enabled.
 */

const { RuleTester } = require("eslint");
const tsParser = require("@typescript-eslint/parser");

function makeRuleTester() {
  return new RuleTester({
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
  });
}

module.exports = { makeRuleTester };
