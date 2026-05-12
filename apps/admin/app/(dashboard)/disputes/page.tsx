import Link from "next/link";
import { listDisputes } from "@/lib/services/dispute-service";

export const dynamic = "force-dynamic";

const LIMIT = 25;

const STATUS_OPTIONS = ["", "open", "in-review", "escalated", "resolved", "closed"] as const;

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const status =
    sp.status && STATUS_OPTIONS.includes(sp.status as (typeof STATUS_OPTIONS)[number]) && sp.status !== ""
      ? sp.status
      : undefined;

  let list;
  let err: string | null = null;
  try {
    list = await listDisputes(page, LIMIT, status);
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load disputes";
    list = { data: [], total: 0, page: 1, limit: LIMIT, totalPages: 1 };
  }

  const buildHref = (p: number, st?: string) => {
    const q = new URLSearchParams();
    if (p > 1) q.set("page", String(p));
    if (st) q.set("status", st);
    const qs = q.toString();
    return qs ? `/disputes?${qs}` : "/disputes";
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Disputes</h1>
      <form
        method="get"
        className="admin-card"
        style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1rem" }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Status (admin filter)
          <select name="status" defaultValue={status ?? ""} className="admin-input">
            <option value="">All</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn">
          Apply
        </button>
      </form>
      <p style={{ color: "var(--admin-muted)" }}>
        {list.total} total · page {list.page} of {list.totalPages}
      </p>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Subject</th>
              <th>Booking</th>
              <th>Alerts</th>
              <th>Category</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>
                  No disputes found.
                </td>
              </tr>
            ) : (
              list.data.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="badge">{d.status}</span>
                  </td>
                  <td>{d.subject}</td>
                  <td style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
                    <Link href={`/bookings/${d.bookingId}`}>{d.bookingId.slice(0, 8)}…</Link>
                    {d.bookingStatus ? (
                      <span
                        style={{ display: "block", color: "var(--admin-muted)", marginTop: "0.2rem" }}
                      >
                        {d.bookingStatus}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    {d.bookingCancelledWithOpenDispute ? (
                      <span
                        className="admin-flag"
                        title="Participant cancelled the booking while this dispute was still open"
                      >
                        Cancelled + open dispute
                      </span>
                    ) : (
                      <span style={{ color: "var(--admin-muted)" }}>—</span>
                    )}
                  </td>
                  <td>{d.category}</td>
                  <td style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>
                    {new Date(d.updatedAt).toLocaleString()}
                  </td>
                  <td>
                    <Link href={`/disputes/${d.id}`}>Open</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        {list.page > 1 ? (
          <Link href={buildHref(list.page - 1, status)} className="btn">
            Previous
          </Link>
        ) : null}
        {list.page < list.totalPages ? (
          <Link href={buildHref(list.page + 1, status)} className="btn">
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
