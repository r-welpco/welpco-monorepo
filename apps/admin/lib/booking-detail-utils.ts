import type { AdminTimelineEvent } from "@/components/admin-timeline";
import type { AdminBookingDetail } from "@/lib/services/admin-booking-service";

export function buildBookingTimeline(booking: AdminBookingDetail): AdminTimelineEvent[] {
  const events: AdminTimelineEvent[] = [
    { id: "created", label: "Created", timestamp: booking.createdAt ?? null },
  ];

  if (booking.acceptedAt) {
    events.push({ id: "accepted", label: "Accepted", timestamp: booking.acceptedAt });
  }
  if (booking.checkedInAt) {
    events.push({ id: "checkedIn", label: "Checked in", timestamp: booking.checkedInAt });
  }
  if (booking.checkedOutAt) {
    events.push({ id: "checkedOut", label: "Checked out", timestamp: booking.checkedOutAt });
  }
  if (booking.serviceReceipt) {
    const receiptAt =
      booking.serviceReceipt.sentToCustomerAt ?? booking.serviceReceipt.confirmedAt ?? null;
    events.push({ id: "receiptSent", label: "Receipt sent", timestamp: receiptAt });
  }
  if (booking.completedAt) {
    events.push({
      id: "completed",
      label: "Completed",
      timestamp: booking.completedAt,
      tone: "success",
    });
  }
  if (booking.cancelledAt) {
    events.push({
      id: "cancelled",
      label: "Cancelled",
      timestamp: booking.cancelledAt,
      tone: "danger",
    });
  }
  if (booking.declinedAt) {
    events.push({
      id: "declined",
      label: "Declined",
      timestamp: booking.declinedAt,
      tone: "danger",
    });
  }

  return events.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return ta - tb;
  });
}

export function formatScheduleWindow(booking: AdminBookingDetail): string {
  const date = booking.scheduledDate;
  const start = booking.scheduledStartTime;
  const end = booking.scheduledEndTime;
  if (!date && !start && !end) return "—";
  const parts = [date ?? null, start && end ? `${start} – ${end}` : start ?? end ?? null].filter(
    Boolean,
  );
  return parts.join(" · ");
}
