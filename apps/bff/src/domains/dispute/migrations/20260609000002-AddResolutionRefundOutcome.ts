import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResolutionRefundOutcome20260609000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resolutions"
      ADD COLUMN IF NOT EXISTS "refund_status" varchar(32),
      ADD COLUMN IF NOT EXISTS "refund_message" text,
      ADD COLUMN IF NOT EXISTS "refunds_created" integer,
      ADD COLUMN IF NOT EXISTS "refund_attempted_at" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "resolutions"
      DROP COLUMN IF EXISTS "refund_attempted_at",
      DROP COLUMN IF EXISTS "refunds_created",
      DROP COLUMN IF EXISTS "refund_message",
      DROP COLUMN IF EXISTS "refund_status"
    `);
  }
}
