"use client";

import { Button, Card, Flex, Text, TextArea } from "@welpco/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminErrorCallout, AdminSuccessCallout } from "@/components/admin-callout";
import {
  adminCancelBooking,
  refreshAdminBookingPayment,
} from "@/lib/services/admin-booking-service";

export function PaymentRefreshAction({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setMessage(null);
    try {
      await refreshAdminBookingPayment(bookingId);
      setMessage("Payment status refreshed from Stripe.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to refresh payment status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex direction="column" gap="1" align="start">
      <Button type="button" size="1" variant="soft" disabled={loading} onClick={() => void refresh()}>
        {loading ? "Refreshing…" : "Refresh from Stripe"}
      </Button>
      {message ? <Text size="1" color="gray">{message}</Text> : null}
    </Flex>
  );
}

export function BookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canCancel = ["pending", "accepted", "in_progress"].includes(
    status.toLowerCase().replace(/ /g, "_"),
  );

  if (!canCancel) return null;

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }
    if (!confirm("Cancel this booking? This action cannot be undone.")) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await adminCancelBooking(bookingId, reason.trim());
      setSuccess("Booking cancelled.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card size="2" title="Admin actions">
      <form onSubmit={(e) => void handleCancel(e)}>
        <Flex direction="column" gap="3" style={{ maxWidth: 520 }}>
          <Text size="2" color="gray">
            Cancel an active booking when support intervention is required. The reason is stored on
            the booking record.
          </Text>
          <Flex direction="column" gap="1">
            <Text size="1" weight="medium">
              Cancel reason
            </Text>
            <TextArea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this booking being cancelled?"
              required
            />
          </Flex>
          {error ? <AdminErrorCallout message={error} /> : null}
          {success ? <AdminSuccessCallout message={success} /> : null}
          <Button type="submit" color="red" variant="soft" disabled={loading}>
            {loading ? "Cancelling…" : "Cancel booking"}
          </Button>
        </Flex>
      </form>
    </Card>
  );
}
