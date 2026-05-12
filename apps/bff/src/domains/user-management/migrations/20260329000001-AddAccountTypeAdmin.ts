import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Extends the PostgreSQL enum for user_accounts.account_type with Admin.
 * TypeORM typically names this enum user_accounts_account_type_enum.
 */
export class AddAccountTypeAdmin20260329000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "user_accounts_account_type_enum" ADD VALUE IF NOT EXISTS 'Admin'`,
    );
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot drop a single enum value safely in a portable way.
  }
}
