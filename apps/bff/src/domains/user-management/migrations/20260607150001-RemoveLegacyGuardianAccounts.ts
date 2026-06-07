import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLegacyGuardianAccounts20260607150001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "guardian_accounts" CASCADE');
  }

  public async down(): Promise<void> {
    // Legacy guardian accounts are intentionally not recreated.
  }
}
