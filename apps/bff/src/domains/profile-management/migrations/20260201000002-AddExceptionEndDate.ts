import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExceptionEndDate20260201000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('availability_exceptions');
    const hasEndDate = table?.columns.some((c) => c.name === 'end_date');
    if (!hasEndDate) {
      await queryRunner.addColumn(
        'availability_exceptions',
        new TableColumn({
          name: 'end_date',
          type: 'date',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('availability_exceptions', 'end_date');
  }
}
