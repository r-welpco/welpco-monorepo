import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enables the pg_trgm extension for fuzzy/autocomplete search.
 * Used by PostgreSQL full-text + pg_trgm search strategy (migration plan 03).
 * Safe to run multiple times: CREATE EXTENSION IF NOT EXISTS.
 */
export class EnablePgTrgmExtension20260130000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm`);
  }
}
