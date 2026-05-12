import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveConfirmedBookingStatus20260403000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "booking_requests" SET "status" = 'accepted' WHERE "status" = 'confirmed'`,
    );
    await queryRunner.dropColumn('booking_requests', 'confirmed_at');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_requests" ADD "confirmed_at" TIMESTAMPTZ`,
    );
    // Cannot reliably restore previous 'confirmed' rows
  }
}
