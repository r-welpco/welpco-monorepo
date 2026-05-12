import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Day 15 (BFF) — Phase 1 of the signup ↔ onboarding merge.
 *
 * Adds two columns to `user_accounts` so the signup wizard has a single
 * server-owned source of truth:
 *
 *  - `signup_completed BOOLEAN NOT NULL DEFAULT false` — flips to `true` on
 *    `POST /auth/signup/finish` once every role-required field is present.
 *    The existing `onboarding_completed` field on the role profiles stays for
 *    one more phase as a deprecated alias (Phase 4 deletion).
 *  - `selected_role` — Postgres enum `user_account_selected_role` with values
 *    `'customer' | 'welper'`. NULL until the user picks a role at step 1
 *    (the email/password "begin" call); locked once written.
 *
 * Existing `email_verified` semantics are unchanged — Phase 3 moves the gate
 * from "can sign in" to "can perform bookable actions" via `EmailVerifiedGuard`.
 *
 * Forward-additive only (no backfill scripting). Real production data does
 * not exist yet (development phase); the contract is "any row created before
 * Phase 1 lands has `signup_completed = false` and the user is routed back
 * through the wizard on next sign-in".
 */
export class AddSignupState20260429000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the selected_role enum first — no IF NOT EXISTS for CREATE TYPE
    // in older Postgres, so probe and skip if it already exists (idempotent
    // re-run safety; Wave 1 precedent in `AddWelperProfileVerified`).
    const enumExists = await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = 'user_account_selected_role'`,
    );
    if (!enumExists?.length) {
      await queryRunner.query(
        `CREATE TYPE "user_account_selected_role" AS ENUM ('customer', 'welper')`,
      );
    }

    const table = await queryRunner.getTable('user_accounts');

    if (!table?.findColumnByName('signup_completed')) {
      await queryRunner.addColumn(
        'user_accounts',
        new TableColumn({
          name: 'signup_completed',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );
    }

    if (!table?.findColumnByName('selected_role')) {
      await queryRunner.addColumn(
        'user_accounts',
        new TableColumn({
          name: 'selected_role',
          type: 'user_account_selected_role',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_accounts');
    if (table?.findColumnByName('selected_role')) {
      await queryRunner.dropColumn('user_accounts', 'selected_role');
    }
    if (table?.findColumnByName('signup_completed')) {
      await queryRunner.dropColumn('user_accounts', 'signup_completed');
    }
    // Drop the enum last (only when no column references it remain).
    await queryRunner.query(
      `DROP TYPE IF EXISTS "user_account_selected_role"`,
    );
  }
}
