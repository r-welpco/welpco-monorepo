import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddWelperPayoutLedgerAndBatches20260601000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const bookingTable = await queryRunner.getTable('booking_requests');
    if (bookingTable && !bookingTable.findColumnByName('payment_released_at')) {
      await queryRunner.addColumn(
        'booking_requests',
        new TableColumn({
          name: 'payment_released_at',
          type: 'timestamptz',
          isNullable: true,
        }),
      );
    }

    const paymentsTable = await queryRunner.getTable('booking_payments');
    if (paymentsTable && !paymentsTable.findColumnByName('stripe_balance_transaction_id')) {
      await queryRunner.addColumn(
        'booking_payments',
        new TableColumn({
          name: 'stripe_balance_transaction_id',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
    if (paymentsTable && !paymentsTable.findColumnByName('stripe_fee_cents')) {
      await queryRunner.addColumn(
        'booking_payments',
        new TableColumn({
          name: 'stripe_fee_cents',
          type: 'integer',
          isNullable: true,
        }),
      );
    }

    await queryRunner.createTable(
      new Table({
        name: 'payout_batches',
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
            name: 'payout_friday',
            type: 'date',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'review'",
          },
          {
            name: 'total_welper_net_cents',
            type: 'integer',
            default: 0,
          },
          {
            name: 'total_platform_gross_cents',
            type: 'integer',
            default: 0,
          },
          {
            name: 'total_stripe_fee_cents',
            type: 'integer',
            default: 0,
          },
          {
            name: 'total_customer_captured_cents',
            type: 'integer',
            default: 0,
          },
          {
            name: 'booking_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'welper_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'approved_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'approved_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'executed_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'execution_summary',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'payout_batches',
      new TableIndex({
        name: 'IDX_payout_batches_payout_friday',
        columnNames: ['payout_friday'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'welper_payout_ledger',
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
            isUnique: true,
          },
          {
            name: 'welper_id',
            type: 'uuid',
          },
          {
            name: 'customer_id',
            type: 'uuid',
          },
          {
            name: 'payment_released_at',
            type: 'timestamptz',
          },
          {
            name: 'customer_subtotal_cents',
            type: 'integer',
          },
          {
            name: 'customer_tax_cents',
            type: 'integer',
          },
          {
            name: 'customer_total_cents',
            type: 'integer',
          },
          {
            name: 'welper_gross_cents',
            type: 'integer',
          },
          {
            name: 'welper_refund_cents',
            type: 'integer',
            default: 0,
          },
          {
            name: 'welper_net_cents',
            type: 'integer',
          },
          {
            name: 'platform_gross_cents',
            type: 'integer',
          },
          {
            name: 'stripe_fee_cents',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'pending'",
          },
          {
            name: 'exclusion_reason',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'payout_batch_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'stripe_transfer_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'welper_payout_ledger',
      new TableForeignKey({
        columnNames: ['booking_id'],
        referencedTableName: 'booking_requests',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'welper_payout_ledger',
      new TableForeignKey({
        columnNames: ['payout_batch_id'],
        referencedTableName: 'payout_batches',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'welper_payout_ledger',
      new TableIndex({
        name: 'IDX_welper_payout_ledger_welper_status',
        columnNames: ['welper_id', 'status'],
      }),
    );
    await queryRunner.createIndex(
      'welper_payout_ledger',
      new TableIndex({
        name: 'IDX_welper_payout_ledger_payment_released_at',
        columnNames: ['payment_released_at'],
      }),
    );
    await queryRunner.createIndex(
      'welper_payout_ledger',
      new TableIndex({
        name: 'IDX_welper_payout_ledger_payout_batch_id',
        columnNames: ['payout_batch_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('welper_payout_ledger', true);
    await queryRunner.dropTable('payout_batches', true);

    const paymentsTable = await queryRunner.getTable('booking_payments');
    if (paymentsTable?.findColumnByName('stripe_fee_cents')) {
      await queryRunner.dropColumn('booking_payments', 'stripe_fee_cents');
    }
    if (paymentsTable?.findColumnByName('stripe_balance_transaction_id')) {
      await queryRunner.dropColumn('booking_payments', 'stripe_balance_transaction_id');
    }

    const bookingTable = await queryRunner.getTable('booking_requests');
    if (bookingTable?.findColumnByName('payment_released_at')) {
      await queryRunner.dropColumn('booking_requests', 'payment_released_at');
    }
  }
}
