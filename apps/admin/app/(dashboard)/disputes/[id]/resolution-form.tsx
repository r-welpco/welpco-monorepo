"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  createDisputeResolution,
  type CreateDisputeResolutionParams,
  type DisputeResolutionType,
  type DisputeItem,
} from "@/lib/services/dispute-service";

const RESOLUTION_TYPES: DisputeResolutionType[] = [
  "refund",
  "partial_refund",
  "warning",
  "no_action",
  "closed",
];

function formatMoneyMajor(cents: number, currency: string): string {
  const cur = currency.toUpperCase();
  return `${(cents / 100).toFixed(2)} ${cur}`;
}

export function ResolutionForm({
  disputeId,
  dispute,
}: {
  disputeId: string;
  dispute: DisputeItem;
}) {
  const router = useRouter();
  const [resolutionType, setResolutionType] = useState<DisputeResolutionType>("no_action");
  const [notes, setNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [bookingOutcome, setBookingOutcome] = useState<"completed" | "cancelled">("completed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const capturedHint = dispute.capturedPayment;
  const refundHelp = useMemo(() => {
    if (resolutionType === "refund") {
      return "Full refund: Stripe refunds each captured charge in full (hold + any receipt delta). Leave amount empty.";
    }
    if (resolutionType === "partial_refund") {
      const cap =
        capturedHint != null
          ? ` Max captured on file: ${formatMoneyMajor(capturedHint.totalCents, capturedHint.currency)}.`
          : "";
      return `Enter the refund in dollars (e.g. 25.00). The amount is applied to the most recent capture first, then earlier captures until the total is reached.${cap}`;
    }
    return null;
  }, [resolutionType, capturedHint]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (resolutionType === "partial_refund") {
      const n = Number.parseFloat(refundAmount);
      if (!Number.isFinite(n) || n <= 0) {
        setError("Partial refund requires a positive refund amount in dollars.");
        return;
      }
    }

    setLoading(true);
    try {
      const body: CreateDisputeResolutionParams = {
        resolutionType,
        notes: notes.trim() || undefined,
        bookingOutcome,
      };
      if (resolutionType === "partial_refund") {
        body.refundAmount = Number.parseFloat(refundAmount);
      }
      const res = await createDisputeResolution(disputeId, body);
      const sr = res.stripeRefund;
      let stripeLine = "";
      if (sr.status === "succeeded") {
        stripeLine = ` Stripe: refund succeeded (${sr.refundsCreated ?? 1} charge(s)).`;
      } else if (sr.status === "failed") {
        stripeLine = ` Stripe: refund failed — ${sr.message ?? "unknown error"}. Resolution is still saved; fix in Stripe or contact engineering.`;
      } else if (sr.status === "skipped") {
        stripeLine = ` Stripe: ${sr.message ?? "No captured payment to refund."}`;
      }
      setSuccess(
        `Resolution recorded. Booking ${res.bookingId.slice(0, 8)}… is now ${res.bookingStatus}.${stripeLine}`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit resolution");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-card" style={{ marginTop: "1.25rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Resolve dispute</h2>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="resolutionType">Resolution type</label>
          <select
            id="resolutionType"
            value={resolutionType}
            onChange={(e) => {
              setResolutionType(e.target.value as DisputeResolutionType);
              setError(null);
            }}
          >
            {RESOLUTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {refundHelp ? (
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "var(--admin-muted)" }}>
              {refundHelp}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="bookingOutcome">Booking outcome</label>
          <select
            id="bookingOutcome"
            value={bookingOutcome}
            onChange={(e) => setBookingOutcome(e.target.value as "completed" | "cancelled")}
          >
            <option value="completed">Mark booking completed</option>
            <option value="cancelled">Mark booking cancelled</option>
          </select>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem", color: "var(--admin-muted)" }}>
            Outcome updates the booking after resolution. Pair <strong>refund</strong> with{" "}
            <strong>cancelled</strong> when you are voiding the job.
          </p>
        </div>
        <div className="field">
          <label htmlFor="refundAmount">
            Refund amount ({resolutionType === "partial_refund" ? "required" : "optional"})
          </label>
          <input
            id="refundAmount"
            type="number"
            min={0}
            step="0.01"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder={resolutionType === "partial_refund" ? "e.g. 25.00" : "Leave empty for full refund"}
            disabled={resolutionType !== "refund" && resolutionType !== "partial_refund"}
            aria-required={resolutionType === "partial_refund"}
          />
        </div>
        <div className="field">
          <label htmlFor="notes">Internal notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Visible on resolution record; used as cancellation reason if booking is cancelled."
            rows={4}
          />
        </div>
        {error ? <p className="err">{error}</p> : null}
        {success ? <p className="ok">{success}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Submitting…" : "Submit resolution"}
        </button>
      </form>
    </div>
  );
}
