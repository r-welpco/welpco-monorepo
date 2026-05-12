import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBookingTimezoneAndConfirmedAt20260207000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('booking_requests', [
      new TableColumn({
        name: 'timezone_offset_minutes',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'confirmed_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('booking_requests', 'timezone_offset_minutes');
    await queryRunner.dropColumn('booking_requests', 'confirmed_at');
  }
}
