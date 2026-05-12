import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddServiceOfferingsForeignKey20260124000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if foreign key already exists
    const table = await queryRunner.getTable('service_offerings');
    const existingFk = table?.foreignKeys.find(
      (fk) => fk.columnNames.includes('welper_id')
    );

    // Drop existing foreign key if it references the wrong column (id instead of welper_id)
    if (existingFk) {
      const referencesWelperId = existingFk.referencedColumnNames.includes('welper_id');
      if (!referencesWelperId) {
        // Drop the incorrect foreign key
        await queryRunner.dropForeignKey('service_offerings', existingFk);
      } else {
        // Foreign key is correct, no need to recreate
        return;
      }
    }

    // Create correct foreign key referencing welper_id (not id)
    await queryRunner.createForeignKey(
      'service_offerings',
      new TableForeignKey({
        columnNames: ['welper_id'],
        referencedTableName: 'welper_profiles',
        referencedColumnNames: ['welper_id'], // Reference welper_id, not id
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('service_offerings');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.includes('welper_id')
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('service_offerings', foreignKey);
    }
  }
}
