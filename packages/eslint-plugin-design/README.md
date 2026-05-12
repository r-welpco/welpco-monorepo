# @welpco/eslint-plugin-design

Custom ESLint plugin that enforces the Welpco UI/UX bible
(`packages/ui/ui-ux-bible.md`). All rules ship as `warn` per Workstream B —
promote to `error` once the residual header violations (§15.5) land.

## Rules

| Rule                               | Bible ref |
| ---------------------------------- | --------- |
| `no-disallowed-inline-style`       | §15.5     |
| `no-raw-semantic-color`            | §5.2      |
| `no-js-responsive-hook`            | §9.4      |
| `require-iconbutton-aria-label`    | §13.3     |
| `no-native-label-in-platform`      | §16.1     |
| `canonical-signin-signout`         | §22.3     |
| `require-token-size`               | §4, §15   |

## Usage (flat config)

```js
// eslint.config.js
const design = require("@welpco/eslint-plugin-design");
module.exports = [design.configs.recommended];
```

## Tests

```sh
pnpm --filter @welpco/eslint-plugin-design test
```

Each rule has ≥5 valid + ≥5 invalid cases via ESLint's `RuleTester`.

## Husky pre-commit bootstrap

Husky is configured via the root `prepare` script. One-time setup per
clone — the `.husky/pre-commit` hook file must exist with this content:

```sh
pnpm exec lint-staged
```

Create it with:

```sh
echo 'pnpm exec lint-staged' > .husky/pre-commit
chmod +x .husky/pre-commit
```

(The sandbox this scaffold ran in could not write to `.husky/` directly,
so this step is left for a human to execute once.)
