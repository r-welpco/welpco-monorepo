import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Wave 1 (BFF): Adds `service_area_city` text column to welper_profiles.
 *
 * Backwards-compatible: nullable, populated only if the existing serviceArea
 * JSONB contains a usable city. The legacy `service_area` GeoJSON column is
 * left intact so search radius logic keeps working.
 */
export class AddWelperProfileServiceAreaCity20260424000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('welper_profiles');
    if (!table?.findColumnByName('service_area_city')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'service_area_city',
          type: 'varchar',
          length: '120',
          isNullable: true,
        }),
      );
    }

    // Best-effort backfill: pull a city string out of the legacy serviceArea
    // JSONB if it exposes one. Common shapes seen in the wild:
    //   { centerAddress: { city: "Toronto", ... }, ... }
    //   { city: "Toronto", ... }
    // Leave NULL otherwise; ops will backfill from welper input later.
    await queryRunner.query(`
      UPDATE welper_profiles
      SET service_area_city = COALESCE(
        NULLIF(TRIM(service_area->'centerAddress'->>'city'), ''),
        NULLIF(TRIM(service_area->>'city'), '')
      )
      WHERE service_area IS NOT NULL
        AND service_area_city IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('welper_profiles', 'service_area_city');
  }
}
