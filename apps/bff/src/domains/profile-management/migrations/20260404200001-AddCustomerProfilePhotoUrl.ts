import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCustomerProfilePhotoUrl20260404200001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'customer_profiles',
      new TableColumn({
        name: 'profile_photo_url',
        type: 'varchar',
        length: '2048',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('customer_profiles', 'profile_photo_url');
  }
}
