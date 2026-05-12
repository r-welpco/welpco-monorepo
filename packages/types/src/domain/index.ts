// Domain types
export type UserRole = 'customer' | 'welper' | 'admin' | 'guardian';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'declined';

export type PaymentStatus =
  | 'authorized'
  | 'held'
  | 'released'
  | 'refunded'
  | 'failed';

/**
 * Wave 2 (BFF): added `withdrawn` for participant-initiated withdrawal.
 * Note the BFF's API status uses `in-review` (hyphen) and `withdrawn`; the
 * legacy `under-review` / `dismissed` aliases stay for backward compat with
 * older client code that hasn't migrated.
 */
export type DisputeStatus =
  | 'open'
  | 'in-review'
  | 'under-review'
  | 'resolved'
  | 'dismissed'
  | 'closed'
  | 'escalated'
  | 'withdrawn';

export type ReviewStatus =
  | 'pending'
  | 'published'
  | 'flagged'
  | 'removed';

export type NotificationStatus =
  | 'unread'
  | 'read'
  | 'dismissed';

// Export shared domain types
export * from './address.type';
export * from './geojson.type';
export * from './phone.type';
export * from './error-codes.enum';
export * from './service-area-info.type';
export * from './evidence-file.type';
export * from './dispute-evidence.type';
export * from './dispute-category.type';
export * from './signup-state.type';
