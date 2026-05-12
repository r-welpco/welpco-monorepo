import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Wave 1 (BFF): Adds `verified` boolean column to welper_profiles.
 *
 * Defaults to false. Existing welpers stay unverified — bible §22.6 forbids
 * back-filling fake trust signals. Ops / a future KYC workflow flips this
 * field manually after identity checks.
 */
export class AddWelperProfileVerified20260424000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('welper_profiles');
    if (!table?.findColumnByName('verified')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'verified',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('welper_profiles', 'verified');
  }
}
