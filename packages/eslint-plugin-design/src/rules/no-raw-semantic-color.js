"use strict";

/**
 * no-raw-semantic-color
 *
 * Radix accepts raw color names like `color="red"`, but the bible (§5.2)
 * requires semantic tokens via `SEMANTIC_COLOR.*` so the app can retheme
 * globally. Flag raw red/green/blue/amber on the components whose colour
 * surfaces communicate state.
 *
 * Allow-list: the required-field marker `<Text as="span" color="red">*</Text>`
 * is a convention that stays red regardless of semantics.
 *
 * <Badge> is intentionally *not* flagged — see §20.4 (status badges have
 * their own semantic system via the status→color map).
 */

const TARGET_COMPONENTS = new Set([
  "Button",
  "Callout",
  "Callout.Root",
  "Text",
  "IconButton",
]);

const RAW_SEMANTIC_COLORS = new Set(["red", "green", "blue", "amber"]);
const BIBLE_REF = "ui-ux-bible.md §5.2";

function getJsxName(node) {
  if (!node || !node.name) return null;
  const n = node.name;
  if (n.type === "JSXIdentifier") return n.name;
  if (n.type === "JSXMemberExpression") {
    const obj = n.object.type === "JSXIdentifier" ? n.object.name : null;
    const prop = n.property.type === "JSXIdentifier" ? n.property.name : null;
    if (obj && prop) return `${obj}.${prop}`;
  }
  return null;
}

function findAttr(openingNode, name) {
  return openingNode.attributes.find(
    (attr) => attr.type === "JSXAttribute" && attr.name && attr.name.name === name,
  );
}

function attrStringValue(attr) {
  if (!attr || !attr.value) return null;
  if (attr.value.type === "Literal" && typeof attr.value.value === "string") {
    return attr.value.value;
  }
  if (
    attr.value.type === "JSXExpressionContainer" &&
    attr.value.expression.type === "Literal" &&
    typeof attr.value.expression.value === "string"
  ) {
    return attr.value.expression.value;
  }
  return null;
}

function isRequiredFieldMarker(jsxElement) {
  // <Text as="span" color="red">*</Text> — allowed per §5.2 allow-list.
  const opening = jsxElement.openingElement;
  const name = getJsxName(opening);
  if (name !== "Text") return false;
  const asAttr = findAttr(opening, "as");
  const asVal = attrStringValue(asAttr);
  if (asVal !== "span") return false;
  // Children must be exactly the literal "*".
  const children = (jsxElement.children || []).filter((child) => {
    if (child.type === "JSXText") return child.value.trim().length > 0;
    return true;
  });
  if (children.length !== 1) return false;
  const only = children[0];
  if (only.type === "JSXText") return only.value.trim() === "*";
  if (
    only.type === "JSXExpressionContainer" &&
    only.expression.type === "Literal" &&
    only.expression.value === "*"
  ) {
    return true;
  }
  return false;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw semantic colors on Button/Callout/Text/IconButton — use SEMANTIC_COLOR.* (bible §5.2).",
    },
    schema: [],
    messages: {
      raw:
        'color="{{value}}" on <{{component}}> is not allowed ({{ref}}). ' +
        "Use SEMANTIC_COLOR.{primary|danger|success|warning|info} from @welpco/ui/tokens.",
    },
  },

  create(context) {
    return {
      JSXOpeningElement(node) {
        const compName = getJsxName(node);
        if (!compName || !TARGET_COMPONENTS.has(compName)) return;

        const colorAttr = findAttr(node, "color");
        const value = attrStringValue(colorAttr);
        if (!value || !RAW_SEMANTIC_COLORS.has(value)) return;

        // Allow-list the `<Text as="span" color="red">*</Text>` marker.
        if (
          compName === "Text" &&
          value === "red" &&
          node.parent &&
          node.parent.type === "JSXElement" &&
          isRequiredFieldMarker(node.parent)
        ) {
          return;
        }

        context.report({
          node: colorAttr,
          messageId: "raw",
          data: { value, component: compName, ref: BIBLE_REF },
        });
      },
    };
  },
};
