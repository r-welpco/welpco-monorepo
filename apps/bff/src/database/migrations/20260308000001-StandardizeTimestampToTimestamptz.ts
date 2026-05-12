import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Standardises all `timestamp` (without time zone) columns to `timestamptz`.
 *
 * Earlier migrations used plain `timestamp` for created_at / updated_at columns
 * while newer ones (booking lifecycle, notifications) already use `timestamptz`.
 * Running PostgreSQL with a single server timezone makes the two equivalent in
 * practice, but `timestamptz` is the recommended type because it stores the
 * value in UTC and converts on output according to the session's time zone,
 * eliminating an entire class of bugs when clients are in different time zones.
 *
 * The ALTER TYPE operation is metadata-only for timestamp→timestamptz in
 * PostgreSQL (no table rewrite), so it is safe and fast even on large tables.
 */
export class StandardizeTimestampToTimestamptz20260308000001 implements MigrationInterface {
  /** All (table, column) pairs that currently use `timestamp` and should be `timestamptz`. */
  private readonly columns: Array<[string, string]> = [
    // Booking
    ['booking_requests', 'created_at'],
    ['booking_requests', 'updated_at'],

    // Profile management
    ['customer_profiles', 'created_at'],
    ['customer_profiles', 'updated_at'],
    ['welper_profiles', 'created_at'],
    ['welper_profiles', 'updated_at'],
    ['service_offerings', 'created_at'],
    ['service_offerings', 'updated_at'],
    ['availability_calendars', 'created_at'],
    ['availability_calendars', 'updated_at'],
    ['availability_exceptions', 'created_at'],
    ['availability_exceptions', 'updated_at'],
    ['favorite_welpers', 'created_at'],
    ['favorite_welpers', 'updated_at'],
    ['holidays', 'created_at'],
    ['holidays', 'updated_at'],

    // Content management
    ['service_categories', 'created_at'],
    ['service_categories', 'updated_at'],
    ['questions', 'created_at'],
    ['questions', 'updated_at'],
    ['service_questions', 'created_at'],
    ['service_questions', 'updated_at'],
    ['static_content', 'published_date'],
    ['static_content', 'created_at'],
    ['static_content', 'updated_at'],
    ['faq_items', 'created_at'],
    ['faq_items', 'updated_at'],
    ['marketing_phrases', 'created_at'],
    ['marketing_phrases', 'updated_at'],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of this.columns) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE timestamptz USING "${column}" AT TIME ZONE 'UTC'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column] of this.columns) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE timestamp USING "${column}" AT TIME ZONE 'UTC'`,
      );
    }
  }
}
