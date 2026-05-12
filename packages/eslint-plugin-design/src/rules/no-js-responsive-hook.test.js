"use strict";

const rule = require("./no-js-responsive-hook");
const { makeRuleTester } = require("../test-helpers");

const ruleTester = makeRuleTester();

ruleTester.run("no-js-responsive-hook", rule, {
  valid: [
    // Radix responsive props — the canonical pattern.
    { code: 'const x = <Box display={{ initial: "none", md: "flex" }} />;' },
    // matchMedia inside a plain utility (not a component/hook) is fine.
    {
      code: "function doStuff() { return window.matchMedia('(min-width: 768px)'); }",
    },
    // Names that aren't component/hook-shaped — still fine.
    {
      code: "const helper = () => window.matchMedia('(min-width: 768px)');",
    },
    // Generic hooks are fine.
    { code: "function useAuth() { return true; }" },
    // Unrelated identifiers that happen to start with `useI...`.
    { code: "function useInvoice() { return null; }" },
    { code: "const useId = () => 1;" },
    // prefers-color-scheme is a legitimate user-preference query, NOT a breakpoint.
    {
      code:
        "function ThemeProvider() { const d = window.matchMedia('(prefers-color-scheme: dark)'); return null; }",
    },
    // prefers-reduced-motion — same principle.
    {
      code:
        "function useMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)'); }",
    },
    // hover/pointer queries — not a breakpoint.
    {
      code:
        "function App() { const h = window.matchMedia('(hover: hover)'); return null; }",
    },
  ],
  invalid: [
    {
      code: "function useIsMobile() { return false; }",
      errors: [{ messageId: "hook", data: { name: "useIsMobile", ref: "ui-ux-bible.md §9.4" } }],
    },
    {
      code: "const useIsTablet = () => false;",
      errors: [{ messageId: "hook" }],
    },
    {
      code: "const useIsDesktop = () => false;",
      errors: [{ messageId: "hook" }],
    },
    {
      code: "const useBreakpoint = () => 'md';",
      errors: [{ messageId: "hook" }],
    },
    {
      code: "const x = useIsMobile();",
      errors: [{ messageId: "hook" }],
    },
    {
      code:
        "function MyComponent() { const m = window.matchMedia('(min-width: 768px)'); return null; }",
      errors: [
        {
          messageId: "matchMedia",
          data: { name: "MyComponent", ref: "ui-ux-bible.md §9.4" },
        },
      ],
    },
    {
      code:
        "function useSomething() { const m = window.matchMedia('(min-width: 768px)'); return m; }",
      errors: [{ messageId: "matchMedia" }],
    },
  ],
});
