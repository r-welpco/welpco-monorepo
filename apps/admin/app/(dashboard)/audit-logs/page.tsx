import Link from "next/link";
import { listAdminAuditLogs } from "@/lib/services/admin-audit-service";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  let list;
  let err: string | null = null;
  try {
    list = await listAdminAuditLogs({ page, limit: 40 });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load audit log";
    list = { data: [], total: 0, page: 1, limit: 40, totalPages: 1 };
  }

  const buildHref = (p: number) => (p > 1 ? `/audit-logs?page=${p}` : "/audit-logs");

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Audit log</h1>
      <p style={{ color: "var(--admin-muted)", maxWidth: 640 }}>
        Recent staff actions (user status, background check, unlock, payment delay, dispute resolutions). Requires{" "}
        <code>admin_audit_logs</code> migration applied.
      </p>
      <p style={{ color: "var(--admin-muted)" }}>
        {list.total} entries · page {list.page} of {list.totalPages}
      </p>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {list.data.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>
                  No entries yet.
                </td>
              </tr>
            ) : (
              list.data.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontSize: "0.85rem", color: "var(--admin-muted)", whiteSpace: "nowrap" }}>
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <code style={{ fontSize: "0.8rem" }}>{row.action}</code>
                  </td>
                  <td style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
                    <Link href={`/users/${row.actorUserId}`}>{row.actorUserId.slice(0, 8)}…</Link>
                  </td>
                  <td style={{ fontSize: "0.8rem", maxWidth: 360, wordBreak: "break-word" }}>
                    {row.metadata ? JSON.stringify(row.metadata) : "—"}
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
