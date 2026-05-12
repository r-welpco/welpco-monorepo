import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * GIN indexes for ILIKE text search on welper profiles and service offerings (pg_trgm).
 */
export class AddSearchTrgmIndexes20260404130001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_welper_profiles_first_name_trgm
      ON welper_profiles USING gin (first_name gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_welper_profiles_last_name_trgm
      ON welper_profiles USING gin (last_name gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_welper_profiles_bio_trgm
      ON welper_profiles USING gin (bio gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_service_offerings_desc_trgm
      ON service_offerings USING gin (service_description gin_trgm_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_service_offerings_desc_trgm');
    await queryRunner.query('DROP INDEX IF EXISTS idx_welper_profiles_bio_trgm');
    await queryRunner.query('DROP INDEX IF EXISTS idx_welper_profiles_last_name_trgm');
    await queryRunner.query('DROP INDEX IF EXISTS idx_welper_profiles_first_name_trgm');
  }
}
