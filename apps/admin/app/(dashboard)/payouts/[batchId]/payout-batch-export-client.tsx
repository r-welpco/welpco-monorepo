"use client";

import { Button } from "@welpco/ui";
import { useState } from "react";
import { AdminErrorCallout } from "@/components/admin-callout";
import { getAccessToken } from "@/lib/api/get-token";

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}

export function PayoutBatchExportClient({ batchId }: { batchId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setError(null);
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${apiBase()}/api/admin/payouts/batches/${encodeURIComponent(batchId)}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Export failed (${res.status})`);
      }
      const body = await res.text();
      const blob = new Blob([body], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `welpco-payout-${batchId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error ? <AdminErrorCallout message={error} /> : null}
      <Button type="button" variant="soft" disabled={loading} onClick={() => void onExport()}>
        Export CSV
      </Button>
    </div>
  );
}
