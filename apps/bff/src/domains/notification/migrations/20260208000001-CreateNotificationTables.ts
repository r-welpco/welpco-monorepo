import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

export class CreateNotificationTables20260208000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
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
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'body',
            type: 'text',
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'read_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'notifications',
      new TableIndex({
        name: 'IDX_notifications_user_read_created',
        columnNames: ['user_id', 'is_read', 'created_at'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'notification_preferences',
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
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'category',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'email_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'in_app_enabled',
            type: 'boolean',
            default: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'notification_preferences',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createUniqueConstraint(
      'notification_preferences',
      new TableUnique({
        name: 'UQ_notification_preferences_user_category',
        columnNames: ['user_id', 'category'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notification_preferences', true);
    await queryRunner.dropTable('notifications', true);
  }
}
