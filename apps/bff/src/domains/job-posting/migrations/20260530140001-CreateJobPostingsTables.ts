import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

export class CreateJobPostingsTables20260530140001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'job_postings',
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
          { name: 'customer_id', type: 'uuid' },
          { name: 'category_id', type: 'uuid' },
          { name: 'subcategory_id', type: 'uuid' },
          { name: 'service_question_category_id', type: 'uuid' },
          { name: 'answers', type: 'jsonb', default: "'{}'::jsonb" },
          { name: 'title', type: 'varchar', length: '200' },
          { name: 'description', type: 'text' },
          { name: 'scheduled_date', type: 'date' },
          { name: 'scheduled_start_time', type: 'time' },
          { name: 'scheduled_end_time', type: 'time' },
          { name: 'duration_minutes', type: 'int' },
          { name: 'location_address', type: 'varchar', length: '500' },
          { name: 'location_lat', type: 'decimal', precision: 10, scale: 7, isNullable: true },
          { name: 'location_lng', type: 'decimal', precision: 10, scale: 7, isNullable: true },
          { name: 'location_city', type: 'varchar', length: '120', isNullable: true },
          { name: 'location_region', type: 'varchar', length: '120', isNullable: true },
          { name: 'status', type: 'varchar', length: '32', default: "'published'" },
          { name: 'application_count', type: 'int', default: 0 },
          { name: 'max_applications', type: 'int', default: 20 },
          { name: 'expires_at', type: 'timestamptz' },
          { name: 'booking_id', type: 'uuid', isNullable: true },
          { name: 'published_at', type: 'timestamptz', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'job_postings',
      new TableIndex({ name: 'IDX_job_postings_customer_id', columnNames: ['customer_id'] }),
    );
    await queryRunner.createIndex(
      'job_postings',
      new TableIndex({ name: 'IDX_job_postings_status', columnNames: ['status'] }),
    );
    await queryRunner.createIndex(
      'job_postings',
      new TableIndex({ name: 'IDX_job_postings_subcategory_id', columnNames: ['subcategory_id'] }),
    );
    await queryRunner.createIndex(
      'job_postings',
      new TableIndex({ name: 'IDX_job_postings_expires_at', columnNames: ['expires_at'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'job_applications',
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
          { name: 'job_posting_id', type: 'uuid' },
          { name: 'welper_id', type: 'uuid' },
          { name: 'offering_id', type: 'uuid' },
          { name: 'proposal_message', type: 'text' },
          { name: 'status', type: 'varchar', length: '32', default: "'pending'" },
          {
            name: 'hourly_rate_snapshot',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'job_applications',
      new TableIndex({ name: 'IDX_job_applications_job_posting_id', columnNames: ['job_posting_id'] }),
    );
    await queryRunner.createIndex(
      'job_applications',
      new TableIndex({ name: 'IDX_job_applications_welper_id', columnNames: ['welper_id'] }),
    );
    await queryRunner.createUniqueConstraint(
      'job_applications',
      new TableUnique({
        name: 'UQ_job_applications_job_welper',
        columnNames: ['job_posting_id', 'welper_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('job_applications');
    await queryRunner.dropTable('job_postings');
  }
}
