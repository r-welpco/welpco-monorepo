import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateApplicationSettingsTable20260330000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'application_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '128',
            isUnique: true,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.query(`
      INSERT INTO application_settings (key, value, description)
      VALUES (
        'payment_capture_delay_minutes',
        '30',
        'Minutes after booking completed_at before Stripe capture runs'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('application_settings');
  }
}
