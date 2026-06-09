import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayoutBatchActiveFridayIndex20260602000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payout_batches_active_friday"
      ON "payout_batches" ("payout_friday")
      WHERE "status" IN ('review', 'executing')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payout_batches_active_friday"`);
  }
}
