# Database Seeds

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Seeds are ts-node scripts hitting the database directly (TypeORM DataSource) — they do not go through the HTTP API. Run migrations first; the seeds assume the schema exists.

## Scripts

| Command | Where | Runs | Purpose |
|---|---|---|---|
| `pnpm seed:users` | root | `pnpm --filter @welpco/bff seed` | Main seed (users + taxonomy + content + demo data) |
| `pnpm seed` | `apps/bff` | `ts-node ... src/database/seeds/run-seed.ts` | Same, directly |
| `pnpm seed:payout-test-bookings` | `apps/bff` | `ts-node ... src/database/seeds/run-seed-payout-test-bookings.ts` | 5 released test bookings for payout-batch testing |
| `pnpm seed:service-questions` | `apps/bff` | `ts-node ... src/database/seeds/run-seed-service-selection-questions.ts` | Booking-detail questions per subcategory |
| `pnpm create:admin` | root or `apps/bff` | `src/scripts/create-admin-user.ts` | Create an admin account |
| `pnpm clean:non-admin-users` | root or `apps/bff` | `src/scripts/clean-non-admin-users.ts` | Wipe non-admin users (dev) |

## Main seed (`run-seed.ts` → `seed.ts`)

Safety guards (`seed-flags.ts`):

- **Production-like DB** (`NODE_ENV=production`, or `DB_DATABASE` matches `/prod/i`, or `SEED_ENV=production`) → refuses to run unless `SEED_CONFIRM_PRODUCTION=yes`; user seeding is then skipped by default.
- `SEED_SKIP_USERS=1` → **content-only mode**: taxonomy sync + content + holidays + validation, no accounts.

Full dev run, in order:

1. **Test accounts** (bcrypt cost 12, email pre-verified, referral codes, matching customer/welper profiles):

   | Email | Password | State |
   |---|---|---|
   | `customer@welpco.com` | `Customer123!` | Customer, signup incomplete (wizard demo) |
   | `welper@welpco.com` | `Welper123!` | Welper, signup incomplete (wizard demo) |
   | `e2e-customer@welpco.com` | `Customer123!` | Customer, dashboard-ready |
   | `e2e-welper@welpco.com` | `Welper123!` | Welper, dashboard-ready |
   | `admin@welpco.local` | `Admin123!` | Admin |

2. `syncServiceCategoryTaxonomy` — upserts the canonical taxonomy (`service-category-taxonomy.ts`: 8 level-1 parents, 39 level-2 subcategories), deactivates legacy categories, migrates offerings off removed subcategories.
3. `seedContent` — questions + `service_questions` links (**level-2 subcategories only** — level-1 parents never get questions), static pages, FAQ, marketing phrases. Skips if content exists; force with `CLEAR_CONTENT=1 pnpm seed`.
4. `seedHolidays` — CA (country-wide + ON + QC) and US holidays for 2025–2026; skips if present.
5. `seedSearchDemo` — searchable public welper profiles: Alex Rivera (`welper@welpco.com`, Babysitter), Jane Doe (`e2e-welper@welpco.com`, Pet Care/Dog Walks), Sam Chen (`search-demo@welpco.com`, Math Tutoring + Housekeeping). Try searches: `babysit`, `pet`, `dog`, `tutor`, `math`.
6. `seedQuebecWelpers` — 30 welpers (10 each: Quebec City, Montreal, Brossard) with geo service areas and passed background checks, for the distribution report/search.
7. `seedFixOfferingCategories` — reassigns any offerings pointing at level-1 categories to a level-2 subcategory.
8. `validateSeed` — asserts taxonomy counts, required accounts and their flags, demo categories; throws on failure.

The `README-SEARCH-DEMO.md` and `README-SERVICE-QUESTIONS.md` files in `apps/bff/src/database/seeds/` were verified against the code and are accurate (demo welpers, example queries, level-2-only question rule, `CLEAR_CONTENT=1` reseed flow).

## Payout test bookings (`seed:payout-test-bookings`)

Dev-DB-only (refuses production-like). Creates `welper_50@welpco.com` / `customer_50@welpco.com` and 5 completed, `payment_released` bookings on the last 5 Saturdays (Toronto), with service receipts (13% tax), fake Stripe payment ids, and `welper_payout_ledger` rows — i.e. everything the admin Payouts screen needs to build a Friday batch. Use after the main seed.

## Service selection questions (`seed:service-questions`)

Seeds the full per-subcategory booking question sets from `service-selection-question-definitions.ts` (Babysitter "Add child" flow, Dog Walks dog count/size, Meal Preparation, Events & Hospitality, etc.). Flags:

| Env | Default | Effect |
|---|---|---|
| `REPLACE_SERVICE_QUESTIONS` | `1` | Delete existing `service_questions` links before inserting (`0` to keep) |
| `SKIP_TAXONOMY_SYNC` | `0` | `1` skips the taxonomy sync that normally runs first |
| `SEED_CONFIRM_PRODUCTION` | — | Required `yes` on production-like DBs |

Throws if any active subcategory ends up without question definitions.

## Related env / flags

- `DISABLE_RATE_LIMIT=true` — disable BFF rate limiting when driving seeded flows in E2E (`src/domains/user-management/auth/guards/rate-limit.guard.ts`); rate limiting is already relaxed when `NODE_ENV` is development/test.
- `SEARCH_CATEGORY_ID`, `EXPECTED_WELPER_EMAIL`, `BFF_URL` — inputs for the post-seed smoke test `pnpm test:search-welper-demo` (`src/scripts/search-welper-demo-test.ts`).
- DB connection comes from the same `DB_*` vars as the app; `.env` / `.env.local` in `apps/bff/` are loaded automatically.

## Recommended order

```bash
docker-compose up -d          # local Postgres (+ MailHog)
pnpm db:migrate               # schema first
pnpm seed:users               # main seed (users, taxonomy, content, demo welpers)
pnpm --filter @welpco/bff seed:payout-test-bookings   # optional: payout testing data
pnpm --filter @welpco/bff seed:service-questions      # optional: full question catalog
```

Production/content-only: `SEED_CONFIRM_PRODUCTION=yes SEED_SKIP_USERS=1 pnpm seed:users` (taxonomy + content + holidays only; no accounts).

All seeds are idempotent-ish (skip-if-exists or upsert); the destructive paths are gated behind `CLEAR_CONTENT=1` and `REPLACE_SERVICE_QUESTIONS=1`.
