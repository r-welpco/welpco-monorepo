import {
  Badge,
  Card,
  Flex,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableColumnHeaderCell,
  TableHeader,
  TableRow,
  Text,
} from "@welpco/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminUserAvatar } from "@/components/admin-user-avatar";
import { AdminErrorCallout } from "@/components/admin-callout";
import { DetailRow, DetailTable } from "@/components/detail-rows";
import {
  getAdminUser,
  getAdminUserProfile,
  getAdminUserOfferings,
  getAdminUserSignupState,
  parseOfferingDescription,
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
  const profilePhotoUrl =
    profile?.profilePhotoUrl ?? user.profilePhotoUrl ?? null;
  const availabilityStepComplete =
    signupState?.completedSteps.includes("welperAvailability") ?? false;
  const discoverabilityChecks = isWelper
    ? [
        { label: "Signup complete", passed: user.signupCompleted === true },
        { label: "Email verified", passed: user.emailVerified === true },
        { label: "Account active", passed: user.status === "Active" },
        {
          label: "Profile public",
          passed: profile?.profileVisibility === "Public",
        },
      ]
    : [];
  const discoverable =
    isWelper && discoverabilityChecks.every((check) => check.passed);

  return (
    <Flex direction="column" gap="4">
      <Text size="2">
        <Link href="/users">← Users</Link>
      </Text>
      <Flex gap="4" align="start" wrap="wrap">
        <AdminUserAvatar
          email={user.email}
          profilePhotoUrl={profilePhotoUrl}
          size="6"
        />
        <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1 }}>
          <Heading size="6">{user.email}</Heading>
          <Flex gap="2" wrap="wrap" align="center">
            <Badge variant="soft">{user.accountType}</Badge>
            <Badge variant="soft">{user.status}</Badge>
            <Text size="2" color="gray">
              {user.emailVerified ? "Email verified" : "Email not verified"}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {isWelper ? (
        <Card size="2" title="Launch readiness">
          {signupStateError ? <AdminErrorCallout message={signupStateError} /> : null}
          <Flex gap="2" wrap="wrap" mb="3">
            <Badge variant="soft" color={discoverable ? "green" : "amber"}>
              {discoverable ? "Discoverable" : "Not discoverable"}
            </Badge>
            {discoverabilityChecks.map((check) => (
              <Badge
                key={check.label}
                variant="soft"
                color={check.passed ? "green" : "red"}
              >
                {check.passed ? "Ready" : "Blocked"}: {check.label}
              </Badge>
            ))}
          </Flex>
          <DetailTable>
            <DetailRow label="Signup completed">{user.signupCompleted ? "Yes" : "No"}</DetailRow>
            <DetailRow label="Preferred locale">{user.preferredLocale ?? "—"}</DetailRow>
            <DetailRow label="Identity verified">{identityVerified ? "Yes" : "No"}</DetailRow>
            {signupState ? (
              <>
                <DetailRow label="Next signup step">
                  <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                    {signupState.nextStep ?? "—"}
                  </Text>
                </DetailRow>
                <DetailRow label="Completed steps">
                  <Text size="1">
                    {signupState.completedSteps.length > 0
                      ? signupState.completedSteps.join(", ")
                      : "—"}
                  </Text>
                </DetailRow>
              </>
            ) : null}
            {bgStep ? (
              <>
                <DetailRow label="BG step · fee paid">{bgStep.paid ? "Yes" : "No"}</DetailRow>
                <DetailRow label="BG step · Certn status">{bgStep.certnStatus || "—"}</DetailRow>
                {bgStep.skipped ? <DetailRow label="BG step">Skipped</DetailRow> : null}
              </>
            ) : null}
            {payoutStep ? (
              <DetailRow label="Payout step · Stripe onboarding">
                {payoutStep.stripeOnboardingCompleted ? "Completed" : "Not completed"}
              </DetailRow>
            ) : null}
            {profileError ? (
              <DetailRow label="Profile (payout)">
                <AdminErrorCallout message={profileError} />
              </DetailRow>
            ) : profile?.type === "welper" ? (
              <>
                <DetailRow label="Payout method">{profile.payoutMethodChoice ?? "—"}</DetailRow>
                <DetailRow label="Stripe Connect">
                  {profile.stripeConnectConnected
                    ? `Connected (account id …${profile.stripeConnectAccountLast4 ?? "????"})`
                    : "Not connected"}
                </DetailRow>
              </>
            ) : null}
          </DetailTable>
        </Card>
      ) : null}

      {isWelper ? (
        <Card size="2" title="Background check">
          <DetailTable>
            <DetailRow label="Fee paid">
              {user.backgroundCheckPaid === true
                ? "Yes"
                : user.backgroundCheckPaid === false
                  ? "No"
                  : "—"}
            </DetailRow>
            {user.backgroundCheckPaidAt ? (
              <DetailRow label="Paid at">
                {new Date(user.backgroundCheckPaidAt).toLocaleString()}
              </DetailRow>
            ) : null}
            <DetailRow label="Screening">{user.backgroundCheckCertnStatus ?? "—"}</DetailRow>
            <DetailRow label="Result status">
              <Badge variant="soft">{bg ?? "—"}</Badge>
            </DetailRow>
            {user.backgroundCheckFailureReason ? (
              <DetailRow label="Failure reason">{user.backgroundCheckFailureReason}</DetailRow>
            ) : null}
            {user.backgroundCheckCertnApplicantUrl ? (
              <DetailRow label="Certn link">
                <Link href={user.backgroundCheckCertnApplicantUrl} target="_blank" rel="noopener noreferrer">
                  Open screening link
                </Link>
              </DetailRow>
            ) : null}
          </DetailTable>
        </Card>
      ) : null}

      <Card size="2" title="Account">
        <Flex direction="column" gap="2">
          <Text size="2" style={{ fontFamily: "ui-monospace, monospace" }}>
            <Text weight="bold">ID:</Text> {user.id}
          </Text>
          <Text size="2" color="gray">
            Created {user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
            {user.lastLoginAt
              ? ` · Last login ${new Date(user.lastLoginAt).toLocaleString()}`
              : ""}
          </Text>
        </Flex>
      </Card>

      {profileError ? (
        <Card size="2" title="Profile">
          <AdminErrorCallout message={profileError} />
        </Card>
      ) : profile && profile.type ? (
        <Card size="2" title="Profile">
          <Flex gap="4" align="center" style={{ marginBottom: "var(--space-3)" }}>
            <AdminUserAvatar
              email={user.email}
              profilePhotoUrl={profilePhotoUrl}
              size="5"
            />
            {profile.firstName || profile.lastName ? (
              <Text size="4" weight="medium">
                {[profile.firstName, profile.lastName].filter(Boolean).join(" ")}
              </Text>
            ) : (
              <Text size="2" color="gray">
                No name on profile
              </Text>
            )}
          </Flex>
          <DetailTable>
            <DetailRow label="Profile status">
              <Badge variant="soft">{profile.profileCompletionStatus ?? "—"}</Badge>
            </DetailRow>
            <DetailRow label="Onboarding">
              {profile.onboardingCompleted ? "Completed" : "Not completed"}
            </DetailRow>
            {profile.type === "customer" ? (
              <DetailRow label="Default payment method ID">
                <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                  {user.stripeDefaultPaymentMethodId ?? "Not set"}
                </Text>
              </DetailRow>
            ) : null}
            <DetailRow label="Date of birth">{profile.dateOfBirth ?? "—"}</DetailRow>
            <DetailRow label="Phone">
              <Text
                size="1"
                style={{ whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" }}
              >
                {formatProfileValue(profile.phoneNumber)}
              </Text>
            </DetailRow>
            <DetailRow label="Address">
              <Text
                size="1"
                style={{ whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" }}
              >
                {formatProfileValue(profile.address)}
              </Text>
            </DetailRow>
            {profile.bio !== undefined && profile.bio !== null ? (
              <DetailRow label="Bio">
                <Text size="2" style={{ whiteSpace: "pre-wrap", maxWidth: 400 }}>
                  {profile.bio || "—"}
                </Text>
              </DetailRow>
            ) : null}
            {profile.type === "welper" ? (
              <>
                <DetailRow label="Profile visibility">
                  <Badge variant="soft">{profile.profileVisibility ?? "—"}</Badge>
                </DetailRow>
                <DetailRow label="Trust verification">
                  {profile.verified ? "Verified" : "Not verified"}
                </DetailRow>
                <DetailRow label="Service area">
                  <Text
                    size="1"
                    style={{ whiteSpace: "pre-wrap", fontFamily: "ui-monospace, monospace" }}
                  >
                    {formatProfileValue(profile.serviceArea)}
                  </Text>
                </DetailRow>
                <DetailRow label="Service area summary">
                  {[
                    profile.serviceAreaCity,
                    profile.provinceCode,
                    profile.countryCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </DetailRow>
                <DetailRow label="Postal areas">
                  {profile.serviceAreaPostalCodes && profile.serviceAreaPostalCodes.length > 0
                    ? profile.serviceAreaPostalCodes.join(", ")
                    : profile.serviceAreaCity || profile.serviceArea
                      ? "All configured area"
                      : "—"}
                </DetailRow>
                <DetailRow label="Coordinates">
                  {profile.latitude != null && profile.longitude != null
                    ? `${profile.latitude}, ${profile.longitude}`
                    : "—"}
                </DetailRow>
                <DetailRow label="Availability preference">
                  {profile.availabilityAdHocOnly
                    ? "Ad-hoc requests only"
                    : availabilityStepComplete
                      ? "Recurring schedule"
                      : "Not configured"}
                </DetailRow>
              </>
            ) : null}
          </DetailTable>
        </Card>
      ) : null}

      {isWelper ? (
        <Card size="2" title={`Service offerings (${offerings.length})`}>
          {offeringsError ? <AdminErrorCallout message={offeringsError} /> : null}
          {offeringsLoaded && offerings.length === 0 && !offeringsError ? (
            <Text size="2" color="gray">
              No service offerings yet.
            </Text>
          ) : null}
          {offerings.length > 0 ? (
            <div style={{ marginTop: "var(--space-3)", overflowX: "auto" }}>
              <Table style={{ tableLayout: "fixed", width: "100%", minWidth: 480 }}>
                <TableHeader>
                  <TableRow>
                    <TableColumnHeaderCell style={{ width: "58%" }}>
                      Description
                    </TableColumnHeaderCell>
                    <TableColumnHeaderCell style={{ width: "14%" }}>Rate</TableColumnHeaderCell>
                    <TableColumnHeaderCell style={{ width: "14%" }}>
                      Experience
                    </TableColumnHeaderCell>
                    <TableColumnHeaderCell style={{ width: "14%" }}>Active</TableColumnHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offerings.map((o, i) => {
                    const { title, body } = parseOfferingDescription(o.serviceDescription);
                    return (
                      <TableRow key={o.id ?? i} align="start">
                        <TableCell
                          style={{
                            verticalAlign: "top",
                            overflow: "hidden",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                          }}
                        >
                          <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
                            {title ? (
                              <Text size="2" weight="medium">
                                {title}
                              </Text>
                            ) : null}
                            <Text
                              size="1"
                              color={title ? "gray" : undefined}
                              style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
                            >
                              {body}
                            </Text>
                          </Flex>
                        </TableCell>
                        <TableCell style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                          ${String(o.hourlyRate ?? "—")}/hr
                        </TableCell>
                        <TableCell style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                          {String(o.experienceYears ?? "—")} yrs
                        </TableCell>
                        <TableCell style={{ verticalAlign: "top", whiteSpace: "nowrap" }}>
                          {o.active ? "Yes" : "No"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </Card>
      ) : null}

      {user.statusChangedAt ? (
        <Card size="2" title="Last account status change">
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              <li>
                <Text size="2">
                  <Text weight="bold">When:</Text> {new Date(user.statusChangedAt).toLocaleString()}
                </Text>
              </li>
              {user.statusChangedByAdminId ? (
                <li>
                  <Text size="2">
                    <Text weight="bold">By admin:</Text>{" "}
                    <Link href={`/users/${user.statusChangedByAdminId}`}>
                      <Text style={{ fontFamily: "ui-monospace, monospace" }}>
                        {user.statusChangedByAdminId}
                      </Text>
                    </Link>
                  </Text>
                </li>
              ) : null}
              {user.statusChangeReasonCode ? (
                <li>
                  <Text size="2">
                    <Text weight="bold">Reason code:</Text>{" "}
                    <Text style={{ fontFamily: "ui-monospace, monospace" }}>
                      {user.statusChangeReasonCode}
                    </Text>
                  </Text>
                </li>
              ) : null}
              {user.statusChangeReasonDetail ? (
                <li>
                  <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                    <Text weight="bold">Notes:</Text> {user.statusChangeReasonDetail}
                  </Text>
                </li>
              ) : null}
            </ul>
        </Card>
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
    </Flex>
  );
}
