# @welpco/shared

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Placeholder package for cross-domain utilities. **It currently contains no runtime code and has zero consumers** — no app or package imports `@welpco/shared`.

| | |
|---|---|
| Package name | `@welpco/shared` |
| Location | `packages/shared/` |
| Entry point | `./src/index.ts` (consumed from source, no dist entry; scripts: `build`, `type-check`) |
| Consumers | None (verified by workspace-wide grep) |

## Contents

| Path | What's there |
|---|---|
| `src/index.ts` | Comments only: "Shared utilities that don't belong to a specific domain go here. This package is intentionally minimal — avoid trivial wrappers." |
| `src/utils/index.ts` | Comments only, same policy (explicitly: no trivial wrappers like `Date.toISOString`). |
| `docs/nestjs-microservice-guide.md` | Backend development guide — see below. |

## The NestJS guide (`docs/nestjs-microservice-guide.md`)

Despite the legacy filename ("microservice"), the content **has been updated to reflect the current architecture** — its intro explicitly states the platform is **one single NestJS backend** (`apps/bff`) with domain modules, no separate microservice processes, no Kafka, and synchronous in-process communication between domains. It covers module structure, entity/DTO patterns, validation, error handling, database, testing, API docs, and auth. The filename is the only vestige of the earlier microservices plan.

## Verdict

**Vestigial (intentionally).** The package is an empty, deliberately-minimal slot kept for future cross-domain utilities plus a docs folder. Nothing imports it. If you add a genuinely shared utility, this is where it goes:

```ts
import { someUtil } from '@welpco/shared'; // once something is actually exported
```
