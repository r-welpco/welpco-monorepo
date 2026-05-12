import Link from "next/link";
import { searchAdminBookings } from "@/lib/services/admin-booking-service";
import { BookingIdJump } from "./booking-id-jump";

export const dynamic = "force-dynamic";

const LIMIT = 25;

const BOOKING_STATUSES = [
  "",
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "payment_released",
  "declined",
  "cancelled",
  "disputed",
  "no_show",
] as const;

export default async function BookingsSearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    customerId?: string;
    welperId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const customerId = sp.customerId?.trim() || undefined;
  const welperId = sp.welperId?.trim() || undefined;
  const status =
    sp.status && BOOKING_STATUSES.includes(sp.status as (typeof BOOKING_STATUSES)[number]) && sp.status !== ""
      ? sp.status
      : undefined;
  const dateFrom = sp.dateFrom?.trim() || undefined;
  const dateTo = sp.dateTo?.trim() || undefined;

  let list;
  let err: string | null = null;
  try {
    list = await searchAdminBookings({
      page,
      limit: LIMIT,
      customerId,
      welperId,
      status,
      dateFrom,
      dateTo,
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load bookings";
    list = { data: [], total: 0, page: 1, limit: LIMIT, totalPages: 1 };
  }

  const buildHref = (p: number) => {
    const q = new URLSearchParams();
    if (p > 1) q.set("page", String(p));
    if (customerId) q.set("customerId", customerId);
    if (welperId) q.set("welperId", welperId);
    if (status) q.set("status", status);
    if (dateFrom) q.set("dateFrom", dateFrom);
    if (dateTo) q.set("dateTo", dateTo);
    const qs = q.toString();
    return qs ? `/bookings?${qs}` : "/bookings";
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Bookings</h1>
      <p style={{ color: "var(--admin-muted)", maxWidth: 560 }}>
        Search by participant IDs and optional scheduled date range. Results are read-only; open a row for full JSON.
      </p>
      <BookingIdJump />
      <form
        method="get"
        className="admin-card"
        style={{
          marginTop: "1rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "0.75rem",
          alignItems: "end",
        }}
      >
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
          Welper ID
          <input
            name="welperId"
            defaultValue={welperId ?? ""}
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
            {BOOKING_STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Scheduled from
          <input
            name="dateFrom"
            type="date"
            defaultValue={dateFrom ?? ""}
            className="admin-input"
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Scheduled to
          <input
            name="dateTo"
            type="date"
            defaultValue={dateTo ?? ""}
            className="admin-input"
            style={{ padding: "0.5rem", borderRadius: 6, border: "1px solid var(--admin-border)" }}
          />
        </label>
        <button type="submit" className="btn">
          Search
        </button>
      </form>
      <p style={{ color: "var(--admin-muted)" }}>
        {list.total} bookings · page {list.page} of {list.totalPages}
      </p>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Scheduled</th>
              <th>Customer</th>
              <th>Welper</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.data.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>
                  No bookings match.
                </td>
              </tr>
            ) : (
              list.data.map((b, idx) => {
                const id = String(b.id ?? "");
                return (
                  <tr key={id || `booking-${idx}`}>
                    <td>
                      <span className="badge">{String(b.status ?? "—")}</span>
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>{b.scheduledDate != null ? String(b.scheduledDate) : "—"}</td>
                    <td style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem" }}>
                      {typeof b.customerId === "string" ? (
                        <Link href={`/users/${b.customerId}`}>{b.customerId.slice(0, 8)}…</Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem" }}>
                      {typeof b.welperId === "string" ? (
                        <Link href={`/users/${b.welperId}`}>{b.welperId.slice(0, 8)}…</Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {id ? <Link href={`/bookings/${id}`}>Open</Link> : null}
                    </td>
                  </tr>
                );
              })
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
