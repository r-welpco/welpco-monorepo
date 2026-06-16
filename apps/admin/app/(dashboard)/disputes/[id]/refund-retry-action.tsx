"use client";

import { Button, Flex } from "@welpco/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminErrorCallout, AdminSuccessCallout } from "@/components/admin-callout";
import { reconcileDisputeRefund } from "@/lib/services/dispute-service";

export function RefundReconcileAction({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function reconcile() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await reconcileDisputeRefund(disputeId);
      setSuccess(
        `Stripe refreshed. Confirmed ${result.refundConfirmedCents ?? 0} of ${result.refundTargetCents ?? 0} cents.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stripe refresh failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex direction="column" gap="2" align="start">
      {error ? <AdminErrorCallout message={error} /> : null}
      {success ? <AdminSuccessCallout message={success} /> : null}
      <Button type="button" variant="soft" disabled={loading} onClick={() => void reconcile()}>
        {loading ? "Refreshing..." : "Refresh from Stripe"}
      </Button>
    </Flex>
  );
}
