# Database Migrations

> Last verified: 2026-07-03 · commit de88bd4 (includes new payment migration `20260703000001`, landed in this commit) · generated from implementation

TypeORM migrations for the BFF Postgres database, run by a custom runner — not the stock TypeORM CLI.

## Where migrations live

Migrations are **auto-discovered by glob**, not registered in a list. The runner (`apps/bff/src/database/run-migrations.ts`) globs `src/**/migrations/*-*.{ts,js}`, so any `migrations/` folder under `apps/bff/src/` is picked up:

| Location | Scope |
|---|---|
| `apps/bff/src/database/migrations/` | Cross-domain / schema-wide (timestamptz standardization, webhook idempotency, refund columns) |
| `apps/bff/src/domains/<domain>/migrations/` | Domain-owned. Present in: `payment`, `booking`, `user-management`, `profile-management`, `content-management`, `communication`, `dispute`, `review`, `notification`, `job-posting`, `safety-verification` |

Both directories are combined into one sequence and sorted by the numeric timestamp in the filename (`migrationTimestampKey` in `apps/bff/src/database/db-cli-options.ts` extracts the leading 13–14 digit prefix, padded to 14). Alphabetical timestamp order = execution order — folder location does not matter. The header comment in `run-migrations.ts` explains why: a previous static array silently missed three domain migrations.

## Naming convention

Observed pattern (all recent files): `YYYYMMDD######-PascalCaseDescription.ts` — date + 6-digit sequence, e.g. `20260703000001-IncludeApprovedPayoutBatchesInActiveFridayIndex.ts`. Two legacy files use unix-ms timestamps (`1735689599999-CreateUserAccountsAndRelatedTables.ts`); the sorter handles both by padding to 14 digits.

The class name is `<Description><timestamp>`, e.g. `IncludeApprovedPayoutBatchesInActiveFridayIndex20260703000001`. Keep the timestamp in the class name — the runner records and orders by class name.

## Creating a migration

Manual file creation (no generator script exists). Skeleton matching the repo style:

```ts
// apps/bff/src/domains/<domain>/migrations/20260704000001-ShortDescription.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShortDescription20260704000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_example"
      ON "some_table" ("some_column")
      WHERE "status" IN ('a', 'b')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_example"`);
  }
}
```

Conventions verified from existing files:

- Raw SQL via `queryRunner.query(...)` for indexes/simple DDL; the schema-builder API (`queryRunner.createTable(new Table({...}))`, `addColumn(new TableColumn({...}))`, `TableForeignKey`, `TableIndex`) for tables — see `20260601000001-AddWelperPayoutLedgerAndBatches.ts`.
- Defensive checks are common: `const table = await queryRunner.getTable('x'); if (table && !table.findColumnByName('y')) { ... }`.
- Column style: `snake_case` names, `uuid` PKs with `uuid_generate_v4()`, `timestamptz` for `created_at`/`updated_at`.
- Migrations run **one transaction each** (`migrationsTransactionMode: 'each'`); set `public transaction = false;` on the class for statements that can't run in a transaction (e.g. `CREATE INDEX CONCURRENTLY`) — the custom runner respects it.

No other step is needed: the glob discovers the new file automatically.

## Running migrations

| Command | Where | What it does |
|---|---|---|
| `pnpm db:migrate` | repo root | `pnpm --filter @welpco/bff migration:run` |
| `pnpm migration:run` | `apps/bff` | `ts-node -r tsconfig-paths/register src/database/run-migrations.ts` |

The runner:

1. Loads env from `apps/bff/.env` then `apps/bff/.env.local` (`dotenv`).
2. Connects using `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` (dev defaults `localhost` / `5432` / `welpco` / `welpco_dev` / `welpco_dev`); SSL auto-enabled when `NODE_ENV=production`, `DB_SSL=true`, or `PGSSLMODE=require|verify-*` (`postgresSslOption` in `db-cli-options.ts`).
3. Fails loudly if the glob matches zero files; prints the discovered count.
4. Runs pending migrations **in chronological order** via `runPendingMigrationsInOrder` (stock TypeORM orders by class name — the custom runner exists to fix that) and records each in the standard `migrations` table.
5. `DB_LOGGING=true` enables SQL logging.

## Rollback

**There is no revert command.** Every migration defines `down()`, but nothing invokes it: `run-migrations.ts` only calls `up()`, and no `migration:revert` script exists in any package.json. Rolling back today means either running the `down()` SQL manually in `psql` (and deleting the corresponding row from the `migrations` table) or writing a new forward migration. Treat `down()` bodies as documentation of the inverse, not as an executable path.

## Production — gap

**No automated production migration path exists.** There is no CI/CD (no `.github/workflows`), no deploy pipeline, and no release script that runs migrations (see `documentation/operations/deployment.md`). The runner is prod-capable — it matches compiled `.js` migrations under `dist/`, supports SSL, and reads env from the BFF root — but someone must run `pnpm db:migrate` (or `node` the compiled runner) against the production database manually, with `DB_*`/SSL env set. Until a pipeline exists, make migration execution an explicit step in any manual deploy checklist.
