import type {
  WelperProfileDialogOffering,
  WelperProfileDialogProfile,
} from "@welpco/ui/platform";

function localizeOffering(
  offering: WelperProfileDialogOffering,
  categoryDisplayName: (englishName: string) => string,
): WelperProfileDialogOffering {
  return {
    ...offering,
    categoryName: categoryDisplayName(offering.categoryName),
    parentCategoryName: offering.parentCategoryName
      ? categoryDisplayName(offering.parentCategoryName)
      : offering.parentCategoryName,
    subcategories: offering.subcategories?.map((sub: { id: string; name: string }) => ({
      ...sub,
      name: categoryDisplayName(sub.name),
    })),
  };
}

/** Localize taxonomy names on a welper profile dialog payload (English DB → locale). */
export function localizeWelperDialogProfile(
  profile: WelperProfileDialogProfile | null,
  categoryDisplayName: (englishName: string) => string,
): WelperProfileDialogProfile | null {
  if (!profile) return null;
  return {
    ...profile,
    serviceOfferings: profile.serviceOfferings.map((offering: WelperProfileDialogOffering) =>
      localizeOffering(offering, categoryDisplayName),
    ),
  };
}
