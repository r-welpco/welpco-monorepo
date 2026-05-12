import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Wave 1 (BFF): Adds `service_area_postal_codes` JSONB column to welper_profiles.
 *
 * Stores an array of postal-code prefixes the welper serves
 * (e.g. ["M5V","M5W","M6G"]). Empty array / NULL means "any postal code in the city".
 *
 * Best-effort backfill: pulls postal codes out of the legacy serviceArea JSONB
 * when a recognisable shape is present (centerAddress.zipCode or .zipPostalCode);
 * otherwise leaves NULL for ops to fill in from welper input.
 */
export class AddWelperProfileServiceAreaPostalCodes20260424000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('welper_profiles');
    if (!table?.findColumnByName('service_area_postal_codes')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'service_area_postal_codes',
          type: 'jsonb',
          isNullable: true,
        }),
      );
    }

    // Backfill: lift a single postal-code prefix from the legacy centerAddress
    // shape into a 1-element array. We deliberately only handle the common
    // dashboard shape; anything more exotic is left for ops/welpers.
    await queryRunner.query(`
      UPDATE welper_profiles
      SET service_area_postal_codes = jsonb_build_array(
        UPPER(SUBSTRING(REGEXP_REPLACE(
          COALESCE(
            service_area->'centerAddress'->>'zipCode',
            service_area->'centerAddress'->>'zipPostalCode'
          ),
          '\\s+', '', 'g'
        ), 1, 3))
      )
      WHERE service_area IS NOT NULL
        AND service_area_postal_codes IS NULL
        AND COALESCE(
          service_area->'centerAddress'->>'zipCode',
          service_area->'centerAddress'->>'zipPostalCode'
        ) IS NOT NULL
        AND TRIM(COALESCE(
          service_area->'centerAddress'->>'zipCode',
          service_area->'centerAddress'->>'zipPostalCode'
        )) <> ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('welper_profiles', 'service_area_postal_codes');
  }
}
