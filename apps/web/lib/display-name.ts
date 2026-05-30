/** Customer-facing welper name: first name + last initial (e.g. "Jane D."). */
export function formatPublicWelperDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback = "Welper",
): string {
  const first = firstName?.trim();
  const last = lastName?.trim();
  if (first && last) {
    return `${first} ${last.charAt(0).toUpperCase()}.`;
  }
  if (first) return first;
  if (last) return `${last.charAt(0).toUpperCase()}.`;
  return fallback;
}

export function publicWelperDisplayName(
  profile: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null | undefined,
  fallback = "Welper",
): string {
  if (!profile) return fallback;
  const fromApi = profile.displayName?.trim();
  if (fromApi) return fromApi;
  return formatPublicWelperDisplayName(profile.firstName, profile.lastName, fallback);
}

/** Mask a search/API name string (e.g. "Jane Doe" → "Jane D."). Idempotent when already masked. */
export function maskCustomerWelperName(
  name: string | null | undefined,
  fallback = "Welper",
): string {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;
  if (/^[^\s]+ [A-Z]\.$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first} ${last.charAt(0).toUpperCase()}.`;
  }
  return trimmed;
}
