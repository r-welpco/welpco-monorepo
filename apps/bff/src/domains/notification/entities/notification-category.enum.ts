export enum NotificationCategory {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  REVIEW = 'review',
  /**
   * NOTIFICATIONS-002 (Day 16 dispatch 2): chat-message arrival category.
   * Added alongside NOTIFICATIONS-001 so the message emitter has a category
   * that maps cleanly through the FE preferences matrix (already wired in
   * `apps/web/.../settings/page.tsx` CATEGORY_LABELS).
   */
  MESSAGE = 'message',
  /**
   * NOTIFICATIONS-001 (Day 16 dispatch 2): dispute lifecycle events
   * (created / status change / withdrawn). Distinct from `system` so users
   * can opt into dispute pings without being spammed by general updates.
   */
  DISPUTE = 'dispute',
  JOB = 'job',
  SECURITY = 'security',
  SYSTEM = 'system',
}
