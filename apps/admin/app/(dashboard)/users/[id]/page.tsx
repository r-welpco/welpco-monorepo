import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminUser,
  getAdminUserProfile,
  getAdminUserOfferings,
  getAdminUserSignupState,
  type AdminServiceOffering,
  type AdminSignupStateReadout,
  type AdminUserDetail,
  type AdminUserProfile,
} from "@/lib/services/admin-users-service";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

function fetchErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function formatProfileValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value.trim() || "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function SectionError({ message }: { message: string }) {
  return (
    <p className="err" style={{ fontSize: "0.85rem", margin: "0.5rem 0 0" }}>
      {message}
    </p>
  );
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user: AdminUserDetail;
  try {
    user = await getAdminUser(id);
  } catch {
    notFound();
  }

  const isWelper = user.accountType === "Welper";

  let profile: AdminUserProfile | null = null;
  let profileError: string | null = null;
  try {
    profile = await getAdminUserProfile(id);
  } catch (err) {
    profileError = fetchErrorMessage(err, "Could not load profile");
  }

  let offerings: AdminServiceOffering[] = [];
  let offeringsError: string | null = null;
  let offeringsLoaded = false;
  if (isWelper) {
    try {
      offerings = await getAdminUserOfferings(id);
      offeringsLoaded = true;
    } catch (err) {
      offeringsError = fetchErrorMessage(err, "Could not load service offerings");
    }
  }

  let signupState: AdminSignupStateReadout | null = null;
  let signupStateError: string | null = null;
  if (isWelper) {
    try {
      signupState = await getAdminUserSignupState(id);
    } catch (err) {
      signupStateError = fetchErrorMessage(err, "Could not load signup state");
    }
  }

  const bg = user.verificationStatus?.backgroundCheckStatus ?? null;
  const identityVerified = user.verificationStatus?.identityVerified ?? false;
  const bgStep = signupState?.stepSummaries?.welperBackgroundCheck;
  const payoutStep = signupState?.stepSummaries?.welperPayout;

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

      {isWelper ? (
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Launch readiness</h2>
          {signupStateError ? <SectionError message={signupStateError} /> : null}
          <table style={{ fontSize: "0.9rem", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Signup completed</td>
                <td style={{ padding: "4px 0" }}>{user.signupCompleted ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Preferred locale</td>
                <td style={{ padding: "4px 0" }}>{user.preferredLocale ?? "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Identity verified</td>
                <td style={{ padding: "4px 0" }}>{identityVerified ? "Yes" : "No"}</td>
              </tr>
              {signupState ? (
                <>
                  <tr>
                    <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Next signup step</td>
                    <td style={{ padding: "4px 0" }}>
                      <code style={{ fontSize: "0.8rem" }}>{signupState.nextStep ?? "—"}</code>
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "4px 12px 4px 0",
                        color: "var(--admin-muted)",
                        verticalAlign: "top",
                      }}
                    >
                      Completed steps
                    </td>
                    <td style={{ padding: "4px 0", fontSize: "0.85rem" }}>
                      {signupState.completedSteps.length > 0
                        ? signupState.completedSteps.join(", ")
                        : "—"}
                    </td>
                  </tr>
                </>
              ) : null}
              {bgStep ? (
                <>
                  <tr>
                    <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>BG step · fee paid</td>
                    <td style={{ padding: "4px 0" }}>{bgStep.paid ? "Yes" : "No"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>BG step · Certn status</td>
                    <td style={{ padding: "4px 0" }}>{bgStep.certnStatus || "—"}</td>
                  </tr>
                  {bgStep.skipped ? (
                    <tr>
                      <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>BG step</td>
                      <td style={{ padding: "4px 0" }}>Skipped</td>
                    </tr>
                  ) : null}
                </>
              ) : null}
              {payoutStep ? (
                <tr>
                  <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>
                    Payout step · Stripe onboarding
                  </td>
                  <td style={{ padding: "4px 0" }}>
                    {payoutStep.stripeOnboardingCompleted ? "Completed" : "Not completed"}
                  </td>
                </tr>
              ) : null}
              {profileError ? (
                <tr>
                  <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)", verticalAlign: "top" }}>
                    Profile (payout)
                  </td>
                  <td style={{ padding: "4px 0" }}>
                    <SectionError message={profileError} />
                  </td>
                </tr>
              ) : profile?.type === "welper" ? (
                <>
                  <tr>
                    <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Payout method</td>
                    <td style={{ padding: "4px 0" }}>{profile.payoutMethodChoice ?? "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Stripe Connect</td>
                    <td style={{ padding: "4px 0" }}>
                      {profile.stripeConnectConnected
                        ? `Connected (account id …${profile.stripeConnectAccountLast4 ?? "????"})`
                        : "Not connected"}
                    </td>
                  </tr>
                </>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {isWelper ? (
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Background check</h2>
          <table style={{ fontSize: "0.9rem", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Fee paid</td>
                <td style={{ padding: "4px 0" }}>
                  {user.backgroundCheckPaid === true
                    ? "Yes"
                    : user.backgroundCheckPaid === false
                      ? "No"
                      : "—"}
                </td>
              </tr>
              {user.backgroundCheckPaidAt ? (
                <tr>
                  <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Paid at</td>
                  <td style={{ padding: "4px 0" }}>
                    {new Date(user.backgroundCheckPaidAt).toLocaleString()}
                  </td>
                </tr>
              ) : null}
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Screening</td>
                <td style={{ padding: "4px 0" }}>{user.backgroundCheckCertnStatus ?? "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Result status</td>
                <td style={{ padding: "4px 0" }}>
                  <span className="badge">{bg ?? "—"}</span>
                </td>
              </tr>
              {user.backgroundCheckFailureReason ? (
                <tr>
                  <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Failure reason</td>
                  <td style={{ padding: "4px 0" }}>{user.backgroundCheckFailureReason}</td>
                </tr>
              ) : null}
              {user.backgroundCheckCertnApplicantUrl ? (
                <tr>
                  <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Certn link</td>
                  <td style={{ padding: "4px 0", wordBreak: "break-all" }}>
                    <a href={user.backgroundCheckCertnApplicantUrl} target="_blank" rel="noopener noreferrer">
                      Open screening link
                    </a>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

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

      {profileError ? (
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Profile</h2>
          <SectionError message={profileError} />
        </div>
      ) : profile && profile.type ? (
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
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)", verticalAlign: "top" }}>
                  Phone
                </td>
                <td style={{ padding: "4px 0", whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
                  {formatProfileValue(profile.phoneNumber)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)", verticalAlign: "top" }}>
                  Address
                </td>
                <td style={{ padding: "4px 0", whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
                  {formatProfileValue(profile.address)}
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

      {isWelper ? (
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Service offerings ({offerings.length})</h2>
          {offeringsError ? <SectionError message={offeringsError} /> : null}
          {offeringsLoaded && offerings.length === 0 && !offeringsError ? (
            <p style={{ fontSize: "0.9rem", color: "var(--admin-muted)", margin: "0.5rem 0 0" }}>
              No service offerings yet.
            </p>
          ) : null}
          {offerings.length > 0 ? (
            <table className="admin-table" style={{ fontSize: "0.9rem", marginTop: "0.75rem" }}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Rate</th>
                  <th>Experience</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {offerings.map((o, i) => (
                  <tr key={o.id ?? i}>
                    <td
                      style={{
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o.serviceDescription ?? "—"}
                    </td>
                    <td>${String(o.hourlyRate ?? "—")}/hr</td>
                    <td>{String(o.experienceYears ?? "—")} yrs</td>
                    <td>{o.active ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
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
        signupCompleted={user.signupCompleted ?? false}
        profileType={profile?.type ?? null}
        currentProfileComplete={
          profile?.profileCompletionStatus === "COMPLETE" ||
          profile?.profileCompletionStatus === "Complete"
        }
        currentOnboardingCompleted={profile?.onboardingCompleted ?? false}
      />
    </div>
  );
}
