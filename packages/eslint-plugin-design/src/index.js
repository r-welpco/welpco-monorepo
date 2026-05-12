"use strict";

/**
 * @welpco/eslint-plugin-design
 *
 * Custom ESLint rules that enforce the Welpco UI/UX bible
 * (packages/ui/ui-ux-bible.md). Each rule cites the bible section it
 * enforces in the message so violations point straight at the spec.
 */

const noDisallowedInlineStyle = require("./rules/no-disallowed-inline-style");
const noRawSemanticColor = require("./rules/no-raw-semantic-color");
const noJsResponsiveHook = require("./rules/no-js-responsive-hook");
const requireIconbuttonAriaLabel = require("./rules/require-iconbutton-aria-label");
const noNativeLabelInPlatform = require("./rules/no-native-label-in-platform");
const canonicalSigninSignout = require("./rules/canonical-signin-signout");
const requireTokenSize = require("./rules/require-token-size");

const rules = {
  "no-disallowed-inline-style": noDisallowedInlineStyle,
  "no-raw-semantic-color": noRawSemanticColor,
  "no-js-responsive-hook": noJsResponsiveHook,
  "require-iconbutton-aria-label": requireIconbuttonAriaLabel,
  "no-native-label-in-platform": noNativeLabelInPlatform,
  "canonical-signin-signout": canonicalSigninSignout,
  "require-token-size": requireTokenSize,
};

const plugin = {
  meta: {
    name: "@welpco/eslint-plugin-design",
    version: "0.1.0",
  },
  rules,
};

plugin.configs = {
  // Flat-config preset. Consumer uses:
  //   import design from "@welpco/eslint-plugin-design";
  //   export default [design.configs.recommended];
  recommended: {
    name: "@welpco/design/recommended",
    plugins: { "@welpco/design": plugin },
    rules: {
      "@welpco/design/no-disallowed-inline-style": "warn",
      "@welpco/design/no-raw-semantic-color": "warn",
      "@welpco/design/no-js-responsive-hook": "warn",
      "@welpco/design/require-iconbutton-aria-label": "warn",
      "@welpco/design/no-native-label-in-platform": "warn",
      "@welpco/design/canonical-signin-signout": "warn",
      "@welpco/design/require-token-size": "warn",
    },
  },
};

module.exports = plugin;
