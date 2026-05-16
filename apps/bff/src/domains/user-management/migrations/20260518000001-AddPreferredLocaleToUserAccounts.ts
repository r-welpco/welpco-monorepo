import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Stores the user's preferred language for transactional email (en | fr).
 */
export class AddPreferredLocaleToUserAccounts20260518000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_accounts');
    if (!table?.findColumnByName('preferred_locale')) {
      await queryRunner.addColumn(
        'user_accounts',
        new TableColumn({
          name: 'preferred_locale',
          type: 'varchar',
          length: '2',
          default: "'en'",
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_accounts');
    if (table?.findColumnByName('preferred_locale')) {
      await queryRunner.dropColumn('user_accounts', 'preferred_locale');
    }
  }
}
