# @welpco/events

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Event publisher/consumer scaffolding for a future async architecture. **Currently a no-op stub with zero consumers** — no app or package imports `@welpco/events` (verified by workspace-wide grep).

| | |
|---|---|
| Package name | `@welpco/events` |
| Location | `packages/events/` |
| Entry point | `./src/index.ts` (scripts: `build`, `type-check`) |
| Consumers | None |

## What's in it (`src/index.ts` re-exports three files)

| File | Exports | Notes |
|---|---|---|
| `src/publisher.ts` | `EventPublisher` interface, `NoOpEventPublisher` | The no-op class's own doc comment: "No-op publisher for the current monolith architecture. Replace with a real implementation (SQS, Redis Pub/Sub, etc.) when the system moves to async event processing." `publish()` does nothing. |
| `src/consumer.ts` | `EventConsumer` interface, `NoOpEventConsumer` | Same pattern; `subscribe()` does nothing. |
| `src/schemas.ts` | `EventSchema` interface, `eventSchemas` registry | Registry contains exactly one entry (`user.created`) with a string-keyed pseudo-schema. Not validated anywhere. |

## Relationship to the rest of the platform

- Compile-time event **types** live separately in `packages/types/src/events/` (the `DomainEvent` union) — also without a runtime dispatcher.
- The BFF is a single NestJS monolith with synchronous in-process calls between domain modules (see `packages/shared/docs/nestjs-microservice-guide.md`); nothing publishes or consumes events today.

## Verdict

**Vestigial by design.** It exists to reserve the interface shape (`EventPublisher`/`EventConsumer`) for a future move to async processing, but nothing in the codebase uses it. Safe to ignore for day-to-day work; if async events land, this is the intended home:

```ts
import { NoOpEventPublisher, type EventPublisher } from '@welpco/events';
```
