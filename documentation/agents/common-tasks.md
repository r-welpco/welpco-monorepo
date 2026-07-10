# Common Tasks

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Step-by-step recipes, each based on a real file in the repo. When in doubt, open the cited example and mirror it.

## a) Add a BFF endpoint to an existing domain

Reference example: `apps/bff/src/domains/payment/payout.controller.ts` + `dto/create-stripe-connect-link.dto.ts`.

1. **DTO** — `apps/bff/src/domains/<domain>/dto/<action>.dto.ts`, class-validator + Swagger decorators:

   ```ts
   import { ApiProperty } from '@nestjs/swagger';
   import { IsNotEmpty, IsString } from 'class-validator';

   export class CompleteSetupIntentDto {
     @ApiProperty({ description: 'Stripe SetupIntent id (e.g. seti_...)' })
     @IsString()
     @IsNotEmpty()
     setupIntentId!: string;
   }
   ```

2. **Controller route** — Swagger + auth decorators are expected on every route:

   ```ts
   @ApiTags('Payment')
   @Controller('payment/connect')
   export class PayoutController {
     constructor(private readonly stripeConnect: StripeConnectService) {}

     @Post('sync')
     @UseGuards(JwtAuthGuard, RolesGuard)
     @Roles('welper')
     @ApiBearerAuth('JWT-auth')
     @HttpCode(HttpStatus.OK)
     @ApiOperation({ summary: 'Refresh Stripe Connect status after onboarding' })
     async sync(@CurrentUser() user: CurrentUserData) {
       return this.stripeConnect.syncAccount(user.userId);
     }
   }
   ```

   Auth imports come from `../../common/auth/` (guards, `Roles`, `CurrentUser`).

3. **Service** — business logic in `<domain>.service.ts` (or a focused sibling service like `stripe-connect.service.ts`); keep controllers thin.
4. **Register** — if you added a new controller/service class, add it to `<domain>.module.ts` (`controllers` / `providers` arrays).
5. **Unit test** — co-located `<name>.spec.ts` (see `payout-batch.service.spec.ts`). Run `pnpm --filter @welpco/bff test`.

## b) Add a database migration

Reference example: `apps/bff/src/domains/payment/migrations/20260703000001-IncludeApprovedPayoutBatchesInActiveFridayIndex.ts`.

1. Create the file in the owning domain's `migrations/` folder (or `apps/bff/src/database/migrations/` if cross-domain). Name it `<YYYYMMDD><NNNNNN>-<PascalCaseDescription>.ts` with a timestamp later than every existing migration.
2. Skeleton (real shape from the example above):

   ```ts
   import { MigrationInterface, QueryRunner } from 'typeorm';

   export class AddThing20260703000002 implements MigrationInterface {
     public async up(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.query(`/* forward SQL */`);
     }

     public async down(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.query(`/* reverse SQL */`);
     }
   }
   ```

   Class name = description + timestamp. Always implement `down`.
3. Run: `pnpm --filter @welpco/bff migration:run`. The runner (`apps/bff/src/database/run-migrations.ts`) auto-discovers the file via glob — no registration needed. Never edit applied migrations ([guardrails.md](guardrails.md)); more in [../operations/migrations.md](../operations/migrations.md).

## c) Add a UI component to an app using @welpco/ui

Import pattern actually used in `apps/web/components/` — **subpath imports, one component per path**:

```tsx
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
```

1. Place the component under the owning feature folder (web: `apps/web/components/features/<feature>/`).
2. Compose from `@welpco/ui` primitives; follow `packages/ui/ui-ux-bible.md` (sizes, semantic colors, responsive props) — the design lint rules apply ([conventions.md](conventions.md)).
3. Verify: `pnpm --filter @welpco/web lint && pnpm --filter @welpco/web type-check`.

## d) Add a seed

Reference: `apps/bff/src/database/seeds/` — `seed.ts` orchestrates focused seeders like `seed-holidays.ts`, `seed-quebec-welpers.ts`.

1. Create `apps/bff/src/database/seeds/seed-<thing>.ts` exporting an async function taking the TypeORM `DataSource` (mirror `seed-holidays.ts`).
2. Wire it into `seedDatabase()` in `seed.ts` (import + call), respecting the `shouldSkipUserSeed()` split — reference data always runs; user/test data only when users aren't skipped (see `seed-flags.ts`).
3. If it needs entities not yet registered, add them to `allEntities` in `run-seed.ts`.
4. Run: `pnpm --filter @welpco/bff seed`. Standalone seeds get their own runner + script, like `seed:payout-test-bookings` → `run-seed-payout-test-bookings.ts`.
5. Seeds can have specs too — see `seed-payout-test-bookings.spec.ts`.

## e) Run the full local stack

Full instructions: [../getting-started/setup.md](../getting-started/setup.md). Short version:

1. `docker compose up -d` — Postgres 16 on 5432 plus MailHog for email testing (`docker-compose.yml`). Local dev needs only Postgres (no Kafka/Redis — root `.env.example`); MailHog is optional.
2. Copy env examples: root `.env.example` → `.env.local`, plus per-app `.env.example` files.
3. `pnpm --filter @welpco/bff migration:run` then `pnpm --filter @welpco/bff seed`.
4. Dev servers: `pnpm --filter @welpco/bff dev` (3000), `pnpm --filter @welpco/web dev` (8081), `pnpm --filter @welpco/admin dev` (8082), optionally `pnpm --filter @welpco/design-system dev` (6006). Helper scripts exist in `scripts/` (`dev-tmux.sh`, `dev-zellij.sh`).
