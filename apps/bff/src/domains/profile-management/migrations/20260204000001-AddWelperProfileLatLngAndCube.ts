import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Adds latitude/longitude to welper_profiles for radius search.
 * Enables cube extension for earth_distance(). Backfills from service_area Point.
 */
export class AddWelperProfileLatLngAndCube20260204000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS cube');

    let table = await queryRunner.getTable('welper_profiles');
    if (!table?.findColumnByName('latitude')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'latitude',
          type: 'decimal',
          precision: 10,
          scale: 7,
          isNullable: true,
        }),
      );
    }
    table = await queryRunner.getTable('welper_profiles');
    if (!table?.findColumnByName('longitude')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'longitude',
          type: 'decimal',
          precision: 10,
          scale: 7,
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      UPDATE welper_profiles
      SET
        latitude = (service_area->'coordinates'->>1)::decimal(10,7),
        longitude = (service_area->'coordinates'->>0)::decimal(10,7)
      WHERE service_area IS NOT NULL
        AND service_area->>'type' = 'Point'
        AND jsonb_typeof(service_area->'coordinates') = 'array'
        AND jsonb_array_length(service_area->'coordinates') >= 2
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('welper_profiles', 'longitude');
    await queryRunner.dropColumn('welper_profiles', 'latitude');
    await queryRunner.query('DROP EXTENSION IF EXISTS cube');
  }
}
