import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateReviewsTable20260317000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'reviews',
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
            name: 'reviewer_id',
            type: 'uuid',
          },
          {
            name: 'reviewee_id',
            type: 'uuid',
          },
          {
            name: 'reviewer_type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'rating',
            type: 'smallint',
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        name: 'UQ_reviews_booking_id_reviewer_id',
        columnNames: ['booking_id', 'reviewer_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        name: 'IDX_reviews_reviewee_id',
        columnNames: ['reviewee_id'],
      }),
    );
    await queryRunner.createIndex(
      'reviews',
      new TableIndex({
        name: 'IDX_reviews_booking_id',
        columnNames: ['booking_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('reviews', 'IDX_reviews_booking_id');
    await queryRunner.dropIndex('reviews', 'IDX_reviews_reviewee_id');
    await queryRunner.dropIndex('reviews', 'UQ_reviews_booking_id_reviewer_id');
    await queryRunner.dropTable('reviews');
  }
}
