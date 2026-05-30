/** Customer-facing welper name: first name + last initial (e.g. "Jane D."). */
export function formatWelperDisplayNameForCustomer(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback = 'Welper',
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

/** Welper-facing customer name: first name + last initial (e.g. "Alex R."). */
export function formatCustomerDisplayNameForWelper(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback = 'Customer',
): string {
  return formatWelperDisplayNameForCustomer(firstName, lastName, fallback);
}
