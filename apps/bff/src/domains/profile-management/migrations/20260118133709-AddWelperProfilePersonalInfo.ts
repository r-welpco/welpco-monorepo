import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWelperProfilePersonalInfo20260118133709 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('welper_profiles');
    
    // Check if columns already exist before adding
    const hasFirstName = table?.findColumnByName('first_name');
    const hasLastName = table?.findColumnByName('last_name');
    const hasPhoneNumber = table?.findColumnByName('phone_number');

    // Add firstName column to welper_profiles if it doesn't exist
    if (!hasFirstName) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'first_name',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
    }

    // Add lastName column to welper_profiles if it doesn't exist
    if (!hasLastName) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'last_name',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
    }

    // Add phoneNumber column to welper_profiles if it doesn't exist
    if (!hasPhoneNumber) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'phone_number',
          type: 'jsonb',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove phoneNumber column
    await queryRunner.dropColumn('welper_profiles', 'phone_number');

    // Remove lastName column
    await queryRunner.dropColumn('welper_profiles', 'last_name');

    // Remove firstName column
    await queryRunner.dropColumn('welper_profiles', 'first_name');
  }
}
