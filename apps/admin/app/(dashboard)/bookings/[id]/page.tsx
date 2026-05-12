import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBooking } from "@/lib/services/admin-booking-service";
import { BookingActions } from "./booking-actions";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let booking: Record<string, unknown>;
  try {
    booking = await getAdminBooking(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <p style={{ marginTop: 0 }}>
        <Link href="/bookings">← Booking lookup</Link>
      </p>
      <h1 style={{ marginBottom: "0.25rem" }}>Booking</h1>
      <p style={{ color: "var(--admin-muted)", fontFamily: "ui-monospace, monospace", fontSize: "0.9rem" }}>
        {String(booking.id ?? id)}
      </p>
      <div className="admin-card" style={{ marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Summary</h2>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
          {typeof booking.status === "string" ? (
            <li>
              <strong>Status:</strong> {booking.status}
            </li>
          ) : null}
          {typeof booking.customerId === "string" ? (
            <li>
              <strong>Customer:</strong>{" "}
              <Link href={`/users/${booking.customerId}`}>{booking.customerId}</Link>
            </li>
          ) : null}
          {typeof booking.welperId === "string" ? (
            <li>
              <strong>Welper:</strong> <Link href={`/users/${booking.welperId}`}>{booking.welperId}</Link>
            </li>
          ) : null}
          {booking.scheduledDate != null ? (
            <li>
              <strong>Scheduled:</strong> {String(booking.scheduledDate)}
            </li>
          ) : null}
          {booking.totalPrice != null ? (
            <li>
              <strong>Total price:</strong> {String(booking.totalPrice)}
            </li>
          ) : null}
          {booking.paymentPhase != null ? (
            <li>
              <strong>Payment phase:</strong> {String(booking.paymentPhase)}
            </li>
          ) : null}
        </ul>
      </div>
      <BookingActions bookingId={String(booking.id ?? id)} status={String(booking.status ?? "")} />
      <details className="admin-card" style={{ marginTop: "1rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Raw JSON</summary>
        <pre
          style={{
            marginTop: "0.75rem",
            fontSize: "0.75rem",
            overflow: "auto",
            maxHeight: "50vh",
            color: "var(--admin-muted)",
          }}
        >
          {JSON.stringify(booking, null, 2)}
        </pre>
      </details>
    </div>
  );
}
