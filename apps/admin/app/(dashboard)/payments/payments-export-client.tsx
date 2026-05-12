"use client";

import { useState } from "react";
import { fetchAdminPaymentsExport } from "@/lib/services/admin-payments-export";

export function PaymentsExportClient() {
  const [welperId, setWelperId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const download = async () => {
    setErr(null);
    setBusy(true);
    try {
      const { body, filename } = await fetchAdminPaymentsExport({
        welperId: welperId.trim() || undefined,
        dateFrom: dateFrom.trim() || undefined,
        dateTo: dateTo.trim() || undefined,
        format,
      });
      const blob = new Blob([body], {
        type: format === "json" ? "application/json" : "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: "2.5rem" }}>
      <h2 style={{ marginTop: 0 }}>Export captured payments</h2>
      <p style={{ color: "var(--admin-muted)", maxWidth: 560 }}>
        CSV/JSON for reconciliation (captured rows only). Same filters as before.
      </p>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Welper user ID (optional)
          <input
            className="admin-input"
            value={welperId}
            onChange={(e) => setWelperId(e.target.value)}
            placeholder="UUID of welper account"
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Captured from (date, optional)
          <input
            type="date"
            className="admin-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Captured to (date, optional)
          <input
            type="date"
            className="admin-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Format
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "csv" | "json")}
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </label>
        <button type="button" className="btn" disabled={busy} onClick={() => void download()}>
          {busy ? "Downloading…" : "Download"}
        </button>
      </div>
    </div>
  );
}
