/**
 * Canonical Welpco service category taxonomy (level-1 parent + level-2 subcategories).
 * Used by content seed, taxonomy sync, and migrations.
 */
export interface ServiceCategoryTaxonomyParent {
  name: string;
  description: string;
  subcategories: Array<{ name: string; description?: string }>;
}

export const SERVICE_CATEGORY_TAXONOMY: ServiceCategoryTaxonomyParent[] = [
  {
    name: 'Care',
    description: 'Childcare, elderly care, and special needs services',
    subcategories: [
      { name: 'Babysitter' },
      { name: 'Elderly Care' },
      { name: 'Special Needs' },
    ],
  },
  {
    name: 'Pet Care',
    description: 'Dog walks, grooming, pet sitting, and training',
    subcategories: [
      { name: 'Dog Walks' },
      { name: 'Pet Grooming' },
      { name: 'Pet Sitting' },
      {
        name: 'Aquarium and Terrarium Cleaning/Maintenance',
        description: 'Aquarium and terrarium cleaning and maintenance',
      },
      { name: 'Dog Training' },
    ],
  },
  {
    name: 'Learning & Lessons',
    description: 'Tutoring, music, cooking, and sports lessons',
    subcategories: [
      { name: 'Math Tutoring' },
      { name: 'French Tutoring' },
      { name: 'Spanish Tutoring' },
      { name: 'English Tutoring' },
      { name: 'Music Lessons' },
      { name: 'Cooking Lessons' },
      { name: 'Swimming Lessons' },
      { name: 'Basketball Lessons' },
    ],
  },
  {
    name: 'Exterior Maintenance',
    description: 'Lawn care, seasonal work, and outdoor property services',
    subcategories: [
      { name: 'Lawn Mowing' },
      { name: 'Tree Planting' },
      { name: 'Gardening' },
      { name: 'Car Washing' },
      { name: 'Window Cleaning' },
      { name: 'Exterior Property Cleaning' },
      { name: 'Snow Removal' },
      { name: 'Pool Opening/Closing' },
      { name: 'Summer/Winter Preparation' },
    ],
  },
  {
    name: 'Health & Wellness',
    description: 'Meal prep, fitness, wellness, and nutrition',
    subcategories: [
      { name: 'Meal Preparation' },
      { name: 'Personal Trainer' },
      { name: 'Wellness Support' },
      { name: 'Nutritionist' },
    ],
  },
  {
    name: 'Events & Hospitality',
    description: 'Catering, bartending, parties, and entertainment',
    subcategories: [
      { name: 'Catering Help' },
      { name: 'Bartending' },
      { name: 'Serving' },
      { name: 'Party Assistance' },
      { name: 'Entertainer' },
    ],
  },
  {
    name: 'Home Cleaning',
    description: 'Housekeeping and organizing',
    subcategories: [{ name: 'Housekeeping' }, { name: 'Organizing' }],
  },
  {
    name: 'Home Help',
    description: 'Assembly, mounting, repairs, moving, and organization',
    subcategories: [
      { name: 'Furniture Assembly' },
      { name: 'TV & Shelf Mounting' },
      { name: 'Smart Home Setup' },
      { name: 'Small Repairs' },
      { name: 'Appliance Installation' },
      { name: 'Moving Help' },
      { name: 'Heavy Lifting' },
      { name: 'Painting Touch-Ups' },
      { name: 'Picture Hanging' },
    ],
  },
];

/** All active taxonomy names (parents + subs) for deactivating legacy rows. */
export function getTaxonomyNameSet(): Set<string> {
  const names = new Set<string>();
  for (const parent of SERVICE_CATEGORY_TAXONOMY) {
    names.add(parent.name);
    for (const sub of parent.subcategories) {
      names.add(sub.name);
    }
  }
  return names;
}

/**
 * When subcategories are removed from the taxonomy, existing offerings are moved here.
 */
export const REMOVED_SUBCATEGORY_OFFERING_TARGET: Record<string, string> = {
  'Child Care': 'Babysitter',
  Tutoring: 'Math Tutoring',
  'Deep Cleaning': 'Housekeeping',
  Laundry: 'Housekeeping',
  'Move-In/Move-Out Cleaning': 'Housekeeping',
  'Gutter Cleaning': 'Lawn Mowing',
  'Leaf Cleanup': 'Lawn Mowing',
  'Home Organization': 'Organizing',
};
