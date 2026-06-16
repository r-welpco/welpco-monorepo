"use client";

import {
  Button,
  Card,
  Flex,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Text,
  TextArea,
} from "@welpco/ui";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminErrorCallout, AdminSuccessCallout } from "@/components/admin-callout";
import { NativeFormField, nativeInputProps } from "@/components/native-form-field";
import {
  createDisputeResolution,
  type CreateDisputeResolutionParams,
  type DisputeResolutionType,
  type DisputeItem,
} from "@/lib/services/dispute-service";
import { formatAdminMoneyCents } from "@/lib/admin-format";

const RESOLUTION_TYPES: DisputeResolutionType[] = [
  "refund",
  "partial_refund",
  "warning",
  "no_action",
  "closed",
];

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
      return "Record a full-refund decision here, then issue the recommended refunds in Stripe Dashboard.";
    }
    if (resolutionType === "partial_refund") {
      const cap =
        capturedHint != null
          ? ` Max captured: ${formatAdminMoneyCents(capturedHint.totalCents, capturedHint.currency)}.`
          : "";
      return `Enter the decision amount in dollars. Welpco will recommend a latest-capture-first allocation for Stripe.${cap}`;
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
      const requiresStripe = res.stripeRefund.status === "pending";
      setSuccess(
        requiresStripe
          ? `Refund decision recorded. The booking remains disputed until Stripe confirms the refund${res.workflowStatus ? ` (${res.workflowStatus})` : ""}.`
          : `Resolution recorded. Booking ${res.bookingId.slice(0, 8)}... is now ${res.bookingStatus}.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit resolution");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card size="2" title="Resolve dispute">
      <form onSubmit={(e) => void onSubmit(e)}>
        <Flex direction="column" gap="4" style={{ maxWidth: 560 }}>
          <Flex direction="column" gap="1">
            <Text size="1" weight="medium">
              Resolution type
            </Text>
            <Select
              value={resolutionType}
              onValueChange={(v) => {
                setResolutionType(v as DisputeResolutionType);
                setError(null);
              }}
            >
              <SelectTrigger />
              <SelectContent>
                {RESOLUTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {refundHelp ? (
              <Text size="1" color="gray">
                {refundHelp}
              </Text>
            ) : null}
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="1" weight="medium">
              Booking outcome
            </Text>
            <Select
              value={bookingOutcome}
              onValueChange={(v) => setBookingOutcome(v as "completed" | "cancelled")}
            >
              <SelectTrigger />
              <SelectContent>
                <SelectItem value="completed">Mark booking completed</SelectItem>
                <SelectItem value="cancelled">Mark booking cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Text size="1" color="gray">
              Pair refund with cancelled when voiding the job.
            </Text>
          </Flex>

          <NativeFormField label={`Refund amount (${resolutionType === "partial_refund" ? "required" : "optional"})`}>
            <input
              type="number"
              min={0}
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={resolutionType === "partial_refund" ? "e.g. 25.00" : "Leave empty for full refund"}
              disabled={resolutionType !== "refund" && resolutionType !== "partial_refund"}
              aria-required={resolutionType === "partial_refund"}
              {...nativeInputProps()}
            />
          </NativeFormField>

          <Flex direction="column" gap="1">
            <Text size="1" weight="medium">
              Internal notes
            </Text>
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Visible on resolution record; used as cancellation reason if booking is cancelled."
              rows={4}
            />
          </Flex>

          {error ? <AdminErrorCallout message={error} /> : null}
          {success ? <AdminSuccessCallout message={success} /> : null}

          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : resolutionType.includes("refund") ? "Record refund decision" : "Submit resolution"}
          </Button>
        </Flex>
      </form>
    </Card>
  );
}
