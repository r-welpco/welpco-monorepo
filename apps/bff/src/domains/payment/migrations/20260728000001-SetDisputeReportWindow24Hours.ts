import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Align problem-report / dispute window with marketing policy: 24 hours
 * after job completion (1440 minutes).
 */
export class SetDisputeReportWindow24Hours20260728000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO application_settings (key, value, description)
      VALUES (
        'dispute_report_window_minutes',
        '1440',
        'Minutes after booking completed_at during which a participant may report a problem (24 hours)'
      )
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO application_settings (key, value, description)
      VALUES (
        'dispute_report_window_minutes',
        '10',
        'Minutes after booking completed_at during which a participant may report a problem'
      )
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
    `);
  }
}
