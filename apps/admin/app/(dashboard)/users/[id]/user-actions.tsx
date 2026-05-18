"use client";

import {
  Button,
  Card,
  Checkbox,
  Flex,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Text,
  TextArea,
} from "@welpco/ui";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminErrorCallout, AdminSuccessCallout } from "@/components/admin-callout";
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

  const [status, setStatus] = useState(currentStatus);
  const [reasonCode, setReasonCode] = useState<StatusChangeReasonCode>("tos_violation");
  const [reasonDetail, setReasonDetail] = useState("");

  const [bgStatus, setBgStatus] = useState(
    currentBackgroundCheck && BG_STATUSES.includes(currentBackgroundCheck as (typeof BG_STATUSES)[number])
      ? currentBackgroundCheck
      : "Pending",
  );

  const [profileComplete, setProfileComplete] = useState(currentProfileComplete);
  const [onboardingCompleted, setOnboardingCompleted] = useState(currentOnboardingCompleted);

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
        setError("Please enter a reason when “Other” is selected.");
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
    <Flex direction="column" gap="4" mt="4">
      {error ? <AdminErrorCallout message={error} /> : null}
      {success ? <AdminSuccessCallout message={success} /> : null}

      <Card size="2" title="Account status">
        <form onSubmit={(e) => void onStatusSubmit(e)}>
          <Flex direction="column" gap="3" style={{ maxWidth: 480 }}>
            <Flex direction="column" gap="1">
              <Text size="1" weight="medium">
                Status
              </Text>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger />
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Flex>
            {showReason ? (
              <>
                <Flex direction="column" gap="1">
                  <Text size="1" weight="medium">
                    Reason (required for suspend / deactivate)
                  </Text>
                  <Select
                    value={reasonCode}
                    onValueChange={(v) => setReasonCode(v as StatusChangeReasonCode)}
                  >
                    <SelectTrigger />
                    <SelectContent>
                      {REASON_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Flex>
                <Flex direction="column" gap="1">
                  <Text size="1" weight="medium">
                    {reasonCode === "other" ? "Details (required)" : "Additional notes (optional)"}
                  </Text>
                  <TextArea
                    rows={3}
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder={
                      reasonCode === "other"
                        ? "Describe the reason…"
                        : "Optional context for the audit log…"
                    }
                  />
                </Flex>
              </>
            ) : null}
            <Button type="submit" disabled={loading !== null}>
              {loading === "status" ? "Saving…" : "Save status"}
            </Button>
          </Flex>
        </form>
      </Card>

      {hasProfile ? (
        <Card size="2" title="Profile flags">
          <Flex direction="column" gap="3">
            <Text size="2" color="gray">
              Override profile completion status and onboarding flag for this user.
            </Text>
            {!signupCompleted ? (
              <Text size="2" color="amber">
                Signup is not complete — prefer letting the user finish the wizard before overriding flags.
              </Text>
            ) : null}
            <form onSubmit={(e) => void onProfileFlagsSubmit(e)}>
              <Flex direction="column" gap="3" style={{ maxWidth: 480 }}>
                <Text as="label" size="2">
                  <Flex gap="2" align="center">
                    <Checkbox
                      checked={profileComplete}
                      onCheckedChange={(c) => setProfileComplete(c === true)}
                    />
                    Profile complete
                  </Flex>
                </Text>
                <Text as="label" size="2">
                  <Flex gap="2" align="center">
                    <Checkbox
                      checked={onboardingCompleted}
                      onCheckedChange={(c) => setOnboardingCompleted(c === true)}
                    />
                    Onboarding completed
                  </Flex>
                </Text>
                <Button type="submit" disabled={loading !== null}>
                  {loading === "profile" ? "Saving…" : "Save profile flags"}
                </Button>
              </Flex>
            </form>
          </Flex>
        </Card>
      ) : null}

      {isWelper ? (
        <Card size="2" title="Background check">
          <Flex direction="column" gap="3">
            <Text size="2" color="gray">
              Current: {currentBackgroundCheck ?? "—"}
            </Text>
            <form onSubmit={(e) => void onBgSubmit(e)}>
              <Flex gap="3" wrap="wrap" align="center">
                <Select value={bgStatus} onValueChange={setBgStatus}>
                  <SelectTrigger aria-label="Background check status" />
                  <SelectContent>
                    {BG_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={loading !== null}>
                  {loading === "bg" ? "Saving…" : "Save background check"}
                </Button>
              </Flex>
            </form>
          </Flex>
        </Card>
      ) : null}

      <Card size="2" title="Login lockout">
        <Flex direction="column" gap="3">
          <Text size="2" color="gray">
            Clear failed-attempt lockout for this user&apos;s email (after too many wrong passwords).
          </Text>
          <Button type="button" variant="soft" disabled={loading !== null} onClick={() => void onUnlock()}>
            {loading === "unlock" ? "Working…" : "Unlock account"}
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}
