import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class FixServiceOfferingsForeignKey20260124000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get existing foreign keys on service_offerings.welper_id
    const table = await queryRunner.getTable('service_offerings');
    const existingFks = table?.foreignKeys.filter(
      (fk) => fk.columnNames.includes('welper_id')
    ) || [];

    // Drop all existing foreign keys on welper_id (they might reference 'id' instead of 'welper_id')
    for (const fk of existingFks) {
      await queryRunner.dropForeignKey('service_offerings', fk);
    }

    // Create correct foreign key referencing welper_profiles.welper_id (not id)
    await queryRunner.createForeignKey(
      'service_offerings',
      new TableForeignKey({
        columnNames: ['welper_id'],
        referencedTableName: 'welper_profiles',
        referencedColumnNames: ['welper_id'], // Reference welper_id column, not id
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('service_offerings');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.includes('welper_id') && 
              fk.referencedColumnNames.includes('welper_id')
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('service_offerings', foreignKey);
    }
  }
}
