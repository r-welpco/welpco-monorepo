# Conventions

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Enforced and observed conventions. Everything here was verified against source at the commit above.

## Design system (lint-enforced)

**Authorities: `packages/ui/ui-ux-bible.md` and `packages/ui/PLATFORM-UX.md`.** These two files are audited current — follow them for any UI work.

The root `eslint.config.js` applies `@welpco/eslint-plugin-design`'s `recommended` preset to all `**/*.ts(x)`. Rules currently ship at `warn` (promotion to `error` is planned per the config header) — treat warnings as violations; do not add new ones. A husky pre-commit hook runs `lint-staged` → `eslint --fix` on staged `*.{ts,tsx}`.

The seven rules (`packages/eslint-plugin-design/src/rules/`), each citing the bible section it enforces:

| Rule | One line | Bible |
|---|---|---|
| `no-disallowed-inline-style` | JSX `style={{}}` limited to two tiers: layout/box sizing (any value) and a small escape-hatch list that must use Radix `var(--…)`/unitless/keyword values — never raw hex or arbitrary px | §15.5 |
| `no-raw-semantic-color` | No raw `color="red|green|blue|amber"` on state-communicating components — use `SEMANTIC_COLOR.*` (required-field `*` marker and `<Badge>` exempt) | §5.2 |
| `no-js-responsive-hook` | No JS breakpoint hooks or `window.matchMedia` in render paths — use Radix responsive props (`display={{ initial, md }}`) | §9.4 |
| `require-iconbutton-aria-label` | Every `<IconButton>` needs `aria-label` or `aria-labelledby` | §13.3 |
| `no-native-label-in-platform` | No native `<label>` under `packages/*/src/platform/` — use `<Text as="label">` | §16.1 |
| `canonical-signin-signout` | User-visible copy says "Sign in"/"Sign out", never "Log in"/"Login"/"Logout" | §22.3 |
| `require-token-size` | `size` props must stay within each component's bible-allowed scale (e.g. no `size="4"` TextField) | §4, §15 |

### Marketing exemption

`apps/web/components/features/marketing/` is a **faithful port of a design handoff bundle** and, per its own `CLAUDE.md` (authoritative), is explicitly *not* held to the bible's brand-color discipline or the design-plugin rules: inline styles and raw hex tokens are expected there. Do not "fix" that folder to bible standards, and do not copy its patterns elsewhere.

## BFF (NestJS) conventions

Observed pattern (see `apps/bff/src/domains/payment/` for a complete example):

- **Module per domain** — `apps/bff/src/domains/<domain>/` with `<domain>.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/`, `migrations/`.
- **DTOs** — one class per file in `dto/`, `class-validator` decorators (`@IsString`, `@IsOptional`, `@IsIn`, …) plus Swagger `@ApiProperty`/`@ApiPropertyOptional` with `description` (e.g. `dto/create-stripe-connect-link.dto.ts`).
- **Controllers** — Swagger decorators expected: `@ApiTags(...)` on the class, `@ApiOperation({ summary })` per route, `@ApiBearerAuth('JWT-auth')` on protected routes. Auth via `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('welper' | 'customer' | ...)` and `@CurrentUser()` — all from `apps/bff/src/common/auth/`.
- **Entities** — extend `BaseEntity` from `apps/bff/src/common/base-entity.ts` (re-export of `@welpco/database`).

## Migration naming

From existing filenames (`apps/bff/src/domains/payment/migrations/` etc.):

- Filename: `YYYYMMDDNNNNNN-PascalCaseDescription.ts` (e.g. `20260703000001-IncludeApprovedPayoutBatchesInActiveFridayIndex.ts`). The numeric prefix is the ordering key — alphabetical = chronological.
- Class: `PascalCaseDescription<timestamp>` implementing `MigrationInterface` (e.g. `IncludeApprovedPayoutBatchesInActiveFridayIndex20260703000001`).

Details and guardrails: [../operations/migrations.md](../operations/migrations.md) and [guardrails.md](guardrails.md).

## Tests

- **BFF unit tests** — co-located `*.spec.ts` next to source (Jest `testRegex: ".*\\.spec\\.ts$"` rooted at `src`). Run `pnpm --filter @welpco/bff test`.
- **BFF e2e** — `apps/bff/test/*.e2e-spec.ts` with `test/jest-e2e.json`. Shared helpers in `apps/bff/test/helpers/`: `test-auth.helper.ts` (auth setup), `e2e-domain-mocks.helper.ts` (domain mocks), `test-microservices.helper.ts`. Run `pnpm --filter @welpco/bff test:e2e`.
- **Web e2e** — Playwright under `apps/web/e2e/<feature>/` with `fixtures/`, `helpers/`, `global-setup.ts`/`global-teardown.ts`. Run `pnpm --filter @welpco/web test:e2e` (see `apps/web/e2e/README.md` for env setup).

## Commit style

`git log --oneline` shows messages like "update", "updates", "fix pagiantion" — **there is no enforced commit-message convention.** Write short imperative messages; don't invent a Conventional Commits scheme the repo doesn't use.
