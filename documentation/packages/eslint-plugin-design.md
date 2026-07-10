# @welpco/eslint-plugin-design

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Custom ESLint plugin (flat-config, CommonJS, no build step) that mechanically enforces the Welpco UI/UX bible (`packages/ui/ui-ux-bible.md`). Every violation message cites the bible section it enforces.

| | |
|---|---|
| Package name | `@welpco/eslint-plugin-design` |
| Location | `packages/eslint-plugin-design/` |
| Entry point | `./src/index.js` |
| Test | `pnpm --filter @welpco/eslint-plugin-design test` (`node --test src/rules/*.test.js`; each rule has ≥5 valid + ≥5 invalid `RuleTester` cases) |
| Consumers | Root `eslint.config.js` (root devDependency `workspace:*`), run by `pnpm lint` and by lint-staged/husky pre-commit |

## Rules (`src/rules/`)

| Rule | Enforces | Bible ref |
|---|---|---|
| `no-disallowed-inline-style` | JSX `style={{...}}` limited to a two-tier allow-list: tier 1 (layout sizing/box dimensions — any value), tier 2 escape hatch (positioning, z-index, color, border — value must be a Radix `var(--...)`, unitless number, or keyword; hard-coded hex/named colors and arbitrary px never allowed). | §15.5 |
| `no-raw-semantic-color` | No raw semantic colors on `Button`/`Callout`/`Text`/`IconButton` — use `SEMANTIC_COLOR.*` tokens. | §5.2 |
| `no-js-responsive-hook` | No JS-based responsive hooks / `window.matchMedia` in render paths (use Radix responsive props/CSS). | §9.4 |
| `require-iconbutton-aria-label` | Every `<IconButton>` needs `aria-label` or `aria-labelledby`. | §13.3 |
| `no-native-label-in-platform` | No native `<label>` JSX under `packages/*/src/platform/*` — use `<Text as="label">`. | §16.1 |
| `canonical-signin-signout` | User-visible copy says "Sign in" / "Sign out", never "Log in"/"Login"/"Logout". | §22.3 |
| `require-token-size` | JSX `size` attribute must match the per-component scale (Button 1–4, fields 1–3, etc.). | §4, §15 |

`src/index.js` exports the `rules` map plus a flat-config preset `configs.recommended` that registers the plugin under the `@welpco/design` namespace with **all seven rules at `warn`** ("Workstream B" in `packages/ui/ROADMAP.md`: promote to `error` once residual violations in `welper-header.tsx`/`customer-header.tsx` land).

## Where it's enabled (root `eslint.config.js`)

- Applies `designPlugin.configs.recommended` to **all `**/*.ts` / `**/*.tsx`** in the monorepo (with the usual `dist`/`.next`/`node_modules`/etc. ignores).
- The root config also registers no-op shim rules for `@next/next`, `@typescript-eslint`, `react-hooks`, etc., solely so inline `eslint-disable` comments referencing those plugins don't error — bible enforcement comes only from this plugin.
- Ran via root scripts `lint` / `lint:root` (`eslint . --max-warnings=9999`) and `lint-staged` (`eslint --fix` on staged `*.ts,tsx`; husky bootstrap documented in the package README).

## Marketing-components exemption

**Not configured.** No rule or config contains a marketing-specific carve-out (grep for "marketing" in the plugin finds nothing); the rules apply uniformly to all TS/TSX, including `apps/web`'s marketing routes. The only scoping that exists is per-rule (e.g. `no-native-label-in-platform` only fires inside `packages/*/src/platform/*`).

## Usage

```js
// eslint.config.js (flat config)
const design = require("@welpco/eslint-plugin-design");
module.exports = [design.configs.recommended];
```
