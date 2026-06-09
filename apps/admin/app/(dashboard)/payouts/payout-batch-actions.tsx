"use client";

import { Button, Flex, Text } from "@welpco/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminErrorCallout, AdminSuccessCallout } from "@/components/admin-callout";
import { approvePayoutBatch, buildPayoutBatch, refreshPendingPayoutFees } from "@/lib/services/admin-payouts-service";
import { formatAdminMoneyCents } from "@/lib/admin-format";

export function PayoutBuildAction({
  payoutFriday,
  existingBatchId,
  existingBatchStatus,
}: {
  payoutFriday: string;
  existingBatchId: string | null;
  existingBatchStatus: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onBuild() {
    setError(null);
    setLoading(true);
    try {
      const batch = await buildPayoutBatch(payoutFriday);
      router.push(`/payouts/${batch.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to build batch");
    } finally {
      setLoading(false);
    }
  }

  const canBuild = !existingBatchId || existingBatchStatus === "review";

  return (
    <Flex direction="column" gap="2">
      {error ? <AdminErrorCallout message={error} /> : null}
      <Flex gap="2" align="center" wrap="wrap">
        <Button type="button" disabled={loading || !canBuild} onClick={() => void onBuild()}>
          {existingBatchId ? "Refresh batch" : "Build batch"}
        </Button>
        {existingBatchId ? (
          <Text size="2" color="gray">
            Existing batch:{" "}
            <a href={`/payouts/${existingBatchId}`} style={{ color: "inherit" }}>
              {existingBatchId.slice(0, 8)}…
            </a>{" "}
            ({existingBatchStatus ?? "unknown"})
          </Text>
        ) : null}
        {!canBuild ? (
          <Text size="2" color="gray">
            Batch is already approved or executing and cannot be rebuilt.
          </Text>
        ) : null}
      </Flex>
    </Flex>
  );
}

export function PayoutFeeRefreshAction() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const result = await refreshPendingPayoutFees();
      setMessage(
        `Checked ${result.scanned} pending line(s); ${result.recovered} recovered, ${result.stillPending} still pending.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fee refresh failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex direction="column" gap="2" align="start">
      {error ? <AdminErrorCallout message={error} /> : null}
      {message ? <AdminSuccessCallout message={message} /> : null}
      <Button type="button" variant="soft" disabled={loading} onClick={() => void refresh()}>
        {loading ? "Refreshing..." : "Refresh pending Stripe fees"}
      </Button>
    </Flex>
  );
}

export function PayoutApproveAction({
  batchId,
  status,
  totalWelperNetCents,
  welperCount,
  blockedWelpers,
}: {
  batchId: string;
  status: string;
  totalWelperNetCents: number;
  welperCount: number;
  blockedWelpers: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canApprove = status === "review" && blockedWelpers === 0 && totalWelperNetCents > 0;

  async function onApprove() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const batch = await approvePayoutBatch(batchId);
      const summary = batch.executionSummary as
        | {
            transfers?: Array<{
              welperId: string;
              transferId?: string;
              error?: string;
            }>;
          }
        | null
        | undefined;
      const transfers = summary?.transfers ?? [];
      const succeeded = transfers.filter((t) => t.transferId && !t.error).length;
      const failed = transfers.filter((t) => t.error).length;
      if (batch.status === "partial") {
        setSuccess(`Batch partial: ${succeeded} transfer(s) succeeded, ${failed} failed. Review details below.`);
      } else if (batch.status === "failed") {
        setSuccess(`Batch failed: no transfers completed (${failed} failure(s)).`);
      } else {
        setSuccess(`Batch ${batch.status}: ${succeeded} transfer(s) completed.`);
      }
      setConfirmOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex direction="column" gap="2">
      {error ? <AdminErrorCallout message={error} /> : null}
      {success ? <AdminSuccessCallout message={success} /> : null}
      {blockedWelpers > 0 ? (
        <AdminErrorCallout
          message={`${blockedWelpers} welper(s) are missing Stripe Connect — resolve before approving.`}
        />
      ) : null}
      {!confirmOpen ? (
        <Button type="button" disabled={!canApprove || loading} onClick={() => setConfirmOpen(true)}>
          Approve &amp; Transfer
        </Button>
      ) : (
        <Flex direction="column" gap="2" className="admin-card" style={{ padding: "1rem", maxWidth: 480 }}>
          <Text weight="medium">Confirm Stripe transfers</Text>
          <Text size="2" color="gray">
            Transfer {formatAdminMoneyCents(totalWelperNetCents, "CAD")} to {welperCount} welper
            {welperCount === 1 ? "" : "s"} via Stripe Connect. This cannot be undone automatically.
          </Text>
          <Flex gap="2">
            <Button type="button" disabled={loading} onClick={() => void onApprove()}>
              Confirm transfer
            </Button>
            <Button type="button" variant="soft" disabled={loading} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}
