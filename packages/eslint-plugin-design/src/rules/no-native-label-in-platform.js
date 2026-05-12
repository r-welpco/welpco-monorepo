"use strict";

/**
 * no-native-label-in-platform
 *
 * Platform components must use the Radix-themed `<Text as="label">` so
 * label typography stays on-scale (bible §16.1). Lowercase `<label>`
 * JSX leaks host-default type sizes. Scope: files under `src/platform/`.
 */

const path = require("path");
const BIBLE_REF = "ui-ux-bible.md §16.1";

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow native <label> JSX in packages/*/src/platform/* — use <Text as=\"label\"> (bible §16.1).",
    },
    schema: [],
    messages: {
      native:
        'Native <label> is not allowed in platform components ({{ref}}). ' +
        'Use <Text as="label"> from @welpco/ui to keep label typography on-scale.',
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename?.() || "";
    const normalised = filename.split(path.sep).join("/");
    if (!normalised.includes("/src/platform/")) return {};

    return {
      JSXOpeningElement(node) {
        if (!node.name || node.name.type !== "JSXIdentifier") return;
        if (node.name.name !== "label") return;
        context.report({
          node,
          messageId: "native",
          data: { ref: BIBLE_REF },
        });
      },
    };
  },
};
