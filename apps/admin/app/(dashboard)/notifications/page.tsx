import Link from "next/link";
import { listAdminNotifications, type AdminNotificationsResponse } from "@/lib/services/admin-notifications-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; userId?: string; channel?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  let data: AdminNotificationsResponse;
  let err: string | null = null;
  try {
    data = await listAdminNotifications({
      page, limit: PAGE_SIZE,
      userId: sp.userId?.trim() || undefined,
      channel: sp.channel || undefined,
      category: sp.category || undefined,
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load notifications";
    data = { items: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 };
  }

  const buildHref = (p: number) => {
    const q = new URLSearchParams();
    if (sp.userId) q.set("userId", sp.userId);
    if (sp.channel) q.set("channel", sp.channel);
    if (sp.category) q.set("category", sp.category);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/notifications?${qs}` : "/notifications";
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Notifications</h1>
      <form method="get" className="admin-card" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          User ID
          <input name="userId" defaultValue={sp.userId ?? ""} className="admin-input" placeholder="UUID" style={{ width: 220 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Channel
          <select name="channel" defaultValue={sp.channel ?? ""} className="admin-input">
            <option value="">All</option><option value="email">Email</option><option value="in_app">In-App</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Category
          <select name="category" defaultValue={sp.category ?? ""} className="admin-input">
            <option value="">All</option><option value="booking">Booking</option><option value="payment">Payment</option>
            <option value="review">Review</option><option value="security">Security</option><option value="system">System</option>
          </select>
        </label>
        <button type="submit" className="btn">Filter</button>
      </form>
      <p style={{ color: "var(--admin-muted)" }}>{data.total} notifications</p>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead><tr><th>User</th><th>Channel</th><th>Category</th><th>Title</th><th>Read</th><th>Date</th></tr></thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr><td colSpan={6} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>No notifications.</td></tr>
            ) : data.items.map((n) => (
              <tr key={n.id}>
                <td><Link href={`/users/${n.userId}`}>{n.userId.slice(0, 8)}</Link></td>
                <td><span className="badge">{n.channel}</span></td>
                <td><span className="badge">{n.category}</span></td>
                <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</td>
                <td>{n.isRead ? "Yes" : "No"}</td>
                <td style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>{new Date(n.createdAt).toLocaleDateString()}</td>
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
