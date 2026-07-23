import { MigrationInterface, QueryRunner } from 'typeorm';

export class ThreeDayCardAuthorization20260722000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "booking_requests"
      ADD COLUMN IF NOT EXISTS "timezone_name" varchar(64),
      ADD COLUMN IF NOT EXISTS "cancellation_source" varchar(48),
      ADD COLUMN IF NOT EXISTS "cancellation_fee_cents" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "payment_authorization_expires_at" timestamptz,
      ADD COLUMN IF NOT EXISTS "payment_authorization_risk_code" varchar(128)
    `);
    await queryRunner.query(`
      ALTER TABLE "booking_payments"
      ADD COLUMN IF NOT EXISTS "capture_reason" varchar(32),
      ADD COLUMN IF NOT EXISTS "authorization_expires_at" timestamptz,
      ADD COLUMN IF NOT EXISTS "stripe_charge_id" varchar(255),
      ADD COLUMN IF NOT EXISTS "card_brand" varchar(32)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_booking_authorization_expiry"
      ON "booking_requests" ("payment_authorization_expires_at", "payment_authorization_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_booking_authorization_expiry"`);
    await queryRunner.query(`
      ALTER TABLE "booking_payments"
      DROP COLUMN IF EXISTS "card_brand",
      DROP COLUMN IF EXISTS "stripe_charge_id",
      DROP COLUMN IF EXISTS "authorization_expires_at",
      DROP COLUMN IF EXISTS "capture_reason"
    `);
    await queryRunner.query(`
      ALTER TABLE "booking_requests"
      DROP COLUMN IF EXISTS "payment_authorization_risk_code",
      DROP COLUMN IF EXISTS "payment_authorization_expires_at",
      DROP COLUMN IF EXISTS "cancellation_fee_cents",
      DROP COLUMN IF EXISTS "cancellation_source",
      DROP COLUMN IF EXISTS "timezone_name"
    `);
  }
}
