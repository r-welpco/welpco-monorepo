import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBookingPaymentRefundColumns20260413120001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('booking_payments', [
      new TableColumn({
        name: 'refunded_amount_cents',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fully_refunded_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('booking_payments', 'fully_refunded_at');
    await queryRunner.dropColumn('booking_payments', 'refunded_amount_cents');
  }
}
