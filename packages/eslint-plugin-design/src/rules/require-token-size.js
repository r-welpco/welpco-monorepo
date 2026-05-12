"use strict";

/**
 * require-token-size
 *
 * Catches the classic `size="4"` on a TextField bug — Radix accepts sizes
 * wider than the bible allows, but the bible scopes each component to a
 * specific subset (§4, §15). Validate string-literal `size` values against
 * each component's allowed scale.
 */

const BIBLE_REF = "ui-ux-bible.md §4 and §15";

const SCALES = {
  Button: new Set(["1", "2", "3", "4"]),
  IconButton: new Set(["1", "2", "3", "4"]),
  "TextField.Root": new Set(["1", "2", "3"]),
  TextArea: new Set(["1", "2", "3"]),
  "Select.Root": new Set(["1", "2", "3"]),
  "Select.Trigger": new Set(["1", "2", "3"]),
  Badge: new Set(["1", "2", "3"]),
  Callout: new Set(["1", "2", "3"]),
  "Callout.Root": new Set(["1", "2", "3"]),
  Card: new Set(["1", "2", "3", "4", "5"]),
  "Dialog.Content": new Set(["1", "2", "3", "4"]),
  "AlertDialog.Content": new Set(["1", "2", "3", "4"]),
};

function getJsxName(openingNode) {
  if (!openingNode || !openingNode.name) return null;
  const n = openingNode.name;
  if (n.type === "JSXIdentifier") return n.name;
  if (n.type === "JSXMemberExpression") {
    const obj = n.object.type === "JSXIdentifier" ? n.object.name : null;
    const prop = n.property.type === "JSXIdentifier" ? n.property.name : null;
    if (obj && prop) return `${obj}.${prop}`;
  }
  return null;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Validate JSX `size` attribute against the bible's per-component scale (§4, §15).",
    },
    schema: [],
    messages: {
      outOfRange:
        'size="{{value}}" on <{{component}}> is outside the allowed scale [{{allowed}}] ({{ref}}).',
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = getJsxName(node);
        if (!name || !(name in SCALES)) return;

        const sizeAttr = node.attributes.find(
          (attr) => attr.type === "JSXAttribute" && attr.name && attr.name.name === "size",
        );
        if (!sizeAttr || !sizeAttr.value) return;

        let value = null;
        if (sizeAttr.value.type === "Literal" && typeof sizeAttr.value.value === "string") {
          value = sizeAttr.value.value;
        } else if (
          sizeAttr.value.type === "JSXExpressionContainer" &&
          sizeAttr.value.expression.type === "Literal" &&
          typeof sizeAttr.value.expression.value === "string"
        ) {
          value = sizeAttr.value.expression.value;
        }
        if (value == null) return; // Dynamic — let TS handle it.

        const allowed = SCALES[name];
        if (!allowed.has(value)) {
          context.report({
            node: sizeAttr,
            messageId: "outOfRange",
            data: {
              value,
              component: name,
              allowed: [...allowed].join(", "),
              ref: BIBLE_REF,
            },
          });
        }
      },
    };
  },
};
