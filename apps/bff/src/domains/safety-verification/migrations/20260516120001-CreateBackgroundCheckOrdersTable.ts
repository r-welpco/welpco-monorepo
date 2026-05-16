import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateBackgroundCheckOrdersTable20260516120001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'background_check_orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'user_id', type: 'uuid', isNullable: false },
          {
            name: 'stripe_checkout_session_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'stripe_payment_intent_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'amount_cents', type: 'int', isNullable: false },
          { name: 'list_amount_cents', type: 'int', isNullable: false },
          { name: 'currency', type: 'varchar', length: '3', default: "'CAD'" },
          {
            name: 'payment_status',
            type: 'varchar',
            length: '32',
            default: "'pending'",
          },
          {
            name: 'certn_application_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'certn_status',
            type: 'varchar',
            length: '32',
            default: "'not_started'",
          },
          { name: 'certn_applicant_url', type: 'text', isNullable: true },
          { name: 'failure_reason', type: 'varchar', length: '500', isNullable: true },
          { name: 'paid_at', type: 'timestamptz', isNullable: true },
          { name: 'submitted_at', type: 'timestamptz', isNullable: true },
          { name: 'completed_at', type: 'timestamptz', isNullable: true },
          { name: 'expires_at', type: 'timestamptz', isNullable: true },
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
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'background_check_orders',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'background_check_orders',
      new TableIndex({
        name: 'IDX_background_check_orders_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'background_check_orders',
      new TableIndex({
        name: 'IDX_background_check_orders_stripe_checkout_session_id',
        columnNames: ['stripe_checkout_session_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('background_check_orders');
  }
}
