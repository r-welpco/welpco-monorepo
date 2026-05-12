import Link from "next/link";
import { listAdminReferrals, getAdminReferralStats, type AdminReferralsResponse, type AdminReferralStats } from "@/lib/services/admin-referrals-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  let data: AdminReferralsResponse;
  let stats: AdminReferralStats;
  let err: string | null = null;
  try {
    [data, stats] = await Promise.all([
      listAdminReferrals({ page, limit: PAGE_SIZE, status: sp.status || undefined }),
      getAdminReferralStats(),
    ]);
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load referrals";
    data = { items: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 };
    stats = { total: 0, completed: 0, rewarded: 0, totalRewardAmount: 0 };
  }

  const buildHref = (p: number) => {
    const q = new URLSearchParams();
    if (sp.status) q.set("status", sp.status);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/referrals?${qs}` : "/referrals";
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Referrals</h1>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {[
          { label: "Total", value: stats.total },
          { label: "Completed", value: stats.completed },
          { label: "Rewarded", value: stats.rewarded },
          { label: "Total rewards", value: `$${stats.totalRewardAmount.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="admin-card" style={{ padding: "0.75rem 1rem", minWidth: 120, textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{s.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--admin-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <form method="get" className="admin-card" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Status
          <select name="status" defaultValue={sp.status ?? ""} className="admin-input">
            <option value="">All</option><option value="Pending">Pending</option><option value="Completed">Completed</option>
            <option value="Rewarded">Rewarded</option><option value="Expired">Expired</option>
          </select>
        </label>
        <button type="submit" className="btn">Filter</button>
      </form>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead><tr><th>Referrer</th><th>Referee</th><th>Status</th><th>Reward</th><th>Date</th></tr></thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr><td colSpan={5} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>No referrals.</td></tr>
            ) : data.items.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/users/${r.referrerUserId}`}>{r.referrerUserId.slice(0, 8)}</Link></td>
                <td><Link href={`/users/${r.refereeUserId}`}>{r.refereeUserId.slice(0, 8)}</Link></td>
                <td><span className="badge">{r.status}</span></td>
                <td>{r.rewardAmount != null ? `$${Number(r.rewardAmount).toFixed(2)}` : "—"} <span className="badge">{r.rewardStatus}</span></td>
                <td style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>{new Date(r.referralDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        {page > 1 ? <Link href={buildHref(page - 1)} className="btn">Previous</Link> : null}
        {page < data.totalPages ? <Link href={buildHref(page + 1)} className="btn">Next</Link> : null}
      </div>
    </div>
  );
}
