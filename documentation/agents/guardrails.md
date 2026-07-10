# Guardrails

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Things agents must NOT do, or must check first. Each is grounded in a real repo fact.

## Money paths — extreme caution

The payment domain moves real money through Stripe:

- `apps/bff/src/domains/payment/payment.service.ts` — `paymentIntents.create/capture/cancel`
- `apps/bff/src/domains/payment/payout-batch.service.ts` — `transfers.create` (welper payouts)
- `apps/bff/src/domains/payment/stripe-operations.service.ts`, `payment-capture.scheduler.ts`, `stripe-webhook.controller.ts`

Rules:

- **Any behavior change here requires unit tests AND explicit user confirmation before merging.** Nearly every payment service has a co-located `.spec.ts` — extend it.
- **Never fabricate Stripe API behavior.** If unsure what a Stripe call returns or how idempotency keys behave, check the actual usage in these files (see `payout-idempotency.util.ts`) or ask — do not guess.
- Preserve idempotency patterns (`payout-idempotency.util.ts`, webhook idempotency migration `20260411000001-AddWebhookIdempotencyAndIndexes.ts`).

## Migration chain — append-only

- **Never edit an existing migration file.** The runner (`apps/bff/src/database/run-migrations.ts`) auto-discovers every `src/**/migrations/*-*.{ts,js}` and applies pending ones in timestamp-prefix order; applied migrations are recorded and will not re-run, so editing history silently diverges databases.
- Migrations live in **two kinds of places**: `apps/bff/src/database/migrations/` and `apps/bff/src/domains/<domain>/migrations/`. New files anywhere under those paths are picked up automatically — no registration list to update.
- New migrations get a timestamp prefix **later than every existing one** (today's date + `000001`-style suffix). See [../operations/migrations.md](../operations/migrations.md).

## Friday active-batch unique index

`payout_batches` has a partial unique index guaranteeing **one active payout batch per Friday**. Current predicate (newest migration, `apps/bff/src/domains/payment/migrations/20260703000001-IncludeApprovedPayoutBatchesInActiveFridayIndex.ts`):

```sql
CREATE UNIQUE INDEX "IDX_payout_batches_active_friday"
ON "payout_batches" ("payout_friday")
WHERE "status" IN ('review', 'approved', 'executing')
```

Before touching payout-batch status flow, check the **newest** migration for the current predicate — it has already changed once (originally `('review','executing')`). Code that creates batches (`payout-batch.service.ts`) relies on this constraint; don't work around it in application code.

## Design rules are lint-enforced

- Don't inline arbitrary styles or raw colors in app code — `@welpco/eslint-plugin-design` (applied to all TS/TSX via root `eslint.config.js`) flags it. Rules are `warn` today with planned promotion to `error`; a pre-commit `lint-staged` hook runs eslint. Do not add new violations, and do not disable the rules.
- **Sole exception:** `apps/web/components/features/marketing/` — a faithful design-bundle port that is explicitly exempt per its `CLAUDE.md`. Don't "clean it up", and don't copy its inline-style patterns into other folders.
- Design authorities are `packages/ui/ui-ux-bible.md` and `packages/ui/PLATFORM-UX.md`.

## Stale docs — do not resurrect or copy

Root-level `updated_functional_architecture/`, `features/`, and `bible/` are stale doc trees pending removal. **Never** cite them, copy from them, or restore them if deleted. Current docs live in `documentation/`; implementation is the source of truth.

## Auth lives in the BFF — don't add packages/auth

There is no `packages/auth` and none should be created. Auth (JWT strategies, guards, `@Roles`/`@CurrentUser` decorators, `auth.module.ts`) lives in `apps/bff/src/common/auth/`. Extend it there.

## Ports are fixed

web **8081**, admin **8082**, bff **3000**, storybook **6006**. These are deliberate (`next dev -p 8081/8082` in the app package.json files). Do not "fix" web to 3000 or change ports to resolve conflicts — find what's occupying the port instead.

## .env.local is user state

`.env` and `.env*.local` are gitignored (root `.gitignore`) and contain the user's local secrets (e.g. `apps/bff/.env.local` exists on this machine). **Never overwrite or delete them without asking.** To add a new variable, update the relevant `.env.example` and tell the user to copy it over.
