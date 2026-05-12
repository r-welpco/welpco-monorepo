import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminUser,
  getAdminUserProfile,
  getAdminUserOfferings,
  type AdminUserDetail,
  type AdminUserProfile,
} from "@/lib/services/admin-users-service";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user: AdminUserDetail;
  let profile: AdminUserProfile | null = null;
  try {
    user = await getAdminUser(id);
  } catch {
    notFound();
  }

  let offerings: Array<Record<string, unknown>> = [];
  try {
    profile = await getAdminUserProfile(id);
  } catch {
    // Profile may not exist (e.g. admin/guardian accounts)
  }
  if (user.accountType === "Welper") {
    try { offerings = (await getAdminUserOfferings(id)) as Array<Record<string, unknown>>; } catch { /* no offerings */ }
  }

  const bg = user.verificationStatus?.backgroundCheckStatus ?? null;

  return (
    <div>
      <p style={{ marginTop: 0 }}>
        <Link href="/users">&larr; Users</Link>
      </p>
      <h1 style={{ marginBottom: "0.25rem" }}>{user.email}</h1>
      <p style={{ color: "var(--admin-muted)" }}>
        <span className="badge">{user.accountType}</span> &middot;{" "}
        <span className="badge">{user.status}</span> &middot;{" "}
        {user.emailVerified ? "Email verified" : "Email not verified"}
      </p>

      <div className="admin-card" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Account</h2>
        <p style={{ fontSize: "0.9rem", fontFamily: "ui-monospace, monospace" }}>
          <strong>ID:</strong> {user.id}
        </p>
        <p style={{ fontSize: "0.9rem", color: "var(--admin-muted)" }}>
          Created {user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
          {user.lastLoginAt ? (
            <> &middot; Last login {new Date(user.lastLoginAt).toLocaleString()}</>
          ) : (
            ""
          )}
        </p>
      </div>

      {profile && profile.type ? (
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Profile</h2>
          <table style={{ fontSize: "0.9rem", borderCollapse: "collapse" }}>
            <tbody>
              {profile.firstName || profile.lastName ? (
                <tr>
                  <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Name</td>
                  <td style={{ padding: "4px 0" }}>
                    {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "—"}
                  </td>
                </tr>
              ) : null}
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Profile status</td>
                <td style={{ padding: "4px 0" }}>
                  <span className="badge">{profile.profileCompletionStatus ?? "—"}</span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Onboarding</td>
                <td style={{ padding: "4px 0" }}>
                  {profile.onboardingCompleted ? "Completed" : "Not completed"}
                </td>
              </tr>
              {profile.bio !== undefined && profile.bio !== null ? (
                <tr>
                  <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)", verticalAlign: "top" }}>Bio</td>
                  <td style={{ padding: "4px 0", maxWidth: 400, whiteSpace: "pre-wrap" }}>
                    {profile.bio || "—"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {offerings.length > 0 ? (
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Service Offerings ({offerings.length})</h2>
          <table className="admin-table" style={{ fontSize: "0.9rem" }}>
            <thead><tr><th>Description</th><th>Rate</th><th>Experience</th><th>Active</th></tr></thead>
            <tbody>
              {offerings.map((o, i) => (
                <tr key={String(o.id ?? i)}>
                  <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(o.serviceDescription ?? o.title ?? "—")}</td>
                  <td>${String(o.hourlyRate ?? "—")}/hr</td>
                  <td>{String(o.experienceYears ?? "—")} yrs</td>
                  <td>{o.active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {user.statusChangedAt ? (
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Last account status change</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
            <li>
              <strong>When:</strong> {new Date(user.statusChangedAt).toLocaleString()}
            </li>
            {user.statusChangedByAdminId ? (
              <li>
                <strong>By admin:</strong>{" "}
                <Link href={`/users/${user.statusChangedByAdminId}`} style={{ fontFamily: "ui-monospace, monospace" }}>
                  {user.statusChangedByAdminId}
                </Link>
              </li>
            ) : null}
            {user.statusChangeReasonCode ? (
              <li>
                <strong>Reason code:</strong> <code>{user.statusChangeReasonCode}</code>
              </li>
            ) : null}
            {user.statusChangeReasonDetail ? (
              <li style={{ whiteSpace: "pre-wrap" }}>
                <strong>Notes:</strong> {user.statusChangeReasonDetail}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <UserActions
        key={`${user.status}-${bg ?? ""}-${profile?.profileCompletionStatus ?? ""}`}
        userId={user.id}
        accountType={user.accountType}
        currentStatus={user.status}
        currentBackgroundCheck={bg}
        profileType={profile?.type ?? null}
        currentProfileComplete={profile?.profileCompletionStatus === "Complete"}
        currentOnboardingCompleted={profile?.onboardingCompleted ?? false}
      />
    </div>
  );
}
