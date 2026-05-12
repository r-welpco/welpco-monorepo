import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSubcategoryIdsToServiceOfferings20260125000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'service_offerings',
      new TableColumn({
        name: 'subcategory_ids',
        type: 'jsonb',
        isNullable: true,
        default: "'[]'::jsonb",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('service_offerings', 'subcategory_ids');
  }
}
