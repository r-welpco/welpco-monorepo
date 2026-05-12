import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDisputesTable20260318000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'disputes',
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
            name: 'filer_id',
            type: 'uuid',
          },
          {
            name: 'filer_type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            default: "'open'",
          },
          {
            name: 'evidence',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_booking_id',
        columnNames: ['booking_id'],
      }),
    );
    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_filer_id',
        columnNames: ['filer_id'],
      }),
    );
    await queryRunner.createIndex(
      'disputes',
      new TableIndex({
        name: 'IDX_disputes_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('disputes', 'IDX_disputes_status');
    await queryRunner.dropIndex('disputes', 'IDX_disputes_filer_id');
    await queryRunner.dropIndex('disputes', 'IDX_disputes_booking_id');
    await queryRunner.dropTable('disputes');
  }
}
