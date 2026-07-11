import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * SHARE-001 (BFF): welper portfolio photos with moderation state.
 *
 * Photos upload directly to S3 (presigned PUT, `portfolio/{welperId}/…`);
 * this table is the metadata + moderation queue. `status` is a varchar (not
 * a pg enum) per the dispute-domain convention: `pending | approved |
 * rejected`. The public profile only serves `approved` rows, ordered by
 * `sort_order` — hence the composite (welper_id, status, sort_order) index.
 */
export class CreateWelperPortfolioPhotosTable20260711000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('welper_portfolio_photos');
    if (existing) return;

    await queryRunner.createTable(
      new Table({
        name: 'welper_portfolio_photos',
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
            name: 'welper_id',
            type: 'uuid',
          },
          {
            name: 'offering_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 's3_key',
            type: 'varchar',
            length: '512',
          },
          {
            name: 'caption',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            default: "'pending'",
          },
          {
            name: 'rejection_reason',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'welper_portfolio_photos',
      new TableIndex({
        name: 'IDX_welper_portfolio_photos_welper_id',
        columnNames: ['welper_id'],
      }),
    );
    await queryRunner.createIndex(
      'welper_portfolio_photos',
      new TableIndex({
        name: 'IDX_welper_portfolio_photos_welper_status_sort',
        columnNames: ['welper_id', 'status', 'sort_order'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('welper_portfolio_photos', true);
  }
}
