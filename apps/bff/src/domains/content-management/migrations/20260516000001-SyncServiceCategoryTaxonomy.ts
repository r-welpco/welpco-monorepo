import { MigrationInterface, QueryRunner } from 'typeorm';
import { syncServiceCategoryTaxonomy } from '../../../database/seeds/sync-service-category-taxonomy';

/**
 * Aligns service_categories with the canonical Welpco taxonomy (8 parents +
 * subcategories). Safe to re-run: upserts by name and deactivates legacy rows.
 */
export class SyncServiceCategoryTaxonomy20260516000001
  implements MigrationInterface
{
  name = 'SyncServiceCategoryTaxonomy20260516000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await syncServiceCategoryTaxonomy(queryRunner.connection);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Non-destructive sync; no rollback.
  }
}
