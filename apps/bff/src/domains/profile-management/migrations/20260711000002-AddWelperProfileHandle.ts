import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * SHARE-002 (BFF): vanity handle column on welper_profiles.
 *
 * Nullable (existing welpers have none until they claim one), unique,
 * stored lowercase — the claim endpoint normalizes + validates against
 * `^[a-z0-9][a-z0-9-]{2,29}$` and a reserved-words list before writing.
 */
export class AddWelperProfileHandle20260711000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('welper_profiles');
    if (!table?.findColumnByName('handle')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'handle',
          type: 'varchar',
          length: '30',
          isNullable: true,
        }),
      );
      await queryRunner.createIndex(
        'welper_profiles',
        new TableIndex({
          name: 'UQ_welper_profiles_handle',
          columnNames: ['handle'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('welper_profiles', 'UQ_welper_profiles_handle');
    await queryRunner.dropColumn('welper_profiles', 'handle');
  }
}
