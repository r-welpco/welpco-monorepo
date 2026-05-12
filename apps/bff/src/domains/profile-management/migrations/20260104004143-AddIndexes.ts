import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddIndexes20260104004143 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Customer profiles indexes
    await queryRunner.createIndex(
      'customer_profiles',
      new TableIndex({
        name: 'IDX_customer_profiles_customer_id',
        columnNames: ['customer_id'],
      }),
    );

    // Welper profiles indexes
    await queryRunner.createIndex(
      'welper_profiles',
      new TableIndex({
        name: 'IDX_welper_profiles_welper_id',
        columnNames: ['welper_id'],
      }),
    );

    await queryRunner.createIndex(
      'welper_profiles',
      new TableIndex({
        name: 'IDX_welper_profiles_profile_visibility',
        columnNames: ['profile_visibility'],
      }),
    );

    await queryRunner.createIndex(
      'welper_profiles',
      new TableIndex({
        name: 'IDX_welper_profiles_profile_completion_status',
        columnNames: ['profile_completion_status'],
      }),
    );

    // Service offerings indexes
    await queryRunner.createIndex(
      'service_offerings',
      new TableIndex({
        name: 'IDX_service_offerings_welper_id',
        columnNames: ['welper_id'],
      }),
    );

    await queryRunner.createIndex(
      'service_offerings',
      new TableIndex({
        name: 'IDX_service_offerings_service_category_id',
        columnNames: ['service_category_id'],
      }),
    );

    await queryRunner.createIndex(
      'service_offerings',
      new TableIndex({
        name: 'IDX_service_offerings_active',
        columnNames: ['active'],
      }),
    );

    await queryRunner.createIndex(
      'service_offerings',
      new TableIndex({
        name: 'IDX_service_offerings_welper_active',
        columnNames: ['welper_id', 'active'],
      }),
    );

    // Availability calendars indexes
    await queryRunner.createIndex(
      'availability_calendars',
      new TableIndex({
        name: 'IDX_availability_calendars_welper_id',
        columnNames: ['welper_id'],
      }),
    );

    await queryRunner.createIndex(
      'availability_calendars',
      new TableIndex({
        name: 'IDX_availability_calendars_day_of_week',
        columnNames: ['day_of_week'],
      }),
    );

    await queryRunner.createIndex(
      'availability_calendars',
      new TableIndex({
        name: 'IDX_availability_calendars_available',
        columnNames: ['available'],
      }),
    );

    await queryRunner.createIndex(
      'availability_calendars',
      new TableIndex({
        name: 'IDX_availability_calendars_welper_day',
        columnNames: ['welper_id', 'day_of_week'],
      }),
    );

    // Availability exceptions indexes
    await queryRunner.createIndex(
      'availability_exceptions',
      new TableIndex({
        name: 'IDX_availability_exceptions_calendar_id',
        columnNames: ['calendar_id'],
      }),
    );

    await queryRunner.createIndex(
      'availability_exceptions',
      new TableIndex({
        name: 'IDX_availability_exceptions_date',
        columnNames: ['date'],
      }),
    );

    await queryRunner.createIndex(
      'availability_exceptions',
      new TableIndex({
        name: 'IDX_availability_exceptions_calendar_date',
        columnNames: ['calendar_id', 'date'],
      }),
    );

    // Favorite welpers indexes
    await queryRunner.createIndex(
      'favorite_welpers',
      new TableIndex({
        name: 'IDX_favorite_welpers_customer_id',
        columnNames: ['customer_id'],
      }),
    );

    await queryRunner.createIndex(
      'favorite_welpers',
      new TableIndex({
        name: 'IDX_favorite_welpers_welper_id',
        columnNames: ['welper_id'],
      }),
    );

    await queryRunner.createIndex(
      'favorite_welpers',
      new TableIndex({
        name: 'IDX_favorite_welpers_customer_created',
        columnNames: ['customer_id', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('favorite_welpers', 'IDX_favorite_welpers_customer_created');
    await queryRunner.dropIndex('favorite_welpers', 'IDX_favorite_welpers_welper_id');
    await queryRunner.dropIndex('favorite_welpers', 'IDX_favorite_welpers_customer_id');
    await queryRunner.dropIndex('availability_exceptions', 'IDX_availability_exceptions_calendar_date');
    await queryRunner.dropIndex('availability_exceptions', 'IDX_availability_exceptions_date');
    await queryRunner.dropIndex('availability_exceptions', 'IDX_availability_exceptions_calendar_id');
    await queryRunner.dropIndex('availability_calendars', 'IDX_availability_calendars_welper_day');
    await queryRunner.dropIndex('availability_calendars', 'IDX_availability_calendars_available');
    await queryRunner.dropIndex('availability_calendars', 'IDX_availability_calendars_day_of_week');
    await queryRunner.dropIndex('availability_calendars', 'IDX_availability_calendars_welper_id');
    await queryRunner.dropIndex('service_offerings', 'IDX_service_offerings_welper_active');
    await queryRunner.dropIndex('service_offerings', 'IDX_service_offerings_active');
    await queryRunner.dropIndex('service_offerings', 'IDX_service_offerings_service_category_id');
    await queryRunner.dropIndex('service_offerings', 'IDX_service_offerings_welper_id');
    await queryRunner.dropIndex('welper_profiles', 'IDX_welper_profiles_profile_completion_status');
    await queryRunner.dropIndex('welper_profiles', 'IDX_welper_profiles_profile_visibility');
    await queryRunner.dropIndex('welper_profiles', 'IDX_welper_profiles_welper_id');
    await queryRunner.dropIndex('customer_profiles', 'IDX_customer_profiles_customer_id');
  }
}

