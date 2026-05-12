import Link from "next/link";
import { listAdminSupportTickets } from "@/lib/services/admin-support-tickets-service";

export const dynamic = "force-dynamic";

const LIMIT = 25;

export default async function SupportTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const status = sp.status?.trim() || undefined;

  let list;
  let err: string | null = null;
  try {
    list = await listAdminSupportTickets({ page, limit: LIMIT, status });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load tickets";
    list = { data: [], total: 0, page: 1, limit: LIMIT, totalPages: 1 };
  }

  const buildHref = (p: number, st?: string) => {
    const q = new URLSearchParams();
    if (p > 1) q.set("page", String(p));
    if (st) q.set("status", st);
    const qs = q.toString();
    return qs ? `/support-tickets?${qs}` : "/support-tickets";
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Support tickets</h1>
      <form
        method="get"
        className="admin-card"
        style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1rem" }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Status contains
          <input
            name="status"
            type="text"
            defaultValue={status ?? ""}
            placeholder="e.g. open"
            className="admin-input"
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          />
        </label>
        <button type="submit" className="btn">
          Filter
        </button>
      </form>
      <p style={{ color: "var(--admin-muted)" }}>
        {list.total} tickets · page {list.page} of {list.totalPages}
      </p>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Priority</th>
              <th>Subject</th>
              <th>User</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.data.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>
                  No tickets.
                </td>
              </tr>
            ) : (
              list.data.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="badge">{t.status}</span>
                  </td>
                  <td>{t.priority}</td>
                  <td>{t.subject}</td>
                  <td style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
                    <Link href={`/users/${t.userId}`}>{t.userId.slice(0, 8)}…</Link>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>
                    {new Date(t.updatedAt).toLocaleString()}
                  </td>
                  <td>
                    <Link href={`/support-tickets/${t.id}`}>Open</Link>
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
