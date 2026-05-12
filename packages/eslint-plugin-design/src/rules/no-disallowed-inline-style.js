"use strict";

/**
 * no-disallowed-inline-style
 *
 * JSX `style={{ ... }}` attributes follow two tiers per ui-ux-bible.md §15.5:
 *
 *  1. PRIMARY allow-list — layout sizing / box dimensions. Any value accepted.
 *  2. ESCAPE-HATCH allow-list — a small set of positioning, z-index, color,
 *     and border properties that Radix doesn't expose via props. Values must
 *     be Radix CSS variables (`var(--...)`), a unitless number (for zIndex /
 *     opacity / flex-like), or a keyword token (`sticky`, `absolute`, …).
 *     Hard-coded hex colors, named web colors, and arbitrary pixel values
 *     are NEVER allowed in the escape-hatch tier.
 *
 * Everything outside both tiers is a warning.
 */

// Tier 1 — use freely.
const PRIMARY_KEYS = new Set([
  "maxWidth",
  "width",
  "minWidth",
  "height",
  "maxHeight",
  "minHeight",
  "flex",
  "flexDirection",
  "flexBasis",
  "flexGrow",
  "flexShrink",
  "display",
  "objectFit",
  "aspectRatio",
]);

// Tier 2 — use sparingly, values must be var() or keyword/unitless.
const ESCAPE_HATCH_KEYS = new Set([
  // Layered positioning
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "inset",
  "zIndex",
  "transform",
  // Overflow + truncation
  "overflow",
  "overflowX",
  "overflowY",
  "textOverflow",
  "whiteSpace",
  "WebkitLineClamp",
  "WebkitBoxOrient",
  // Pointer & cursor
  "pointerEvents",
  "cursor",
  // Color tokens
  "backgroundColor",
  "color",
  "fill",
  // Border + radius
  "borderColor",
  "border",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "borderRadius",
  "borderWidth",
  "boxShadow",
  "opacity",
  // Reset / list semantics
  "listStyle",
  "outline",
  // Text alignment (for Box wrapping a button or non-Text element)
  "textAlign",
  "textTransform",
  // Margin/padding — only zero/auto keywords (for resets / push-to-end); use Radix m/p props otherwise.
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  // Flex alignment overrides — only when Box/non-Flex parent forces inline.
  "alignSelf",
  "justifySelf",
]);

const BIBLE_REF = "ui-ux-bible.md §15.5";

// Accept Radix CSS vars and a small set of keyword/positional literals that
// don't bypass tokens. Hard-coded hex codes and named colors are never OK.
const POSITION_KEYWORDS = new Set([
  "static", "relative", "absolute", "sticky", "fixed",
]);
const OVERFLOW_KEYWORDS = new Set([
  "visible", "hidden", "scroll", "auto", "clip",
]);
const POINTER_KEYWORDS = new Set(["auto", "none"]);
const DISPLAY_KEYWORDS = new Set([
  "none", "block", "inline", "inline-block", "flex", "inline-flex", "grid", "inline-grid", "contents",
  // Multi-line clamp idiom requires `display: -webkit-box`.
  "-webkit-box",
]);
const CURSOR_KEYWORDS = new Set([
  "auto", "default", "pointer", "not-allowed", "text", "wait", "help", "move", "grab", "grabbing",
]);
const TEXT_ALIGN_KEYWORDS = new Set([
  "left", "center", "right", "start", "end", "justify",
]);
const TEXT_OVERFLOW_KEYWORDS = new Set(["ellipsis", "clip"]);
const WHITE_SPACE_KEYWORDS = new Set([
  "normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces",
]);
const LIST_STYLE_KEYWORDS = new Set(["none", "disc", "decimal", "circle", "square"]);
const OUTLINE_KEYWORDS = new Set(["none", "0"]);
const WEBKIT_BOX_ORIENT_KEYWORDS = new Set(["vertical", "horizontal"]);

// Allowed literal values for borderRadius — circular shapes that Radix Box
// doesn't expose a prop for.
const BORDER_RADIUS_KEYWORDS = new Set(["9999px", "50%"]);

// `margin: auto` etc. is a layout idiom, not a token bypass.
const MARGIN_KEYWORDS = new Set(["auto"]);

// alignSelf / justifySelf keywords — typically used when a single child
// needs to override Flex/Grid alignment without restructuring the parent.
const SELF_ALIGN_KEYWORDS = new Set([
  "auto", "stretch", "flex-start", "flex-end", "center", "start", "end", "baseline",
]);

// textTransform keywords — typography idioms with no Radix prop equivalent.
const TEXT_TRANSFORM_KEYWORDS = new Set([
  "none", "uppercase", "lowercase", "capitalize", "full-width",
]);

// Keys where unitless numbers are semantic (not a px shorthand).
const UNITLESS_NUMBER_KEYS = new Set(["zIndex", "opacity", "WebkitLineClamp"]);

