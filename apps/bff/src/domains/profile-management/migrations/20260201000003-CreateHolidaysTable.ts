import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateHolidaysTable20260201000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'holidays',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'country_code',
            type: 'varchar',
            length: '2',
          },
          {
            name: 'province_code',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: true,
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
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'holidays',
      new TableIndex({
        name: 'IDX_holidays_country_province',
        columnNames: ['country_code', 'province_code'],
      }),
    );
    await queryRunner.createIndex(
      'holidays',
      new TableIndex({
        name: 'IDX_holidays_date',
        columnNames: ['date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('holidays', 'IDX_holidays_date');
    await queryRunner.dropIndex('holidays', 'IDX_holidays_country_province');
    await queryRunner.dropTable('holidays');
  }
}
