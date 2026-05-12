import Link from "next/link";
import { listAdminReviews, type AdminReviewsResponse } from "@/lib/services/admin-reviews-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; revieweeId?: string; reviewerType?: string; minRating?: string; maxRating?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  let data: AdminReviewsResponse;
  let err: string | null = null;
  try {
    data = await listAdminReviews({
      page, limit: PAGE_SIZE,
      revieweeId: sp.revieweeId?.trim() || undefined,
      reviewerType: sp.reviewerType || undefined,
      minRating: sp.minRating ? parseInt(sp.minRating, 10) : undefined,
      maxRating: sp.maxRating ? parseInt(sp.maxRating, 10) : undefined,
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load reviews";
    data = { items: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 };
  }

  const buildHref = (p: number) => {
    const q = new URLSearchParams();
    if (sp.revieweeId) q.set("revieweeId", sp.revieweeId);
    if (sp.reviewerType) q.set("reviewerType", sp.reviewerType);
    if (sp.minRating) q.set("minRating", sp.minRating);
    if (sp.maxRating) q.set("maxRating", sp.maxRating);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return qs ? `/reviews?${qs}` : "/reviews";
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Reviews</h1>
      <form method="get" className="admin-card" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Reviewee ID
          <input name="revieweeId" defaultValue={sp.revieweeId ?? ""} className="admin-input" placeholder="UUID" style={{ width: 220 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Type
          <select name="reviewerType" defaultValue={sp.reviewerType ?? ""} className="admin-input">
            <option value="">All</option><option value="customer">Customer</option><option value="welper">Welper</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Min rating
          <input name="minRating" type="number" min={1} max={5} defaultValue={sp.minRating ?? ""} className="admin-input" style={{ width: 60 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Max rating
          <input name="maxRating" type="number" min={1} max={5} defaultValue={sp.maxRating ?? ""} className="admin-input" style={{ width: 60 }} />
        </label>
        <button type="submit" className="btn">Filter</button>
      </form>
      <p style={{ color: "var(--admin-muted)" }}>{data.total} reviews</p>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead><tr><th>Rating</th><th>Type</th><th>Comment</th><th>Booking</th><th>Date</th><th /></tr></thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr><td colSpan={6} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>No reviews.</td></tr>
            ) : data.items.map((r) => (
              <tr key={r.id}>
                <td>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                <td><span className="badge">{r.reviewerType}</span></td>
                <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.comment ?? "—"}</td>
                <td><Link href={`/bookings/${r.bookingId}`}>{r.bookingId.slice(0, 8)}</Link></td>
                <td style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td><Link href={`/reviews/${r.id}`}>View</Link></td>
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
