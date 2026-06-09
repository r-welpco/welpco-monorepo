import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserAuthVersion20260608000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_accounts');
    if (!table?.findColumnByName('auth_version')) {
      await queryRunner.addColumn(
        'user_accounts',
        new TableColumn({
          name: 'auth_version',
          type: 'integer',
          default: 0,
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_accounts');
    if (table?.findColumnByName('auth_version')) {
      await queryRunner.dropColumn('user_accounts', 'auth_version');
    }
  }
}
