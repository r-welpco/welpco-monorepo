import { BookingRequest, BookingRequestStatus } from './entities/booking-request.entity';

/** Default report window after completion (overridable via application settings). */
export const DISPUTE_REPORT_WINDOW_MINUTES_DEFAULT = 24 * 60;

const POST_COMPLETION_DISPUTE_STATUSES: ReadonlySet<BookingRequestStatus> = new Set([
  BookingRequestStatus.COMPLETED,
  BookingRequestStatus.PAYMENT_RELEASED,
  BookingRequestStatus.NO_SHOW,
]);

const PRE_COMPLETION_MESSAGING_STATUSES: ReadonlySet<BookingRequestStatus> = new Set([
  BookingRequestStatus.PENDING,
  BookingRequestStatus.ACCEPTED,
  BookingRequestStatus.IN_PROGRESS,
  BookingRequestStatus.DISPUTED,
]);

/** When the post-completion report window starts; null while service is in progress. */
export function getDisputeReportAnchorAt(booking: BookingRequest): Date | null {
  if (booking.status === BookingRequestStatus.IN_PROGRESS) {
    return null;
  }
  if (!POST_COMPLETION_DISPUTE_STATUSES.has(booking.status)) {
    return null;
  }
  return booking.completedAt ?? booking.updatedAt ?? null;
}

export function getDisputeReportDeadlineAt(
  booking: BookingRequest,
  windowMinutes: number,
): Date | null {
  const anchor = getDisputeReportAnchorAt(booking);
  if (!anchor) {
    return null;
  }
  return new Date(anchor.getTime() + windowMinutes * 60 * 1000);
}

export function isDisputeReportWindowOpen(
  booking: BookingRequest,
  windowMinutes: number,
  now: Date = new Date(),
): boolean {
  if (booking.status === BookingRequestStatus.IN_PROGRESS) {
    return true;
  }
  const deadline = getDisputeReportDeadlineAt(booking, windowMinutes);
  if (!deadline) {
    return false;
  }
  return now.getTime() <= deadline.getTime();
}

/** Messaging stays open before/during service and for the post-completion window. */
export function isBookingParticipantMessagingOpen(
  booking: BookingRequest,
  windowMinutes: number,
  now: Date = new Date(),
): boolean {
  if (PRE_COMPLETION_MESSAGING_STATUSES.has(booking.status)) {
    return true;
  }
  return isDisputeReportWindowOpen(booking, windowMinutes, now);
}
