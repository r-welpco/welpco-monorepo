import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerServicePreferences20260404130002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customer_profiles
      ADD COLUMN IF NOT EXISTS service_preferences jsonb NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customer_profiles
      DROP COLUMN IF EXISTS service_preferences
    `);
  }
}
