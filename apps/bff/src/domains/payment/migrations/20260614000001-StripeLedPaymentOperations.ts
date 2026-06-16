import { MigrationInterface, QueryRunner } from 'typeorm';

export class StripeLedPaymentOperations20260614000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "booking_requests"
      ADD COLUMN IF NOT EXISTS "payment_authorization_status" varchar(32),
      ADD COLUMN IF NOT EXISTS "payment_authorization_scheduled_at" timestamptz,
      ADD COLUMN IF NOT EXISTS "payment_authorization_due_at" timestamptz,
      ADD COLUMN IF NOT EXISTS "payment_authorization_deadline_at" timestamptz,
      ADD COLUMN IF NOT EXISTS "payment_authorization_last_attempt_at" timestamptz,
      ADD COLUMN IF NOT EXISTS "payment_authorization_attempt_count" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "payment_authorization_failure_code" varchar(128),
      ADD COLUMN IF NOT EXISTS "payment_authorization_failure_message" text,
      ADD COLUMN IF NOT EXISTS "payment_authorization_lease_until" timestamptz
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_booking_authorization_due"
      ON "booking_requests" ("payment_authorization_due_at", "payment_authorization_status")
    `);

    await queryRunner.query(`
      ALTER TABLE "booking_service_receipts"
      ADD COLUMN IF NOT EXISTS "stripe_tax_transaction_id" varchar(255),
      ADD COLUMN IF NOT EXISTS "stripe_tax_transaction_status" varchar(32),
      ADD COLUMN IF NOT EXISTS "stripe_tax_transaction_error" text
    `);

    await queryRunner.query(`
      ALTER TABLE "resolutions"
      ADD COLUMN IF NOT EXISTS "workflow_status" varchar(32) NOT NULL DEFAULT 'completed',
      ADD COLUMN IF NOT EXISTS "refund_baseline_cents" integer,
      ADD COLUMN IF NOT EXISTS "refund_target_cents" integer,
      ADD COLUMN IF NOT EXISTS "refund_confirmed_cents" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "pending_booking_outcome" varchar(32),
      ADD COLUMN IF NOT EXISTS "refund_exception" text,
      ADD COLUMN IF NOT EXISTS "recommended_refund_allocation" jsonb,
      ADD COLUMN IF NOT EXISTS "stripe_last_synced_at" timestamptz
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "booking_refunds" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "booking_id" uuid NOT NULL REFERENCES "booking_requests"("id") ON DELETE CASCADE,
        "resolution_id" uuid REFERENCES "resolutions"("id") ON DELETE SET NULL,
        "stripe_refund_id" varchar(255) NOT NULL UNIQUE,
        "stripe_charge_id" varchar(255) NOT NULL,
        "stripe_payment_intent_id" varchar(255) NOT NULL,
        "amount_cents" integer NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'cad',
        "status" varchar(32) NOT NULL,
        "failure_reason" text,
        "initiated_at" timestamptz,
        "succeeded_at" timestamptz,
        "tax_reversal_status" varchar(32),
        "stripe_tax_reversal_id" varchar(255),
        "tax_reversal_error" text
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_booking_refunds_booking" ON "booking_refunds" ("booking_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_booking_refunds_resolution" ON "booking_refunds" ("resolution_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_recovery_tasks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "booking_id" uuid NOT NULL REFERENCES "booking_requests"("id") ON DELETE CASCADE,
        "resolution_id" uuid NOT NULL UNIQUE REFERENCES "resolutions"("id") ON DELETE CASCADE,
        "stripe_transfer_id" varchar(255) NOT NULL,
        "required_reversal_cents" integer NOT NULL,
        "recovered_cents" integer NOT NULL DEFAULT 0,
        "status" varchar(32) NOT NULL DEFAULT 'open',
        "stripe_dashboard_url" text NOT NULL,
        "exception_message" text,
        "completed_at" timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_recovery_transfer_status"
      ON "payment_recovery_tasks" ("stripe_transfer_id", "status")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stripe_transfer_states" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "stripe_transfer_id" varchar(255) NOT NULL UNIQUE,
        "amount_cents" integer NOT NULL,
        "amount_reversed_cents" integer NOT NULL DEFAULT 0,
        "destination_account_id" varchar(255),
        "payout_batch_id" uuid,
        "welper_id" uuid,
        "last_event_at" timestamptz
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "stripe_transfer_states"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_recovery_tasks"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "booking_refunds"`);
    await queryRunner.query(`
      ALTER TABLE "resolutions"
      DROP COLUMN IF EXISTS "stripe_last_synced_at",
      DROP COLUMN IF EXISTS "recommended_refund_allocation",
      DROP COLUMN IF EXISTS "refund_exception",
      DROP COLUMN IF EXISTS "pending_booking_outcome",
      DROP COLUMN IF EXISTS "refund_confirmed_cents",
      DROP COLUMN IF EXISTS "refund_target_cents",
      DROP COLUMN IF EXISTS "refund_baseline_cents",
      DROP COLUMN IF EXISTS "workflow_status"
    `);
    await queryRunner.query(`
      ALTER TABLE "booking_service_receipts"
      DROP COLUMN IF EXISTS "stripe_tax_transaction_error",
      DROP COLUMN IF EXISTS "stripe_tax_transaction_status",
      DROP COLUMN IF EXISTS "stripe_tax_transaction_id"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_booking_authorization_due"`);
    await queryRunner.query(`
      ALTER TABLE "booking_requests"
      DROP COLUMN IF EXISTS "payment_authorization_lease_until",
      DROP COLUMN IF EXISTS "payment_authorization_failure_message",
      DROP COLUMN IF EXISTS "payment_authorization_failure_code",
      DROP COLUMN IF EXISTS "payment_authorization_attempt_count",
      DROP COLUMN IF EXISTS "payment_authorization_last_attempt_at",
      DROP COLUMN IF EXISTS "payment_authorization_deadline_at",
      DROP COLUMN IF EXISTS "payment_authorization_due_at",
      DROP COLUMN IF EXISTS "payment_authorization_scheduled_at",
      DROP COLUMN IF EXISTS "payment_authorization_status"
    `);
  }
}
