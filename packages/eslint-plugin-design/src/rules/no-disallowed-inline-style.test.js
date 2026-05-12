"use strict";

const rule = require("./no-disallowed-inline-style");
const { makeRuleTester } = require("../test-helpers");

const ruleTester = makeRuleTester();

ruleTester.run("no-disallowed-inline-style", rule, {
  valid: [
    // Primary tier — always allowed.
    { code: "const x = <div style={{ maxWidth: 320 }} />;" },
    { code: "const x = <div style={{ width: '100%', minWidth: 120 }} />;" },
    { code: "const x = <div style={{ flex: 1, flexDirection: 'row' }} />;" },
    { code: "const x = <div style={{ flexBasis: 0, flexGrow: 1, flexShrink: 0 }} />;" },
    { code: "const x = <div style={{ display: 'flex' }} />;" },
    { code: "const x = <div style={{ height: '64px', objectFit: 'contain' }} />;" },
    { code: "const x = <div style={{ aspectRatio: '16 / 9' }} />;" },

    // Escape-hatch tier — values using var(), keywords, or unitless numbers.
    { code: "const x = <div style={{ position: 'sticky', top: 0, zIndex: 50 }} />;" },
    { code: "const x = <div style={{ backgroundColor: 'var(--color-background)' }} />;" },
    { code: "const x = <div style={{ borderBottom: '2px solid var(--green-6)' }} />;" },
    { code: "const x = <div style={{ color: 'var(--red-9)' }} />;" },
    { code: "const x = <div style={{ opacity: 0.5 }} />;" },
    { code: "const x = <div style={{ pointerEvents: 'none' }} />;" },
    { code: "const x = <div style={{ overflow: 'hidden' }} />;" },

    // No inline style at all.
    { code: "const x = <div className='foo' />;" },
    // Spread — ignored (we only validate the keys we can read).
    { code: "const x = <div style={{ ...s, maxWidth: 100 }} />;" },
    // Dynamic escape-hatch value — trusted (can't evaluate statically).
    { code: "const x = <div style={{ backgroundColor: dynamicVar }} />;" },

    // List reset trio on <ul>.
    { code: "const x = <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} />;" },

    // Truncation idiom.
    { code: "const x = <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} />;" },

    // Multi-line clamp idiom.
    { code: "const x = <div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} />;" },

    // Circular shape idioms.
    { code: "const x = <div style={{ borderRadius: '9999px', width: '32px', height: '32px' }} />;" },
    { code: "const x = <div style={{ borderRadius: '50%', width: '32px', height: '32px' }} />;" },

    // Cursor + textAlign keywords.
    { code: "const x = <div style={{ cursor: 'pointer' }} />;" },
    { code: "const x = <div style={{ cursor: 'not-allowed' }} />;" },
    { code: "const x = <div style={{ textAlign: 'center' }} />;" },

    // SVG fill via CSS var.
    { code: "const x = <svg style={{ fill: 'var(--amber-9)' }} />;" },
  ],
  invalid: [
    // Properties outside both tiers.
    {
      code: "const x = <div style={{ padding: 8 }} />;",
      errors: [{ messageId: "escapeHatchLiteral", data: { name: "padding", value: "8", ref: "ui-ux-bible.md §15.5" } }],
    },
    {
      code: "const x = <div style={{ fontWeight: 600 }} />;",
      errors: [{ messageId: "disallowed" }],
    },
    {
      code: "const x = <div style={{ width: '100%', gap: 4 }} />;",
      errors: [{ messageId: "disallowed", data: { name: "gap", ref: "ui-ux-bible.md §15.5" } }],
    },
    {
      code: "const x = <div style={{ margin: 4 }} />;",
      errors: [{ messageId: "escapeHatchLiteral" }],
    },
    {
      code: "const x = <div style={{ lineHeight: '1.5' }} />;",
      errors: [{ messageId: "disallowed" }],
    },

    // Escape-hatch with a hard-coded literal — fires the literal-only message.
    {
      code: "const x = <div style={{ backgroundColor: '#ffffff' }} />;",
      errors: [{ messageId: "escapeHatchLiteral", data: { name: "backgroundColor", value: "#ffffff", ref: "ui-ux-bible.md §15.5" } }],
    },
    {
      code: "const x = <div style={{ backgroundColor: 'red' }} />;",
      errors: [{ messageId: "escapeHatchLiteral" }],
    },
    {
      code: "const x = <div style={{ borderRadius: 6 }} />;",
      errors: [{ messageId: "escapeHatchLiteral" }],
    },
  ],
});
