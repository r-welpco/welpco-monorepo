import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddSupportTicketAssignmentColumns20260403120001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'support_tickets',
      new TableColumn({
        name: 'assigned_to_user_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'support_tickets',
      new TableColumn({
        name: 'internal_note',
        type: 'text',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      'support_tickets',
      new TableForeignKey({
        columnNames: ['assigned_to_user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_support_tickets_assigned_to_user',
      }),
    );
    await queryRunner.createIndex(
      'support_tickets',
      new TableIndex({
        name: 'IDX_support_tickets_assigned_to_user_id',
        columnNames: ['assigned_to_user_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('support_tickets', 'IDX_support_tickets_assigned_to_user_id');
    await queryRunner.dropForeignKey('support_tickets', 'FK_support_tickets_assigned_to_user');
    await queryRunner.dropColumn('support_tickets', 'internal_note');
    await queryRunner.dropColumn('support_tickets', 'assigned_to_user_id');
  }
}
