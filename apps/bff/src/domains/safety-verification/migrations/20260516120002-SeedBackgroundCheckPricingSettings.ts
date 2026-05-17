import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBackgroundCheckPricingSettings20260516120002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO application_settings (key, value, description)
      VALUES
        ('background_check_list_price_cents', '1999', 'List price for welper background check (CAD cents, before tax)'),
        ('background_check_promo_price_cents', '1999', 'Promotional price for welper background check (CAD cents, before tax)'),
        ('background_check_promo_enabled', 'false', 'When true, charge promo price at signup')
      ON CONFLICT (key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM application_settings
      WHERE key IN (
        'background_check_list_price_cents',
        'background_check_promo_price_cents',
        'background_check_promo_enabled'
      )
    `);
  }
}
