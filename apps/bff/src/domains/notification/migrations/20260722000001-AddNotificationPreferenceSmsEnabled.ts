import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddNotificationPreferenceSmsEnabled20260722000001
  implements MigrationInterface
{
  name = 'AddNotificationPreferenceSmsEnabled20260722000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('notification_preferences');
    if (!table?.findColumnByName('sms_enabled')) {
      await queryRunner.addColumn(
        'notification_preferences',
        new TableColumn({
          name: 'sms_enabled',
          type: 'boolean',
          default: true,
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('notification_preferences');
    if (table?.findColumnByName('sms_enabled')) {
      await queryRunner.dropColumn('notification_preferences', 'sms_enabled');
    }
  }
}
