import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaxColumnsToBookingServiceReceipts20260528000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "booking_service_receipts"
      ADD COLUMN IF NOT EXISTS "subtotal_cents" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "booking_service_receipts"
      ADD COLUMN IF NOT EXISTS "tax_cents" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "booking_service_receipts"
      ADD COLUMN IF NOT EXISTS "tax_rate_bps" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "booking_service_receipts" DROP COLUMN IF EXISTS "tax_rate_bps"`);
    await queryRunner.query(`ALTER TABLE "booking_service_receipts" DROP COLUMN IF EXISTS "tax_cents"`);
    await queryRunner.query(`ALTER TABLE "booking_service_receipts" DROP COLUMN IF EXISTS "subtotal_cents"`);
  }
}

