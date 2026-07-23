export function isCustomerRole(role: string | null | undefined): boolean {
  return role?.toLowerCase() === "customer";
}

export function getSearchDestination(
  publicSearchHref: string,
  role: string | null | undefined,
): string {
  if (!isCustomerRole(role)) {
    return publicSearchHref;
  }

  if (
    publicSearchHref === "/search" ||
    publicSearchHref.startsWith("/search?") ||
    publicSearchHref.startsWith("/search#")
  ) {
    return `/dashboard/search${publicSearchHref.slice("/search".length)}`;
  }

  return publicSearchHref;
}
