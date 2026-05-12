"use strict";

/**
 * no-js-responsive-hook
 *
 * The bible (§9.4) forbids JS-based breakpoint detection — responsive
 * layouts must be expressed via Radix responsive props (`display={{ initial,
 * md, lg }}`) so SSR renders identically to the client. Flag the banned
 * hook identifiers and any `window.matchMedia(...)` usage inside a
 * React component / hook body.
 */

const BANNED_IDENTIFIERS = new Set([
  "useIsMobile",
  "useIsTablet",
  "useIsDesktop",
  "useBreakpoint",
]);

const BIBLE_REF = "ui-ux-bible.md §9.4";

function isComponentOrHookName(name) {
  if (!name || typeof name !== "string") return false;
  if (name.startsWith("use") && name.length > 3 && /[A-Z]/.test(name[3])) return true;
  return /^[A-Z]/.test(name);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow JS-based responsive hooks and window.matchMedia in render paths (bible §9.4).",
    },
    schema: [],
    messages: {
      hook:
        "`{{name}}` is a JS-based breakpoint hook ({{ref}}). " +
        'Use Radix responsive props like display={ initial: "none", md: "flex" }.',
      matchMedia:
        "`window.matchMedia(...)` in component/hook `{{name}}` breaks SSR parity ({{ref}}). " +
        "Use Radix responsive props instead.",
    },
  },

  create(context) {
    // Track the name of the nearest enclosing function so we can decide
    // whether a matchMedia call is inside a React component/hook.
    const fnStack = [];

    function enterFn(name) {
      fnStack.push(name || null);
    }
    function leaveFn() {
      fnStack.pop();
    }

    function reportBannedIdentifier(node, name) {
      context.report({
        node,
        messageId: "hook",
        data: { name, ref: BIBLE_REF },
      });
    }

    return {
      // --- Function scope tracking -----------------------------------------
      "FunctionDeclaration"(node) {
        enterFn(node.id && node.id.name);
      },
      "FunctionDeclaration:exit"() {
        leaveFn();
      },
      "FunctionExpression"(node) {
        const parent = node.parent;
        let name = null;
        if (parent && parent.type === "VariableDeclarator" && parent.id.type === "Identifier") {
          name = parent.id.name;
        }
        enterFn(name);
      },
      "FunctionExpression:exit"() {
        leaveFn();
      },
      "ArrowFunctionExpression"(node) {
        const parent = node.parent;
        let name = null;
        if (parent && parent.type === "VariableDeclarator" && parent.id.type === "Identifier") {
          name = parent.id.name;
        }
        enterFn(name);
      },
      "ArrowFunctionExpression:exit"() {
        leaveFn();
      },

      // --- Banned identifiers ----------------------------------------------
      // Declaration of a banned hook.
      VariableDeclarator(node) {
        if (node.id && node.id.type === "Identifier" && BANNED_IDENTIFIERS.has(node.id.name)) {
          reportBannedIdentifier(node.id, node.id.name);
        }
      },
      "FunctionDeclaration > Identifier.id"(node) {
        if (BANNED_IDENTIFIERS.has(node.name)) {
          reportBannedIdentifier(node, node.name);
        }
      },
      // Call of a banned hook.
      CallExpression(node) {
        if (node.callee.type === "Identifier" && BANNED_IDENTIFIERS.has(node.callee.name)) {
          reportBannedIdentifier(node.callee, node.callee.name);
          return;
        }
        // window.matchMedia inside a component/hook function —
        // but ONLY when the query is a responsive-breakpoint query.
        // `prefers-color-scheme`, `prefers-reduced-motion`, `hover`, etc. are
        // legitimate user-preference queries that this rule does not target.
        if (
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "window" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "matchMedia"
        ) {
          // Extract the query string (Literal or static TemplateLiteral).
          let query = null;
          if (node.arguments.length > 0) {
            const arg = node.arguments[0];
            if (arg.type === "Literal" && typeof arg.value === "string") {
              query = arg.value;
            } else if (
              arg.type === "TemplateLiteral" &&
              arg.quasis.length === 1 &&
              arg.expressions.length === 0
            ) {
              query = arg.quasis[0].value.cooked;
            }
          }
          // Skip non-breakpoint queries (prefers-color-scheme, prefers-reduced-motion, hover, …).
          // If the query is dynamic (template with expressions), err on the
          // side of flagging — it might be a breakpoint in disguise.
          const isBreakpointQuery =
            query === null || /(min|max)-(width|height)/i.test(query);
          if (!isBreakpointQuery) return;

          for (let i = fnStack.length - 1; i >= 0; i--) {
            const fnName = fnStack[i];
            if (isComponentOrHookName(fnName)) {
              context.report({
                node: node.callee,
                messageId: "matchMedia",
                data: { name: fnName, ref: BIBLE_REF },
              });
              return;
            }
          }
        }
      },
    };
  },
};
