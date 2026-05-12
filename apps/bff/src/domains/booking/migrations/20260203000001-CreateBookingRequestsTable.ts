import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateBookingRequestsTable20260203000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'booking_requests',
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
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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
            name: 'service_offering_id',
            type: 'uuid',
          },
          {
            name: 'answers',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'pending'",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'booking_requests',
      new TableIndex({
        name: 'IDX_booking_requests_customer_id',
        columnNames: ['customer_id'],
      }),
    );
    await queryRunner.createIndex(
      'booking_requests',
      new TableIndex({
        name: 'IDX_booking_requests_welper_id',
        columnNames: ['welper_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('booking_requests', 'IDX_booking_requests_welper_id');
    await queryRunner.dropIndex('booking_requests', 'IDX_booking_requests_customer_id');
    await queryRunner.dropTable('booking_requests');
  }
}
