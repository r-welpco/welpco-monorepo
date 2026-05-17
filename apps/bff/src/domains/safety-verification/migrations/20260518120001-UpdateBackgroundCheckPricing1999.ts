import { MigrationInterface, QueryRunner } from 'typeorm';

/** Background check fee: $19.99 CAD before tax (promo disabled). */
export class UpdateBackgroundCheckPricing199920251812001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO application_settings (key, value, description)
      VALUES
        ('background_check_list_price_cents', '1999', 'List price for welper background check (CAD cents, before tax)'),
        ('background_check_promo_price_cents', '1999', 'Promotional price for welper background check (CAD cents, before tax)'),
        ('background_check_promo_enabled', 'false', 'When true, charge promo price at signup')
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO application_settings (key, value, description)
      VALUES
        ('background_check_list_price_cents', '2599', 'List price for welper background check (CAD cents)'),
        ('background_check_promo_price_cents', '1599', 'Promotional price for welper background check (CAD cents)'),
        ('background_check_promo_enabled', 'true', 'When true, charge promo price at signup')
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
    `);
  }
}
