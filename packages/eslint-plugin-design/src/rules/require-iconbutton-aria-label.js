"use strict";

/**
 * require-iconbutton-aria-label
 *
 * Every `<IconButton>` must carry an accessible name so screen-reader users
 * can perceive the action (bible §13.3). Accept either `aria-label` or
 * `aria-labelledby`.
 */

const BIBLE_REF = "ui-ux-bible.md §13.3";

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
      description: "Every <IconButton> must have aria-label or aria-labelledby (bible §13.3).",
    },
    schema: [],
    messages: {
      missing:
        "<IconButton> requires `aria-label` or `aria-labelledby` ({{ref}}) so assistive tech can name the action.",
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = getJsxName(node);
        if (name !== "IconButton") return;

        let hasLabel = false;
        for (const attr of node.attributes) {
          if (attr.type === "JSXSpreadAttribute") {
            // Conservative: a spread could provide the label, don't flag.
            hasLabel = true;
            break;
          }
          if (attr.type !== "JSXAttribute" || !attr.name) continue;
          const attrName = attr.name.name;
          if (attrName === "aria-label" || attrName === "aria-labelledby") {
            hasLabel = true;
            break;
          }
        }

        if (!hasLabel) {
          context.report({
            node,
            messageId: "missing",
            data: { ref: BIBLE_REF },
          });
        }
      },
    };
  },
};
