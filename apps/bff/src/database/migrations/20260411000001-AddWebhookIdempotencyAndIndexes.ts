import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 1. Creates processed_webhook_events table for Stripe webhook idempotency.
 * 2. Adds GIN indexes for full-text search on welper profiles and offerings.
 * 3. Adds composite indexes on booking_requests for common query patterns.
 */
export class AddWebhookIdempotencyAndIndexes20260411000001 implements MigrationInterface {
  /** CONCURRENTLY indexes cannot run inside a transaction. */
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Webhook idempotency table ---
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS processed_webhook_events (
        event_id VARCHAR(255) PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // --- pg_trgm extension (required for GIN trigram indexes) ---
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // --- Full-text search indexes for service discovery ---
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_welper_profiles_name_trgm
      ON welper_profiles USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_welper_profiles_bio_trgm
      ON welper_profiles USING gin (bio gin_trgm_ops);
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_offerings_desc_trgm
      ON service_offerings USING gin (service_description gin_trgm_ops);
    `);

    // --- Booking query indexes ---
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_requests_welper_status
      ON booking_requests (welper_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_requests_customer_status
      ON booking_requests (customer_id, status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_booking_requests_customer_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_booking_requests_welper_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_service_offerings_desc_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_welper_profiles_bio_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_welper_profiles_name_trgm;`);
    await queryRunner.query(`DROP TABLE IF EXISTS processed_webhook_events;`);
  }
}
