# @welpco/database

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Small TypeORM/NestJS database utility package. In practice, **only one export is actually consumed: `BaseEntity`**. The rest is scaffolding that the BFF superseded with its own database module.

| | |
|---|---|
| Package name | `@welpco/database` |
| Location | `packages/database/` |
| Entry point | `./dist/index.js` (built with `tsc`; scripts: `build`, `type-check`) |
| Consumers | `apps/bff` only (`workspace:*` dep; also built by the BFF's `prebuild` script) |

## What it exports (`src/index.ts`)

| File | Exports | Actually used? |
|---|---|---|
| `src/base-entity.ts` | `BaseEntity` — abstract class with `id` (uuid PK), `createdAt`, `updatedAt` columns | **Yes.** Re-exported by `apps/bff/src/common/base-entity.ts`; all 41 BFF entity files extend it via that path. |
| `src/database.module.ts` | `DatabaseModule.forRoot()` — dynamic Nest module wrapping `TypeOrmModule.forRootAsync` | **No.** The BFF has its own `apps/bff/src/database/database.module.ts`. |
| `src/typeorm.config.ts` | `createTypeOrmConfig()`, `createDataSource()` — env-driven Postgres config helpers | **No.** BFF builds its config inline (pool sizing, SSL, statement timeout). |
| `src/connection.ts` | `getDatabaseUrl()` — builds a `postgresql://` URL | **No** consumers found. |
| `src/migrations.ts` | `Migration` interface, `MigrationRunner` — a **stub** (`run()` just logs "Running migrations...") | **No.** Explicitly placeholder code. |

## Relationship to `apps/bff/src/database/`

The BFF's own folder is the real database layer and should be treated as authoritative:

- `apps/bff/src/database/database.module.ts` — the single `DatabaseModule` (one Postgres DB, `welpco_dev`, for all domains; header comment forbids per-domain modules). Registers the `allEntities` array (~40 entities from `apps/bff/src/domains/*/entities`), `synchronize: false` always, pool/SSL config via `db-cli-options.ts`.
- `apps/bff/src/database/db-cli-options.ts` — migration timestamp sorting + `postgresSslOption()`.
- `apps/bff/src/database/migrations/` and per-domain `apps/bff/src/domains/*/migrations/` — real TypeORM migrations, run via `pnpm db:migrate` (→ `@welpco/bff migration:run`).

## Verdict

**Partially vestigial.** Keep for `BaseEntity` (the shared entity base, deduplicated on purpose — see the comment in `apps/bff/src/common/base-entity.ts`). `DatabaseModule`, `createTypeOrmConfig`, `getDatabaseUrl`, and `MigrationRunner` are unused by any app and duplicated/superseded by the BFF's own implementation.

## Usage

```ts
// apps/bff — always import via the BFF re-export path:
import { BaseEntity } from '../../common/base-entity'; // → export { BaseEntity } from '@welpco/database'
```
