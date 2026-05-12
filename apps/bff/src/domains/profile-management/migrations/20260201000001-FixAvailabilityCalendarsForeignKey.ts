import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

/**
 * Fix availability_calendars.welper_id FK to reference welper_profiles.welper_id (not id).
 * We store the user id in welper_id; it must reference welper_profiles.welper_id, not the row id.
 */
export class FixAvailabilityCalendarsForeignKey20260201000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('availability_calendars');
    const existingFks = table?.foreignKeys.filter(
      (fk) => fk.columnNames.includes('welper_id')
    ) || [];

    for (const fk of existingFks) {
      await queryRunner.dropForeignKey('availability_calendars', fk);
    }

    await queryRunner.createForeignKey(
      'availability_calendars',
      new TableForeignKey({
        columnNames: ['welper_id'],
        referencedTableName: 'welper_profiles',
        referencedColumnNames: ['welper_id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('availability_calendars');
    const foreignKey = table?.foreignKeys.find(
      (fk) =>
        fk.columnNames.includes('welper_id') &&
        fk.referencedColumnNames.includes('welper_id')
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('availability_calendars', foreignKey);
    }
  }
}
