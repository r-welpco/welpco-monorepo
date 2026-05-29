import { DataSource } from 'typeorm';
import { ServiceOffering } from '../../domains/profile-management/entities/service-offering.entity';
import { ServiceCategory } from '../../domains/content-management/entities/service-category.entity';

/**
 * Default subcategory (level 2) name to use when a level-1 category has no
 * subcategories linked by parentId (e.g. legacy or partial content seed).
 * Matches seed-content.ts hierarchy.
 */
const LEVEL1_TO_DEFAULT_SUBCATEGORY_NAME: Record<string, string> = {
  Care: 'Babysitter',
  'Pet Care': 'Dog Walks',
  'Learning & Lessons': 'Math Tutoring',
  Education: 'Math Tutoring',
  'Exterior Maintenance': 'Lawn Mowing',
  'Health & Wellness': 'Meal Preparation',
  'Events & Hospitality': 'Catering Help',
  Entertainment: 'Catering Help',
  'Home Cleaning': 'Housekeeping',
  'Home Help': 'Furniture Assembly',
  'In-Home Maintenance': 'Housekeeping',
};

/**
 * Fixes service offerings that point to level-1 (parent) categories.
 * Offerings must point to subcategories (level 2) so that questions and
 * "subcategory · category" display work. This step reassigns any offering
 * whose serviceCategoryId is a level-1 category to a subcategory:
 * first by parentId lookup, then by fallback to a default subcategory by name.
 * Run after seedContent and seedSearchDemo so existing or legacy data is corrected.
 */
export async function seedFixOfferingCategories(dataSource: DataSource): Promise<void> {
  const categoryRepo = dataSource.getRepository(ServiceCategory);
  const offeringRepo = dataSource.getRepository(ServiceOffering);

  const level1Categories = await categoryRepo.find({
    where: { level: 1, isActive: true },
    select: ['id', 'name'],
  });
  if (level1Categories.length === 0) return;

  const level1Ids = new Set(level1Categories.map((c) => c.id));
  const level1ByName = new Map(level1Categories.map((c) => [c.id, c.name]));

  const offerings = await offeringRepo.find({
    select: ['id', 'welperId', 'serviceCategoryId'],
  });
  const invalidOfferings = offerings.filter((o) => level1Ids.has(o.serviceCategoryId));
  if (invalidOfferings.length === 0) {
    return;
  }

  // Load all level-2 categories with parentId for lookup
  const subcategories = await categoryRepo.find({
    where: { level: 2, isActive: true },
    select: ['id', 'parentId', 'name', 'displayOrder'],
    order: { parentId: 'ASC', displayOrder: 'ASC' },
  });

  // For each level-1 id, first subcategory (by displayOrder) under that parent
  const firstSubcategoryByParentId = new Map<string, { id: string; name: string }>();
  for (const sub of subcategories) {
    if (sub.parentId && !firstSubcategoryByParentId.has(sub.parentId)) {
      firstSubcategoryByParentId.set(sub.parentId, { id: sub.id, name: sub.name });
    }
  }

  // Fallback: subcategory by name (when parent has no children linked by parentId, e.g. legacy data)
  const subcategoryByName = new Map<string, { id: string; name: string }>();
  for (const sub of subcategories) {
    if (!subcategoryByName.has(sub.name)) {
      subcategoryByName.set(sub.name, { id: sub.id, name: sub.name });
    }
  }

  // Last resort: use first available subcategory when no named default exists (e.g. content not fully seeded)
  const firstAnySubcategory =
    subcategories.length > 0 ? { id: subcategories[0].id, name: subcategories[0].name } : null;

  let updated = 0;
  for (const offering of invalidOfferings) {
    const parentId = offering.serviceCategoryId;
    const parentName = level1ByName.get(parentId) ?? '';
    let fallback = firstSubcategoryByParentId.get(parentId);
    if (!fallback && parentName) {
      const defaultSubName = LEVEL1_TO_DEFAULT_SUBCATEGORY_NAME[parentName];
      if (defaultSubName) {
        fallback = subcategoryByName.get(defaultSubName) ?? undefined;
      }
    }
    if (!fallback && firstAnySubcategory) {
      fallback = firstAnySubcategory;
      console.warn(
        `   ⚠ Offering ${offering.id} pointed to level-1 "${parentName || parentId}"; reassigning to subcategory "${fallback.name}" (no better match).`,
      );
    }
    if (!fallback) {
      console.warn(
        `   ⚠ Offering ${offering.id} points to level-1 category "${parentName || parentId}"; no subcategories in DB; skipping.`,
      );
      continue;
    }
    offering.serviceCategoryId = fallback.id;
    await offeringRepo.save(offering);
    updated++;
  }

  if (updated > 0) {
    console.log(`   ✅ Fixed ${updated} service offering(s) that were assigned to level-1 categories (reassigned to subcategories).`);
  }
}
