import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateBookingPaymentsTable20260330000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'booking_payments',
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
            name: 'booking_id',
            type: 'uuid',
          },
          {
            name: 'customer_id',
            type: 'uuid',
          },
          {
            name: 'welper_id',
            type: 'uuid',
          },
          {
            name: 'stripe_payment_intent_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'amount_cents',
            type: 'integer',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'cad'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'pending'",
          },
          {
            name: 'capture_eligible_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'captured_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'booking_payments',
      new TableForeignKey({
        columnNames: ['booking_id'],
        referencedTableName: 'booking_requests',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'booking_payments',
      new TableIndex({
        name: 'IDX_booking_payments_capture_eligible',
        columnNames: ['capture_eligible_at'],
      }),
    );
    await queryRunner.createIndex(
      'booking_payments',
      new TableIndex({
        name: 'IDX_booking_payments_welper_id',
        columnNames: ['welper_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('booking_payments');
    const fk = table?.foreignKeys.find((f) => f.columnNames.includes('booking_id'));
    if (fk) await queryRunner.dropForeignKey('booking_payments', fk);
    await queryRunner.dropIndex('booking_payments', 'IDX_booking_payments_welper_id');
    await queryRunner.dropIndex('booking_payments', 'IDX_booking_payments_capture_eligible');
    await queryRunner.dropTable('booking_payments');
  }
}
