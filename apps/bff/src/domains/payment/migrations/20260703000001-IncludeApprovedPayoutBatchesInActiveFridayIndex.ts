import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncludeApprovedPayoutBatchesInActiveFridayIndex20260703000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payout_batches_active_friday"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_payout_batches_active_friday"
      ON "payout_batches" ("payout_friday")
      WHERE "status" IN ('review', 'approved', 'executing')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payout_batches_active_friday"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_payout_batches_active_friday"
      ON "payout_batches" ("payout_friday")
      WHERE "status" IN ('review', 'executing')
    `);
  }
}
