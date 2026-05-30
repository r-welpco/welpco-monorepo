/** Privacy-safe welper name: first name + last initial (e.g. "Jane D."). */
export function customerWelperDisplayName(
  profile: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null
  | undefined,
  fallback = "Welper",
): string {
  const fromApi = profile?.displayName?.trim();
  if (fromApi) return fromApi;
  const first = profile?.firstName?.trim();
  const last = profile?.lastName?.trim();
  if (first && last) return `${first} ${last.charAt(0).toUpperCase()}.`;
  if (first) return first;
  if (last) return `${last.charAt(0).toUpperCase()}.`;
  return fallback;
}
