/**
 * Transform flat category list into hierarchical options for display.
 * Optimized for performance - single pass through the data.
 * 
 * @param categories - Flat list of categories with id, name, parentId
 * @returns Array of options with parents followed by their children
 */
export function transformCategoriesToOptions(
  categories: Array<{ id: string; name: string; parentId?: string | null }> | null | undefined
): Array<{ id: string; name: string }> {
  if (!categories || !Array.isArray(categories)) return [];
  
  // Build a map for quick lookup and separate roots from children
  const categoryMap = new Map<string, { id: string; name: string; parentId?: string | null }>();
  const roots: typeof categories = [];
  const childrenByParent = new Map<string, typeof categories>();
  
  for (const cat of categories) {
    categoryMap.set(cat.id, cat);
    
    if (!cat.parentId) {
      roots.push(cat);
    } else {
      const siblings = childrenByParent.get(cat.parentId) || [];
      siblings.push(cat);
      childrenByParent.set(cat.parentId, siblings);
    }
  }
  
  // Build the final options array: each root followed by its children
  const options: Array<{ id: string; name: string }> = [];
  
  for (const root of roots) {
    options.push({ id: root.id, name: root.name });
    
    const children = childrenByParent.get(root.id);
    if (children) {
      for (const child of children) {
        options.push({
          id: child.id,
          name: `${root.name} · ${child.name}`,
        });
      }
    }
  }
  
  return options;
}

const CATEGORY_OPTION_SEP = " · ";

/** Localize a flat or composite ("Parent · Sub") category option label. */
export function localizeCategoryOptionLabel(
  displayName: (englishName: string) => string,
  optionName: string,
): string {
  if (!optionName.includes(CATEGORY_OPTION_SEP)) {
    return displayName(optionName);
  }
  const [parent, child] = optionName.split(CATEGORY_OPTION_SEP).map((part) => part.trim());
  return `${displayName(parent)}${CATEGORY_OPTION_SEP}${displayName(child)}`;
}

/** Localized service offering line (subcategory · parent or single category). */
export function formatOfferingCategoryLabel(
  offering: { categoryName: string; parentCategoryName?: string | null },
  displayName: (englishName: string) => string,
): string {
  if (offering.parentCategoryName) {
    return `${displayName(offering.categoryName)}${CATEGORY_OPTION_SEP}${displayName(offering.parentCategoryName)}`;
  }
  return displayName(offering.categoryName);
}

/** Apply taxonomy display names to sidebar/select category options. */
export function localizeCategoryOptions(
  options: Array<{ id: string; name: string }>,
  displayName: (englishName: string) => string,
): Array<{ id: string; name: string }> {
  return options.map((option) => ({
    id: option.id,
    name: localizeCategoryOptionLabel(displayName, option.name),
  }));
}

/**
 * Validate if a categoryId exists in the category options.
 * 
 * @param categoryId - The category ID to validate
 * @param categoryOptions - List of valid category options
 * @returns The categoryId if valid, undefined otherwise
 */
export function validateCategoryId(
  categoryId: string | undefined,
  categoryOptions: Array<{ id: string }> | undefined
): string | undefined {
  if (!categoryId) return undefined;
  if (!categoryOptions || categoryOptions.length === 0) return categoryId;
  
  const found = categoryOptions.some((c) => c.id === categoryId);
  return found ? categoryId : undefined;
}
