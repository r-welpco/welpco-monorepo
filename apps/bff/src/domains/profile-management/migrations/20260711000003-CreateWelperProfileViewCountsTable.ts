import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * SHARE-005 (BFF): aggregate public-profile view counts by share channel.
 *
 * One row per (welper_id, src, day), incremented atomically via
 * `INSERT … ON CONFLICT (welper_id, src, day) DO UPDATE SET count = count+1`.
 * No PII by design: no IP, no user agent, no viewer id — just counts.
 */
export class CreateWelperProfileViewCountsTable20260711000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing = await queryRunner.getTable('welper_profile_view_counts');
    if (existing) return;

    await queryRunner.createTable(
      new Table({
        name: 'welper_profile_view_counts',
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
            name: 'src',
            type: 'varchar',
            length: '24',
          },
          {
            name: 'day',
            type: 'date',
          },
          {
            name: 'count',
            type: 'integer',
            default: 0,
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'welper_profile_view_counts',
      new TableIndex({
        name: 'UQ_welper_profile_view_counts_welper_src_day',
        columnNames: ['welper_id', 'src', 'day'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'welper_profile_view_counts',
      new TableIndex({
        name: 'IDX_welper_profile_view_counts_welper_day',
        columnNames: ['welper_id', 'day'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('welper_profile_view_counts', true);
  }
}
