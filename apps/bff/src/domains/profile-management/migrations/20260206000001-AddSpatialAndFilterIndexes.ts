import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds spatial index for radius queries and indexes for frequently filtered columns.
 * 
 * Performance improvements:
 * - Spatial index on ll_to_earth(latitude, longitude) for fast radius queries
 * - Composite indexes on frequently filtered columns
 */
export class AddSpatialAndFilterIndexes20260206000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure earthdistance extension is enabled (depends on cube which was enabled in 20260204000001)
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE');

    // Add spatial index for radius queries (GiST index on cube expression)
    // This dramatically improves performance for earth_distance queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_welper_profiles_location_cube
      ON welper_profiles USING gist(ll_to_earth(latitude::float8, longitude::float8))
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    // Add composite index for service_offerings category and active filters
    // Used in subquery: WHERE so2.service_category_id IN (:...categoryIds) AND so2.active = true
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_service_offerings_category_active
      ON service_offerings(service_category_id, active)
      WHERE active = true
    `);

    // Add composite index for welper_profiles status and visibility filters
    // Used in main query: WHERE profile_completion_status = :status AND profile_visibility = :visibility
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_welper_profiles_status_visibility
      ON welper_profiles(profile_completion_status, profile_visibility)
    `);

    // Add index on welper_profiles.created_at for default sort
    // Used when sort = 'relevance': ORDER BY p.created_at DESC
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_welper_profiles_created_at
      ON welper_profiles(created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_welper_profiles_location_cube');
    await queryRunner.query('DROP INDEX IF EXISTS idx_service_offerings_category_active');
    await queryRunner.query('DROP INDEX IF EXISTS idx_welper_profiles_status_visibility');
    await queryRunner.query('DROP INDEX IF EXISTS idx_welper_profiles_created_at');
  }
}
