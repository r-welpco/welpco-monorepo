# @welpco/ui — Design System

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Shared UI component library built on **Radix UI Themes** (pinned to `3.3.0` via a pnpm override in `pnpm-workspace.yaml`). It is the single source of UI primitives and platform-domain components for all Welpco frontends.

| | |
|---|---|
| Package name | `@welpco/ui` |
| Location | `packages/ui/` |
| Entry points | `./dist/index.js` (barrel) + ~80 per-component subpath exports |
| Build | `tsc` → `dist/` (`pnpm --filter @welpco/ui build`; also `dev` = `tsc --watch`, `type-check`) |
| Consumers | `apps/web`, `apps/admin`, `apps/design-system` (Storybook) — all via `workspace:*` |

## How it's organized

`packages/ui/src/` has two layers:

1. **Primitives** (flat files in `src/`, one per component): typed wrappers around Radix UI Themes — typography (`text.tsx`, `heading.tsx`, `link.tsx`, …), layout (`box.tsx`, `flex.tsx`, `grid.tsx`, `container.tsx`, `section.tsx`), forms (`text-field.tsx`, `password-field.tsx`, `checkbox*.tsx`, `radio*.tsx`, `select.tsx`, `switch.tsx`, `slider.tsx`), overlays (`dialog.tsx`, `alert-dialog.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `context-menu.tsx`, `hover-card.tsx`, `tooltip.tsx`), and data display (`table.tsx`, `tabs.tsx`, `badge.tsx`, `avatar.tsx`, `card.tsx`, `callout.tsx`, `progress.tsx`, `skeleton.tsx`, `spinner.tsx`, …).
2. **Platform components** (`src/platform/`): domain-specific composites, one directory per platform domain:

   | Domain dir | Components (`.tsx` count) |
   |---|---|
   | `user-management/` | 25 (login/register forms, signup-steps, password reset, verification, …) |
   | `profile-management/` | 22 |
   | `service-discovery/` | 19 |
   | `booking-scheduling/` | 7 |
   | `payment-processing/` | 7 |
   | `job-posting-matching/` | 6 |
   | `communication/`, `dispute-resolution/`, `review-rating/` | 5 each |
   | `layout/` | 4 (customer-header, welper-header, footer) |
   | `notification/` | 3 |
   | `feedback/` | 1 (action-confirm-dialog) |

   There is also `src/pricing/welper-customer-rate.ts` (rate/charge math, consumed internally by `platform/profile-management`, not a package.json export).

Do not enumerate components from this doc — the canonical component list lives in **`packages/ui/PLATFORM-UX.md`** and the design rules in **`packages/ui/ui-ux-bible.md`** (both audited as current; `packages/ui/ROADMAP.md` tracks workstreams).

## Exports

- Barrel: `import { Button, Flex, SEMANTIC_COLOR } from "@welpco/ui"` — re-exports tokens, all primitives, and `./platform` (which is `"use client"`).
- Per-component subpaths (the dominant style in the apps — e.g. `apps/web` has 30+ files importing `@welpco/ui/flex`):

```tsx
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { LoginForm } from "@welpco/ui/platform/user-management/login-form";
```

## Tokens / theming

Design tokens live in `packages/ui/src/tokens.ts` (exported as `@welpco/ui/tokens` and from the barrel). They are **typed re-exports of the Radix Themes scale** — e.g. `RADIX_SIZE`, `BUTTON_SIZE` (1–4), `FIELD_SIZE` (1–3), `CARD_SIZE` (1–5), `BUTTON_VARIANTS`, `BADGE_VARIANTS`, plus semantic color constants — so consumers get autocomplete and type-checking instead of bare strings. The canonical scale spec is `ui-ux-bible.md`. `src/utils.ts` exports a `cn()` clsx helper.

## Enforcement

The design rules are mechanically enforced by `packages/eslint-plugin-design` (`@welpco/eslint-plugin-design`), wired into the root `eslint.config.js` for all `**/*.ts,tsx` — see `documentation/packages/eslint-plugin-design.md`. Rules cite bible sections (§5.2 semantic colors, §15.5 inline styles, §4/§15 size scales, etc.) and currently run at `warn` severity.

## Notes

- Peer deps: `react ^19`, `react-dom ^19`, `@radix-ui/themes ^3.3.0`.
- `apps/design-system` is a Storybook app over this package (`storybook dev -p 6006`, a11y test scripts).