function isAllowedEscapeHatchValue(keyName, value) {
  // Unitless numbers — semantic for a few specific keys.
  if (typeof value === "number") {
    if (UNITLESS_NUMBER_KEYS.has(keyName)) return true;
    // Allow zero for any key (top: 0, borderWidth: 0, margin: 0 in list resets).
    if (value === 0) return true;
    return false;
  }
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  // Radix CSS variables, anywhere in the expression.
  if (trimmed.includes("var(--")) return true;
  // Per-property keyword whitelists.
  if (keyName === "position" && POSITION_KEYWORDS.has(trimmed)) return true;
  if ((keyName === "overflow" || keyName === "overflowX" || keyName === "overflowY") &&
      OVERFLOW_KEYWORDS.has(trimmed)) return true;
  if (keyName === "pointerEvents" && POINTER_KEYWORDS.has(trimmed)) return true;
  if (keyName === "display" && DISPLAY_KEYWORDS.has(trimmed)) return true;
  if (keyName === "cursor" && CURSOR_KEYWORDS.has(trimmed)) return true;
  if (keyName === "textAlign" && TEXT_ALIGN_KEYWORDS.has(trimmed)) return true;
  if (keyName === "textOverflow" && TEXT_OVERFLOW_KEYWORDS.has(trimmed)) return true;
  if (keyName === "whiteSpace" && WHITE_SPACE_KEYWORDS.has(trimmed)) return true;
  if (keyName === "listStyle" && LIST_STYLE_KEYWORDS.has(trimmed)) return true;
  if (keyName === "outline" && OUTLINE_KEYWORDS.has(trimmed)) return true;
  if (keyName === "WebkitBoxOrient" && WEBKIT_BOX_ORIENT_KEYWORDS.has(trimmed)) return true;
  if (keyName === "borderRadius" && BORDER_RADIUS_KEYWORDS.has(trimmed)) return true;
  // margin/padding "auto" idiom (e.g. marginTop: auto to push to bottom in Flex).
  if (
    (keyName === "margin" ||
      keyName === "marginTop" ||
      keyName === "marginRight" ||
      keyName === "marginBottom" ||
      keyName === "marginLeft") &&
    MARGIN_KEYWORDS.has(trimmed)
  ) return true;
  if (
    (keyName === "alignSelf" || keyName === "justifySelf") &&
    SELF_ALIGN_KEYWORDS.has(trimmed)
  ) return true;
  if (keyName === "textTransform" && TEXT_TRANSFORM_KEYWORDS.has(trimmed)) return true;
  // Zero string values (top: "0", borderWidth: "0px") — fine.
  if (/^0(px|%|em|rem)?$/.test(trimmed)) return true;
  return false;
}

function extractStaticStringValue(valueNode) {
  if (!valueNode) return { kind: "dynamic" };
  if (valueNode.type === "Literal") {
    return { kind: "static", value: valueNode.value };
  }
  if (valueNode.type === "TemplateLiteral" &&
      valueNode.expressions.length === 0 &&
      valueNode.quasis.length === 1) {
    return { kind: "static", value: valueNode.quasis[0].value.cooked };
  }
  // Unary minus literals (e.g. -1) — rare but handle.
  if (valueNode.type === "UnaryExpression" &&
      valueNode.operator === "-" &&
      valueNode.argument.type === "Literal" &&
      typeof valueNode.argument.value === "number") {
    return { kind: "static", value: -valueNode.argument.value };
  }
  return { kind: "dynamic" };
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow inline style properties outside the Welpco bible §15.5 two-tier allow-list.",
    },
    schema: [],
    messages: {
      disallowed:
        "Inline style property `{{name}}` is not allowed ({{ref}}). " +
        "Use Radix props or a CSS module. Only layout-sizing props (width, maxWidth, flex, display, objectFit, …) " +
        "stay inline unconditionally.",
      escapeHatchLiteral:
        "Inline style `{{name}}: {{value}}` bypasses the token system ({{ref}}). " +
        "Escape-hatch properties must use `var(--...)` CSS variables, a unitless number, or a keyword — never hard-coded literals.",
    },
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (!node.name || node.name.name !== "style") return;
        if (!node.value || node.value.type !== "JSXExpressionContainer") return;
        const expr = node.value.expression;
        if (!expr || expr.type !== "ObjectExpression") return;

        for (const prop of expr.properties) {
          if (prop.type !== "Property") continue;
          let keyName = null;
          if (prop.key.type === "Identifier") keyName = prop.key.name;
          else if (prop.key.type === "Literal" && typeof prop.key.value === "string") {
            keyName = prop.key.value;
          }
          if (keyName == null) continue;

          // Tier 1 — primary, always allowed.
          if (PRIMARY_KEYS.has(keyName)) continue;

          // Tier 2 — escape-hatch, only OK if value is a var/keyword/unitless.
          if (ESCAPE_HATCH_KEYS.has(keyName)) {
            const { kind, value } = extractStaticStringValue(prop.value);
            // Dynamic expressions: trust the author (likely a computed value).
            if (kind === "dynamic") continue;
            if (isAllowedEscapeHatchValue(keyName, value)) continue;
            context.report({
              node: prop,
              messageId: "escapeHatchLiteral",
              data: { name: keyName, value: String(value), ref: BIBLE_REF },
            });
            continue;
          }

          // Not in either tier — always disallowed.
          context.report({
            node: prop,
            messageId: "disallowed",
            data: { name: keyName, ref: BIBLE_REF },
          });
        }
      },
    };
  },
};
