import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeTaxCalculationIds20260530120001 implements MigrationInterface {
  name = 'AddStripeTaxCalculationIds20260530120001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "booking_requests"
      ADD COLUMN IF NOT EXISTS "hold_stripe_tax_calculation_id" varchar(255) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "booking_service_receipts"
      ADD COLUMN IF NOT EXISTS "stripe_tax_calculation_id" varchar(255) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "booking_service_receipts"
      DROP COLUMN IF EXISTS "stripe_tax_calculation_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "booking_requests"
      DROP COLUMN IF EXISTS "hold_stripe_tax_calculation_id"
    `);
  }
}
