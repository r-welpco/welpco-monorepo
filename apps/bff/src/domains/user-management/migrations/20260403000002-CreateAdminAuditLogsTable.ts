import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAdminAuditLogsTable20260403000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'admin_audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'actor_user_id',
            type: 'uuid',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '128',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'admin_audit_logs',
      new TableIndex({
        name: 'IDX_admin_audit_logs_actor_user_id',
        columnNames: ['actor_user_id'],
      }),
    );
    await queryRunner.createIndex(
      'admin_audit_logs',
      new TableIndex({
        name: 'IDX_admin_audit_logs_action',
        columnNames: ['action'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('admin_audit_logs', 'IDX_admin_audit_logs_action');
    await queryRunner.dropIndex('admin_audit_logs', 'IDX_admin_audit_logs_actor_user_id');
    await queryRunner.dropTable('admin_audit_logs');
  }
}
