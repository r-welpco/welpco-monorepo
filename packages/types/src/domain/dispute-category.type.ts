/**
 * DISPUTES-002 (Day 16): single source of truth for dispute categories.
 *
 * The BFF `disputes.category` column stores these values verbatim — they drive
 * T&S workflow routing, admin queue filters, and the dispute audit trail. The
 * FE `<DisputeForm>` Select submits the same string, so the round-trip is 1:1
 * with no lossy mapping in between.
 *
 * Adding a value: add it here, extend the BFF DTO `IsIn` whitelist
 * (`apps/bff/src/domains/dispute/dto/create-dispute.dto.ts`), update the entity
 * column doc-string, add a label below, and (where relevant) a copy-block for
 * any category-specific UX (today only `safety` has one — see DisputeForm).
 *
 * Bible §22.6 — categories are part of the trust contract: the user has to be
 * able to honestly describe what happened. Don't add cute marketing labels;
 * say what's actually escalating.
 */
export type DisputeCategory =
  | 'no_show'
  | 'quality'
  | 'overcharge'
  | 'safety'
  | 'other';

/** Ordered tuple suitable for runtime validation (matches BFF DTO whitelist). */
export const DISPUTE_CATEGORIES = [
  'no_show',
  'quality',
  'overcharge',
  'safety',
  'other',
] as const satisfies ReadonlyArray<DisputeCategory>;

/**
 * Human-readable labels per Bible §22 voice (warm, direct, no jargon). The FE
 * `<DisputeForm>` Select renders these; the value submitted is still the enum
 * string. Order intentionally puts severity-of-impact first
 * (no-show > quality > overcharge), with safety highlighted via a copy block,
 * other last as the catch-all.
 */
export const DISPUTE_CATEGORY_LABELS: Record<DisputeCategory, string> = {
  no_show: "Welper didn't show up",
  quality: 'Service quality',
  overcharge: 'Overcharged or unexpected fees',
  safety: 'Safety concern',
  other: 'Something else',
};

/** Customer-facing labels for the dispute form (default reporter perspective). */
export const DISPUTE_CATEGORY_LABELS_CUSTOMER = DISPUTE_CATEGORY_LABELS;

/** Welper-facing labels — same enum values, perspective flipped where needed. */
export const DISPUTE_CATEGORY_LABELS_WELPER: Record<DisputeCategory, string> = {
  no_show: "Customer didn't show up",
  quality: 'Scope or job expectations',
  overcharge: 'Payment or pricing issue',
  safety: 'Safety concern',
  other: 'Something else',
};

export type DisputeReporterRole = 'customer' | 'welper';

export function getDisputeCategoryLabels(
  role: DisputeReporterRole,
): Record<DisputeCategory, string> {
  return role === 'welper' ? DISPUTE_CATEGORY_LABELS_WELPER : DISPUTE_CATEGORY_LABELS_CUSTOMER;
}
