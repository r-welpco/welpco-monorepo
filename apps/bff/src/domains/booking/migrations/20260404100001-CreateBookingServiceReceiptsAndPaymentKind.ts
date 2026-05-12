import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';

export class CreateBookingServiceReceiptsAndPaymentKind20260404100001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "booking_payments"
      ADD COLUMN IF NOT EXISTS "payment_kind" varchar(32) NOT NULL DEFAULT 'hold'
    `);
    await queryRunner.query(`
      ALTER TABLE "booking_payments"
      ADD COLUMN IF NOT EXISTS "captured_amount_cents" integer NULL
    `);

    await queryRunner.createTable(
      new Table({
        name: 'booking_service_receipts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'created_at', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
          { name: 'booking_id', type: 'uuid' },
          { name: 'billing_check_in_at', type: 'timestamptz' },
          { name: 'billing_check_out_at', type: 'timestamptz' },
          { name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2 },
          { name: 'total_cents', type: 'integer' },
          { name: 'currency', type: 'varchar', length: '3', default: "'cad'" },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'confirmed_at', type: 'timestamptz' },
          { name: 'sent_to_customer_at', type: 'timestamptz', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'booking_service_receipts',
      new TableForeignKey({
        columnNames: ['booking_id'],
        referencedTableName: 'booking_requests',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'booking_service_receipts',
      new TableUnique({
        name: 'UQ_booking_service_receipts_booking_id',
        columnNames: ['booking_id'],
      }),
    );

    await queryRunner.createIndex(
      'booking_service_receipts',
      new TableIndex({
        name: 'IDX_booking_service_receipts_booking_id',
        columnNames: ['booking_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('booking_service_receipts', 'IDX_booking_service_receipts_booking_id');
    const receiptsTable = await queryRunner.getTable('booking_service_receipts');
    const uq = receiptsTable?.uniques.find((u) => u.name === 'UQ_booking_service_receipts_booking_id');
    if (uq) await queryRunner.dropUniqueConstraint('booking_service_receipts', uq);
    const fk = receiptsTable?.foreignKeys.find((f) => f.columnNames.includes('booking_id'));
    if (fk) await queryRunner.dropForeignKey('booking_service_receipts', fk);
    await queryRunner.dropTable('booking_service_receipts');

    await queryRunner.query(`ALTER TABLE "booking_payments" DROP COLUMN IF EXISTS "captured_amount_cents"`);
    await queryRunner.query(`ALTER TABLE "booking_payments" DROP COLUMN IF EXISTS "payment_kind"`);
  }
}
