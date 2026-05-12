import Link from "next/link";
import { listAdminUsers } from "@/lib/services/admin-users-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const ACCOUNT_TYPES = ["", "Customer", "Welper", "Guardian", "Admin"] as const;
const STATUSES = ["", "Pending", "Active", "Suspended", "Deactivated"] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    accountType?: string;
    status?: string;
    emailVerified?: string;
    search?: string;
    offset?: string;
  }>;
}) {
  const sp = await searchParams;
  const offsetRaw = parseInt(sp.offset ?? "0", 10);
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  const search = sp.search?.trim() || undefined;

  const accountType =
    sp.accountType && ACCOUNT_TYPES.includes(sp.accountType as (typeof ACCOUNT_TYPES)[number]) && sp.accountType !== ""
      ? sp.accountType
      : undefined;
  const status =
    sp.status && STATUSES.includes(sp.status as (typeof STATUSES)[number]) && sp.status !== ""
      ? sp.status
      : undefined;
  let emailVerified: boolean | undefined;
  if (sp.emailVerified === "true") emailVerified = true;
  else if (sp.emailVerified === "false") emailVerified = false;

  let data;
  let err: string | null = null;
  try {
    data = await listAdminUsers({
      limit: PAGE_SIZE,
      offset,
      accountType,
      status,
      emailVerified,
      search,
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load users";
    data = { users: [], total: 0 };
  }

  const nextOffset = offset + PAGE_SIZE;
  const prevOffset = Math.max(0, offset - PAGE_SIZE);
  const hasNext = nextOffset < data.total;
  const hasPrev = offset > 0;

  const buildHref = (o: number) => {
    const q = new URLSearchParams();
    if (accountType) q.set("accountType", accountType);
    if (status) q.set("status", status);
    if (sp.emailVerified === "true" || sp.emailVerified === "false") q.set("emailVerified", sp.emailVerified);
    if (search) q.set("search", search);
    if (o > 0) q.set("offset", String(o));
    const qs = q.toString();
    return qs ? `/users?${qs}` : "/users";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ marginTop: 0 }}>Users</h1>
        <Link href="/users/new" className="btn btn-primary">Create admin</Link>
      </div>
      <form
        method="get"
        className="admin-card"
        style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1rem" }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Account type
          <select name="accountType" defaultValue={accountType ?? ""} className="admin-input">
            <option value="">All</option>
            {ACCOUNT_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Status
          <select name="status" defaultValue={status ?? ""} className="admin-input">
            <option value="">All</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Email verified
          <select
            name="emailVerified"
            defaultValue={sp.emailVerified ?? ""}
            className="admin-input"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem", minWidth: 220 }}>
          Search (email or user ID)
          <input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            className="admin-input"
            placeholder="user@example.com or UUID"
            autoComplete="off"
          />
        </label>
        <button type="submit" className="btn">
          Apply filters
        </button>
      </form>

      <p style={{ color: "var(--admin-muted)" }}>
        {data.total} accounts · showing {data.users.length} (offset {offset})
      </p>
      {err ? <p className="err">{err}</p> : null}
      <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Type</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ color: "var(--admin-muted)", padding: "1.5rem" }}>
                  No users.
                </td>
              </tr>
            ) : (
              data.users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge">{u.accountType}</span>
                  </td>
                  <td>{u.status}</td>
                  <td>{u.emailVerified ? "Yes" : "No"}</td>
                  <td style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <Link href={`/users/${u.id}`}>View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        {hasPrev ? (
          <Link href={buildHref(prevOffset)} className="btn">
            Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link href={buildHref(nextOffset)} className="btn">
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
