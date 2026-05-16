import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Gates dashboard access after signup during phased launch. Existing rows
 * default to true so seeds and pre-launch accounts keep access.
 */
export class AddPlatformAccessEnabled20260517000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_accounts');
    if (!table?.findColumnByName('platform_access_enabled')) {
      await queryRunner.addColumn(
        'user_accounts',
        new TableColumn({
          name: 'platform_access_enabled',
          type: 'boolean',
          default: true,
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_accounts');
    if (table?.findColumnByName('platform_access_enabled')) {
      await queryRunner.dropColumn('user_accounts', 'platform_access_enabled');
    }
  }
}
