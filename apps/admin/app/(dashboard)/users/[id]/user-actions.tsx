"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  setAdminUserBackgroundCheck,
  setAdminUserProfileFlags,
  unlockAdminUser,
  updateAdminUserStatus,
  type StatusChangeReasonCode,
} from "@/lib/services/admin-users-service";

const STATUSES = ["Pending", "Active", "Suspended", "Deactivated"] as const;

const REASON_OPTIONS: { value: StatusChangeReasonCode; label: string }[] = [
  { value: "tos_violation", label: "Terms of service violation" },
  { value: "fraud", label: "Fraud" },
  { value: "payment_abuse", label: "Payment abuse / chargebacks" },
  { value: "impersonation", label: "Impersonation / identity" },
  { value: "user_requested", label: "User requested closure" },
  { value: "other", label: "Other (describe below)" },
];

const BG_STATUSES = [
  "Not Required",
  "Pending",
  "In Progress",
  "Passed",
  "Failed",
  "Expired",
] as const;

function needsModerationReason(status: string): boolean {
  return status === "Suspended" || status === "Deactivated";
}

export function UserActions({
  userId,
  accountType,
  currentStatus,
  currentBackgroundCheck,
  signupCompleted,
  profileType,
  currentProfileComplete,
  currentOnboardingCompleted,
}: {
  userId: string;
  accountType: string;
  currentStatus: string;
  currentBackgroundCheck?: string | null;
  signupCompleted: boolean;
  profileType: "customer" | "welper" | null;
  currentProfileComplete: boolean;
  currentOnboardingCompleted: boolean;
}) {
  const router = useRouter();
  const isWelper = accountType === "Welper";
  const hasProfile = profileType === "customer" || profileType === "welper";

  // Status form
  const [status, setStatus] = useState(currentStatus);
  const [reasonCode, setReasonCode] = useState<StatusChangeReasonCode>("tos_violation");
  const [reasonDetail, setReasonDetail] = useState("");

  // Background check form
  const [bgStatus, setBgStatus] = useState(
    currentBackgroundCheck && BG_STATUSES.includes(currentBackgroundCheck as (typeof BG_STATUSES)[number])
      ? currentBackgroundCheck
      : "Pending"
  );

  // Profile flags form
  const [profileComplete, setProfileComplete] = useState(currentProfileComplete);
  const [onboardingCompleted, setOnboardingCompleted] = useState(currentOnboardingCompleted);

  // Shared state
  const [loading, setLoading] = useState<null | "status" | "bg" | "unlock" | "profile">(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showReason = useMemo(() => needsModerationReason(status), [status]);

  async function onStatusSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (needsModerationReason(status)) {
      if (reasonCode === "other" && !reasonDetail.trim()) {
        setError("Please enter a reason when \u201cOther\u201d is selected.");
        return;
      }
    }

    setLoading("status");
    try {
      const body: Parameters<typeof updateAdminUserStatus>[1] = { status };
      if (needsModerationReason(status)) {
        body.reasonCode = reasonCode;
        if (reasonCode === "other" || reasonDetail.trim()) {
          body.reasonDetail = reasonDetail.trim();
        }
      }
      await updateAdminUserStatus(userId, body);
      setSuccess("Account status updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(null);
    }
  }

  async function onBgSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading("bg");
    try {
      await setAdminUserBackgroundCheck(userId, bgStatus);
      setSuccess("Background check status updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(null);
    }
  }

  async function onUnlock() {
    setError(null);
    setSuccess(null);
    setLoading("unlock");
    try {
      await unlockAdminUser(userId);
      setSuccess("Lockout cleared for this email.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setLoading(null);
    }
  }

  async function onProfileFlagsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading("profile");
    try {
      await setAdminUserProfileFlags(userId, {
        profileComplete,
        onboardingCompleted,
      });
      setSuccess("Profile flags updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {error ? <p className="err">{error}</p> : null}
      {success ? <p className="ok">{success}</p> : null}

      {/* Account Status */}
      <div className="admin-card">
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Account status</h2>
        <form onSubmit={(e) => void onStatusSubmit(e)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 480 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="admin-input"
                aria-label="Account status"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            {showReason ? (
              <>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
                  Reason (required for suspend / deactivate)
                  <select
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value as StatusChangeReasonCode)}
                    className="admin-input"
                  >
                    {REASON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
                  {reasonCode === "other" ? "Details (required)" : "Additional notes (optional)"}
                  <textarea
                    className="admin-input"
                    rows={3}
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder={
                      reasonCode === "other"
                        ? "Describe the reason\u2026"
                        : "Optional context for the audit log\u2026"
                    }
                  />
                </label>
              </>
            ) : null}
            <button type="submit" className="btn btn-primary" disabled={loading !== null}>
              {loading === "status" ? "Saving\u2026" : "Save status"}
            </button>
          </div>
        </form>
      </div>

      {/* Profile Flags (customer/welper only) */}
      {hasProfile ? (
        <div className="admin-card">
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Profile flags</h2>
          <p style={{ marginTop: 0, fontSize: "0.85rem", color: "var(--admin-muted)" }}>
            Override profile completion status and onboarding flag for this user. Signup wizard state is the
            source of truth for launch readiness.
          </p>
          {!signupCompleted ? (
            <p style={{ fontSize: "0.85rem", color: "var(--admin-warn, #b45309)", marginTop: 0 }}>
              Signup is not complete — prefer letting the user finish the wizard before overriding flags.
            </p>
          ) : null}
          <form onSubmit={(e) => void onProfileFlagsSubmit(e)}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 480 }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                <input
                  type="checkbox"
                  checked={profileComplete}
                  onChange={(e) => setProfileComplete(e.target.checked)}
                />
                Profile complete
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                <input
                  type="checkbox"
                  checked={onboardingCompleted}
                  onChange={(e) => setOnboardingCompleted(e.target.checked)}
                />
                Onboarding completed
              </label>
              <button type="submit" className="btn btn-primary" disabled={loading !== null}>
                {loading === "profile" ? "Saving\u2026" : "Save profile flags"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Background Check (welpers only) */}
      {isWelper ? (
        <div className="admin-card">
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Background check</h2>
          <p style={{ marginTop: 0, fontSize: "0.85rem", color: "var(--admin-muted)" }}>
            Current: {currentBackgroundCheck ?? "\u2014"}
          </p>
          <form onSubmit={(e) => void onBgSubmit(e)} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
            <select
              value={bgStatus}
              onChange={(e) => setBgStatus(e.target.value)}
              className="admin-input"
              aria-label="Background check status"
            >
              {BG_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary" disabled={loading !== null}>
              {loading === "bg" ? "Saving\u2026" : "Save background check"}
            </button>
          </form>
        </div>
      ) : null}

      {/* Login Lockout */}
      <div className="admin-card">
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Login lockout</h2>
        <p style={{ marginTop: 0, fontSize: "0.85rem", color: "var(--admin-muted)" }}>
          Clear failed-attempt lockout for this user&apos;s email (after too many wrong passwords).
        </p>
        <button type="button" className="btn" disabled={loading !== null} onClick={() => void onUnlock()}>
          {loading === "unlock" ? "Working\u2026" : "Unlock account"}
        </button>
      </div>
    </div>
  );
}
