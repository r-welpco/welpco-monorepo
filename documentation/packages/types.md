# @welpco/types

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Shared TypeScript types and interfaces — pure types/enums, no runtime logic beyond enum/const definitions.

| | |
|---|---|
| Package name | `@welpco/types` |
| Location | `packages/types/` |
| Entry point | `./src/index.ts` (consumed from source; scripts: `build`, `type-check`) |
| Consumers | `apps/web` (declared dep, ~15+ files) and `packages/ui` (signup-steps, dispute components). **Not** imported by `apps/bff` or `apps/admin`. |

## Type domains (`src/index.ts` re-exports three barrels)

### `src/domain/` — core domain types
- Status/role unions defined in `domain/index.ts`: `UserRole` (`customer | welper | admin | guardian`), `BookingStatus`, `PaymentStatus`, `DisputeStatus` (includes BFF `in-review`/`withdrawn` plus legacy `under-review`/`dismissed` aliases kept for back-compat — see the Wave 2 comment), `ReviewStatus`, `NotificationStatus`.
- One file per shared type: `address.type.ts`, `geojson.type.ts`, `phone.type.ts`, `error-codes.enum.ts`, `service-area-info.type.ts`, `evidence-file.type.ts`, `dispute-evidence.type.ts`, `dispute-category.type.ts`, `signup-state.type.ts`.

### `src/api/` — API envelope types
`ApiResponse<T>` and `PaginatedResponse<T>`.

### `src/events/` — domain event type definitions
`BaseEvent` plus typed events (`UserCreatedEvent`, `BookingCreatedEvent`, `BookingStatusChangedEvent`, `PaymentAuthorizedEvent`, `PaymentCapturedEvent`, `PaymentFailedEvent`, `ReviewSubmittedEvent`, `DisputeOpenedEvent`, `DisputeResolvedEvent`) and the `DomainEvent` union. Note: these are type-level only; the runtime event system in `packages/events` is a no-op (see `documentation/packages/events.md`).

## Who imports it (examples)

- `apps/web/lib/hooks/use-signup.ts`, `apps/web/lib/dashboard/*` (setup checklists), `apps/web/app/[locale]/(auth)/register/**` — mostly signup-state and domain types.
- `packages/ui/src/platform/user-management/signup-steps/types.ts`, `packages/ui/src/platform/dispute-resolution/{dispute-form,evidence-upload}.tsx`.

The BFF defines its own entity/DTO types and does not depend on this package.

## Usage

```ts
import type { SignupState, UserRole, ApiResponse } from '@welpco/types';
```
