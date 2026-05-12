"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCancelBooking } from "@/lib/services/admin-booking-service";

export function BookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canCancel = ["pending", "accepted", "in_progress"].includes(status.toLowerCase().replace(/ /g, "_"));

  if (!canCancel) return null;

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) { setError("Reason is required."); return; }
    if (!confirm("Cancel this booking? This action cannot be undone.")) return;
    setError(null); setSuccess(null); setLoading(true);
    try {
      await adminCancelBooking(bookingId, reason.trim());
      setSuccess("Booking cancelled.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally { setLoading(false); }
  }

  return (
    <div className="admin-card" style={{ marginTop: "1.25rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Admin Actions</h2>
      <form onSubmit={handleCancel}>
        <div className="field">
          <label>Cancel reason</label>
          <textarea
            className="admin-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Why is this booking being cancelled?"
            required
          />
        </div>
        {error ? <p className="err">{error}</p> : null}
        {success ? <p className="ok">{success}</p> : null}
        <button type="submit" className="btn" disabled={loading} style={{ color: "var(--admin-danger, #e55)" }}>
          {loading ? "Cancelling..." : "Cancel booking"}
        </button>
      </form>
    </div>
  );
}
