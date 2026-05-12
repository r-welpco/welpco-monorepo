import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Adds country_code, province_code for location filter/display and rating, review_count for search filter.
 */
export class AddWelperProfileCountryProvinceRating20260205000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('welper_profiles');

    if (!table?.findColumnByName('country_code')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'country_code',
          type: 'varchar',
          length: '2',
          isNullable: true,
        }),
      );
    }
    if (!table?.findColumnByName('province_code')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'province_code',
          type: 'varchar',
          length: '10',
          isNullable: true,
        }),
      );
    }
    if (!table?.findColumnByName('rating')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'rating',
          type: 'decimal',
          precision: 3,
          scale: 2,
          isNullable: true,
        }),
      );
    }
    if (!table?.findColumnByName('review_count')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'review_count',
          type: 'integer',
          default: '0',
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('welper_profiles', 'review_count');
    await queryRunner.dropColumn('welper_profiles', 'rating');
    await queryRunner.dropColumn('welper_profiles', 'province_code');
    await queryRunner.dropColumn('welper_profiles', 'country_code');
  }
}
