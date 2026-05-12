import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserAccountStatusModerationColumns20260405100001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('user_accounts', [
      new TableColumn({
        name: 'status_changed_at',
        type: 'timestamptz',
        isNullable: true,
      }),
      new TableColumn({
        name: 'status_changed_by_admin_id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'status_change_reason_code',
        type: 'varchar',
        length: '64',
        isNullable: true,
      }),
      new TableColumn({
        name: 'status_change_reason_detail',
        type: 'text',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_accounts', 'status_change_reason_detail');
    await queryRunner.dropColumn('user_accounts', 'status_change_reason_code');
    await queryRunner.dropColumn('user_accounts', 'status_changed_by_admin_id');
    await queryRunner.dropColumn('user_accounts', 'status_changed_at');
  }
}
