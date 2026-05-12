"use strict";

/**
 * canonical-signin-signout
 *
 * The bible (§22.3) standardises the user-facing verbs as "Sign in" / "Sign
 * out" (never "Log in", "Login", "Logout"). Flag user-visible strings — JSX
 * text and user-visible string attributes only. Prop names like `onLogin`,
 * variable identifiers, and imports are explicitly allowed.
 */

const BIBLE_REF = "ui-ux-bible.md §22.3";
const BAD_WORD = /\blog\s?(in|out)\b|\blogout\b|\blogin\b/i;

const USER_VISIBLE_ATTRS = new Set([
  "children",
  "label",
  "title",
  "placeholder",
  "aria-label",
]);

function report(context, node, value) {
  context.report({
    node,
    messageId: "canonical",
    data: { value, ref: BIBLE_REF },
  });
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        'Use "Sign in" / "Sign out" in user-visible copy — never "Log in", "Login", "Logout" (bible §22.3).',
    },
    schema: [],
    messages: {
      canonical:
        'User-visible copy "{{value}}" uses non-canonical login/logout wording ({{ref}}). ' +
        'Use "Sign in" / "Sign out" instead.',
    },
  },

  create(context) {
    return {
      // JSX text nodes: <Button>Log in</Button>
      JSXText(node) {
        const trimmed = node.value && node.value.trim();
        if (!trimmed) return;
        if (BAD_WORD.test(trimmed)) {
          report(context, node, trimmed);
        }
      },

      // Attribute values on user-visible props.
      JSXAttribute(node) {
        if (!node.name || !node.value) return;
        const attrName = node.name.name;
        if (typeof attrName !== "string") return;
        if (!USER_VISIBLE_ATTRS.has(attrName)) return;

        let value = null;
        if (node.value.type === "Literal" && typeof node.value.value === "string") {
          value = node.value.value;
        } else if (
          node.value.type === "JSXExpressionContainer" &&
          node.value.expression.type === "Literal" &&
          typeof node.value.expression.value === "string"
        ) {
          value = node.value.expression.value;
        }

        if (value && BAD_WORD.test(value)) {
          report(context, node, value);
        }
      },
    };
  },
};
