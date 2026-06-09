"use client";

import { Button, Flex } from "@welpco/ui";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminErrorCallout, AdminSuccessCallout } from "@/components/admin-callout";
import { retryDisputeRefund } from "@/lib/services/dispute-service";

export function RefundRetryAction({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function retry() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await retryDisputeRefund(disputeId);
      if (result.status === "succeeded") {
        setSuccess("Stripe refund succeeded.");
      } else {
        setError(`Refund is ${result.status}. ${result.message ?? "Verify the payment in Stripe Dashboard."}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund retry failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex direction="column" gap="2" align="start">
      {error ? <AdminErrorCallout message={error} /> : null}
      {success ? <AdminSuccessCallout message={success} /> : null}
      <Button type="button" color={SEMANTIC_COLOR.danger} disabled={loading} onClick={() => void retry()}>
        {loading ? "Retrying..." : "Retry refund"}
      </Button>
    </Flex>
  );
}
