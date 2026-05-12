import Link from "next/link";
import { listAdminPayments } from "@/lib/services/admin-payments-list-service";

const LIMIT = 25;

const PAYMENT_STATUSES = [
  "",
  "pending",
  "requires_action",
  "authorized",
  "captured",
  "canceled",
  "failed",
] as const;

export async function PaymentsBrowse({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    welperId?: string;
    customerId?: string;
    status?: string;
    capturedDateFrom?: string;
    capturedDateTo?: string;
  }>;
}) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const welperId = sp.welperId?.trim() || undefined;
  const customerId = sp.customerId?.trim() || undefined;
  const status =
    sp.status && PAYMENT_STATUSES.includes(sp.status as (typeof PAYMENT_STATUSES)[number]) && sp.status !== ""
      ? sp.status
      : undefined;
  const capturedDateFrom = sp.capturedDateFrom?.trim() || undefined;
  const capturedDateTo = sp.capturedDateTo?.trim() || undefined;

  let list;
  let err: string | null = null;
  try {
    list = await listAdminPayments({
      page,
      limit: LIMIT,
      welperId,
      customerId,
      status,
      capturedDateFrom,
      capturedDateTo,
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load payments";
    list = { data: [], total: 0, page: 1, limit: LIMIT, totalPages: 1 };
  }

  const buildHref = (p: number) => {
    const q = new URLSearchParams();
    if (p > 1) q.set("page", String(p));
    if (welperId) q.set("welperId", welperId);
    if (customerId) q.set("customerId", customerId);
    if (status) q.set("status", status);
    if (capturedDateFrom) q.set("capturedDateFrom", capturedDateFrom);
    if (capturedDateTo) q.set("capturedDateTo", capturedDateTo);
    const qs = q.toString();
    return qs ? `/payments?${qs}` : "/payments";
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Browse booking payments</h2>
      <p style={{ color: "var(--admin-muted)", maxWidth: 640 }}>
        All payment rows (pending through captured). Optional filters narrow by welper, customer, status, or capture
        date range.
      </p>
      <form
        method="get"
        className="admin-card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: "0.75rem",
          alignItems: "end",
          marginBottom: "1rem",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Welper ID
          <input
            name="welperId"
            defaultValue={welperId ?? ""}
            className="admin-input"
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Customer ID
          <input
            name="customerId"
            defaultValue={customerId ?? ""}
            className="admin-input"
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Status
          <select
            name="status"
            defaultValue={status ?? ""}
            className="admin-input"
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          >
            <option value="">Any</option>
            {PAYMENT_STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Captured from
          <input
            name="capturedDateFrom"
            type="date"
            defaultValue={capturedDateFrom ?? ""}
            className="admin-input"
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Captured to
          <input
            name="capturedDateTo"
            type="date"
            defaultValue={capturedDateTo ?? ""}
            className="admin-input"
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          />
        </label>
        <button type="submit" className="btn">
          Apply
        </button>
      </form>
      <p style={{ color: "var(--admin-muted)" }}>
        {list.total} rows · page {list.page} of {list.totalPages}
      </p>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Booking</th>
              <th>Amount</th>
              <th>Captured</th>
              <th>Welper</th>
            </tr>
          </thead>
          <tbody>
            {list.data.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>
                  No rows.
                </td>
              </tr>
            ) : (
              list.data.map((row, i) => (
                <tr key={`${row.bookingId}-${row.stripePaymentIntentId}-${i}`}>
                  <td>
                    <span className="badge">{row.status}</span>
                  </td>
                  <td style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem" }}>
                    <Link href={`/bookings/${row.bookingId}`}>{row.bookingId.slice(0, 8)}…</Link>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {(row.amountCents / 100).toFixed(2)} {row.currency.toUpperCase()}
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--admin-muted)" }}>
                    {row.capturedAt ? new Date(row.capturedAt).toLocaleString() : "—"}
                  </td>
                  <td style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem" }}>
                    <Link href={`/users/${row.welperId}`}>{row.welperId.slice(0, 8)}…</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        {list.page > 1 ? (
          <Link href={buildHref(list.page - 1)} className="btn">
            Previous
          </Link>
        ) : null}
        {list.page < list.totalPages ? (
          <Link href={buildHref(list.page + 1)} className="btn">
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
