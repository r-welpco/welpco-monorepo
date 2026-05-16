import type { Repository } from 'typeorm';
import { ServiceCategory } from '../../domains/content-management/entities';

/** Load an active level-2 category by canonical English name (matches SERVICE_CATEGORY_TAXONOMY + web i18n keys). */
export async function loadActiveSubcategory(
  repo: Repository<ServiceCategory>,
  name: string,
): Promise<ServiceCategory> {
  const row = await repo.findOne({
    where: { name, level: 2, isActive: true },
  });
  if (!row) {
    throw new Error(
      `Active subcategory "${name}" not found. Ensure syncServiceCategoryTaxonomy ran first.`,
    );
  }
  return row;
}

export async function loadActiveSubcategories(
  repo: Repository<ServiceCategory>,
  names: string[],
): Promise<ServiceCategory[]> {
  return Promise.all(names.map((name) => loadActiveSubcategory(repo, name)));
}
