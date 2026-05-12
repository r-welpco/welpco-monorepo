import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSupportTicketsTable20260318000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'support_tickets',
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
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '32',
            default: "'other'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'varchar',
            length: '16',
            default: "'medium'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'open'",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'support_tickets',
      new TableIndex({
        name: 'IDX_support_tickets_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      'support_tickets',
      new TableIndex({
        name: 'IDX_support_tickets_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('support_tickets', 'IDX_support_tickets_status');
    await queryRunner.dropIndex('support_tickets', 'IDX_support_tickets_user_id');
    await queryRunner.dropTable('support_tickets');
  }
}
