import type { BookingItem } from "@/lib/services/booking-service";

const PRE_COMPLETION_MESSAGING_STATUSES = new Set([
  "pending",
  "accepted",
  "in_progress",
  "disputed",
]);

function isWithinParticipantDeadline(booking: BookingItem): boolean {
  const deadline = booking.disputeReportDeadlineAt;
  if (!deadline) return false;
  return Date.now() <= new Date(deadline).getTime();
}

/** True when the participant may still open the report-a-problem flow. */
export function canReportDisputeForBooking(booking: BookingItem): boolean {
  if (booking.status === "in_progress") {
    return true;
  }
  return isWithinParticipantDeadline(booking);
}

/** True when the participant may still message the other party. */
export function canMessageBookingParticipant(booking: BookingItem): boolean {
  if (PRE_COMPLETION_MESSAGING_STATUSES.has(booking.status)) {
    return true;
  }
  return isWithinParticipantDeadline(booking);
}
