import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

export class InitialSchema20260104004142 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create customer_profiles table
    await queryRunner.createTable(
      new Table({
        name: 'customer_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'first_name',
            type: 'varchar',
          },
          {
            name: 'last_name',
            type: 'varchar',
          },
          {
            name: 'phone_number',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'profile_completion_status',
            type: 'enum',
            enum: ['Incomplete', 'Complete'],
            default: "'Incomplete'",
          },
          {
            name: 'onboarding_completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create welper_profiles table
    await queryRunner.createTable(
      new Table({
        name: 'welper_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'welper_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'profile_photo_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'service_area',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'default_hourly_rate',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'profile_completion_status',
            type: 'enum',
            enum: ['Incomplete', 'Complete'],
            default: "'Incomplete'",
          },
          {
            name: 'profile_visibility',
            type: 'enum',
            enum: ['Public', 'Private'],
            default: "'Public'",
          },
          {
            name: 'onboarding_completed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create service_offerings table
    await queryRunner.createTable(
      new Table({
        name: 'service_offerings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'welper_id',
            type: 'uuid',
          },
          {
            name: 'service_category_id',
            type: 'uuid',
          },
          {
            name: 'service_description',
            type: 'text',
          },
          {
            name: 'hourly_rate',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'service_area',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create availability_calendars table
    await queryRunner.createTable(
      new Table({
        name: 'availability_calendars',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'welper_id',
            type: 'uuid',
          },
          {
            name: 'day_of_week',
            type: 'enum',
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          },
          {
            name: 'start_time',
            type: 'time',
          },
          {
            name: 'end_time',
            type: 'time',
          },
          {
            name: 'recurring_pattern',
            type: 'enum',
            enum: ['Daily', 'Weekly', 'Monthly'],
          },
          {
            name: 'available',
            type: 'boolean',
            default: true,
          },
          {
            name: 'effective_date_start',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'effective_date_end',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create availability_exceptions table
    await queryRunner.createTable(
      new Table({
        name: 'availability_exceptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'calendar_id',
            type: 'uuid',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'available',
            type: 'boolean',
          },
          {
            name: 'reason',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create favorite_welpers table
    await queryRunner.createTable(
      new Table({
        name: 'favorite_welpers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'customer_id',
            type: 'uuid',
          },
          {
            name: 'welper_id',
            type: 'uuid',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add unique constraint on favorite_welpers
    await queryRunner.createIndex(
      'favorite_welpers',
      new TableIndex({
        name: 'IDX_favorite_welpers_customer_welper',
        columnNames: ['customer_id', 'welper_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('favorite_welpers');
    await queryRunner.dropTable('availability_exceptions');
    await queryRunner.dropTable('availability_calendars');
    await queryRunner.dropTable('service_offerings');
    await queryRunner.dropTable('welper_profiles');
    await queryRunner.dropTable('customer_profiles');
  }
}

