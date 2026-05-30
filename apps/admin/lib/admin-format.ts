export function formatAdminDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

export function formatAdminDate(value: unknown): string {
  if (value == null || value === "") return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

export function formatAdminAddress(address: Record<string, string> | null | undefined): string {
  if (!address || typeof address !== "object") return "—";
  const parts = [
    address.line1 ?? address.street ?? address.addressLine1,
    address.line2 ?? address.addressLine2,
    [address.city, address.province ?? address.state, address.postalCode ?? address.zip]
      .filter(Boolean)
      .join(", "),
    address.country,
  ].filter((p): p is string => typeof p === "string" && p.trim().length > 0);
  return parts.length > 0 ? parts.join("\n") : "—";
}

export function formatAdminMoneyMajor(
  amount: number | null | undefined,
  currency = "CAD",
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
}

export function formatAdminMoneyCents(cents: number, currency: string): string {
  return formatAdminMoneyMajor(cents / 100, currency);
}

export function formatAdminStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function shortId(id: string, len = 8): string {
  return id.length > len ? `${id.slice(0, len)}…` : id;
}
