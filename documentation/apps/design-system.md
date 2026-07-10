# apps/design-system — Storybook Host

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Storybook 10 app (`@storybook/react-vite`) that hosts stories for the shared **`packages/ui`** (`@welpco/ui`) component library. It contains no product code — only stories, Storybook config (`.storybook/`), and an accessibility test runner. Runs on **port 6006**.

## Running

```sh
pnpm --filter @welpco/design-system dev   # storybook dev -p 6006
```

## What it covers (`apps/design-system/stories/`)

Stories import components from `@welpco/ui` subpath exports (e.g. `import { Button } from '@welpco/ui/button'`) and compose with `@radix-ui/themes`:

| Folder | Contents |
|---|---|
| `stories/Components/` | ~35 component stories: button, card, text-field, password-field, dialog, alert-dialog, select, checkbox(-group/-cards), radio(-cards), switch, slider, tabs, tab-nav, table, badge, callout, tooltip, popover, hover-card, dropdown-menu, context-menu, avatar, spinner, skeleton, progress, segmented-control, scroll-area, separator, inset, aspect-ratio, data-list, ... |
| `stories/Layout/` | box, flex, grid, container, section |
| `stories/Typography/` | text, heading, link, strong, code, quote, blockquote |
| `stories/examples/` | Composed patterns: `dashboard-patterns`, `ecommerce-patterns` |

## Relationship to `packages/ui`

`@welpco/ui` ("Shared UI components built with Radix UI Themes") is the source of truth consumed by [apps/web](web.md) and [apps/admin](admin.md); this app is its visual catalog and a11y regression harness. Config: `.storybook/main.ts` (stories glob + `@storybook/addon-a11y`), `.storybook/preview.tsx` / `decorators.tsx` (Radix theme wrapping), `.storybook/test-runner.ts` (axe checks via `axe-playwright`).

## Scripts (`apps/design-system/package.json`)

| Script | Command |
|---|---|
| `dev` | `storybook dev -p 6006` |
| `build-storybook` | `storybook build` (outputs `storybook-static/`) |
| `test:a11y` | `test-storybook --ci --url http://127.0.0.1:6006` (needs a running Storybook) |
| `test:a11y:static` | Serves `storybook-static/` on 6006 and runs the test runner against it |
