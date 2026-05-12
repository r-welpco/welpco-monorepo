import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddBookingLifecycleColumns20260206000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('booking_requests', [
      // Scheduling
      new TableColumn({ name: 'scheduled_date', type: 'date', isNullable: true }),
      new TableColumn({ name: 'scheduled_start_time', type: 'time', isNullable: true }),
      new TableColumn({ name: 'scheduled_end_time', type: 'time', isNullable: true }),
      new TableColumn({ name: 'duration_minutes', type: 'int', isNullable: true }),

      // Pricing
      new TableColumn({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, isNullable: true }),
      new TableColumn({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, isNullable: true }),

      // Location & Notes
      new TableColumn({ name: 'address', type: 'jsonb', isNullable: true }),
      new TableColumn({ name: 'notes', type: 'text', isNullable: true }),

      // Cancellation
      new TableColumn({ name: 'cancellation_reason', type: 'text', isNullable: true }),
      new TableColumn({ name: 'cancelled_by', type: 'uuid', isNullable: true }),
      new TableColumn({ name: 'cancelled_at', type: 'timestamptz', isNullable: true }),

      // Decline
      new TableColumn({ name: 'decline_reason', type: 'text', isNullable: true }),

      // Lifecycle timestamps
      new TableColumn({ name: 'accepted_at', type: 'timestamptz', isNullable: true }),
      new TableColumn({ name: 'declined_at', type: 'timestamptz', isNullable: true }),
      new TableColumn({ name: 'checked_in_at', type: 'timestamptz', isNullable: true }),
      new TableColumn({ name: 'checked_out_at', type: 'timestamptz', isNullable: true }),
      new TableColumn({ name: 'completed_at', type: 'timestamptz', isNullable: true }),
    ]);

    // Indexes for common queries
    await queryRunner.createIndex(
      'booking_requests',
      new TableIndex({
        name: 'IDX_booking_requests_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'booking_requests',
      new TableIndex({
        name: 'IDX_booking_requests_scheduled_date',
        columnNames: ['scheduled_date'],
      }),
    );
    await queryRunner.createIndex(
      'booking_requests',
      new TableIndex({
        name: 'IDX_booking_requests_welper_date_status',
        columnNames: ['welper_id', 'scheduled_date', 'status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('booking_requests', 'IDX_booking_requests_welper_date_status');
    await queryRunner.dropIndex('booking_requests', 'IDX_booking_requests_scheduled_date');
    await queryRunner.dropIndex('booking_requests', 'IDX_booking_requests_status');

    const columns = [
      'scheduled_date', 'scheduled_start_time', 'scheduled_end_time', 'duration_minutes',
      'hourly_rate', 'total_price',
      'address', 'notes',
      'cancellation_reason', 'cancelled_by', 'cancelled_at',
      'decline_reason',
      'accepted_at', 'declined_at', 'checked_in_at', 'checked_out_at', 'completed_at',
    ];
    for (const col of columns) {
      await queryRunner.dropColumn('booking_requests', col);
    }
  }
}
