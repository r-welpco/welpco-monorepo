import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateResolutionsTable20260318000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'resolutions',
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
            name: 'dispute_id',
            type: 'uuid',
          },
          {
            name: 'resolution_type',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'refund_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'resolved_by_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'resolved_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'resolutions',
      new TableIndex({
        name: 'UQ_resolutions_dispute_id',
        columnNames: ['dispute_id'],
        isUnique: true,
      }),
    );
    await queryRunner.createForeignKey(
      'resolutions',
      new TableForeignKey({
        columnNames: ['dispute_id'],
        referencedTableName: 'disputes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('resolutions');
    const fk = table?.foreignKeys.find((k) => k.columnNames.indexOf('dispute_id') !== -1);
    if (fk) await queryRunner.dropForeignKey('resolutions', fk);
    await queryRunner.dropIndex('resolutions', 'UQ_resolutions_dispute_id');
    await queryRunner.dropTable('resolutions');
  }
}
