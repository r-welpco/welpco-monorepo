/**
 * Subcategory names used by search / Quebec demo seeds.
 * Includes legacy aliases still present in `seed-content` until taxonomy fully replaces them.
 */
export const SEARCH_DEMO_SUBCATEGORY_NAMES = [
  'Babysitter',
  'Child Care',
  'Dog Walks',
  'Pet Sitting',
  'Pet-sitting',
  'Tutoring',
  'Housekeeping',
] as const;

/** Resolve the first matching active category by name (handles Pet Sitting vs Pet-sitting). */
export function pickSeedSubcategory<T extends { name: string }>(
  byName: Map<string, T>,
  preferredNames: string[],
  fallback: T,
): T {
  for (const name of preferredNames) {
    const hit = byName.get(name);
    if (hit) return hit;
  }
  return fallback;
}
