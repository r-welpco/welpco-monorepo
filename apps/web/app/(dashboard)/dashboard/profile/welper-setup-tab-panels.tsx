"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import {
  WelperBackgroundCheckStep,
  WelperPayoutStep,
  type SignupStateLite,
} from "@welpco/ui/platform/user-management";
import {
  useWelperBackgroundCheckStepLabels,
  useWelperPayoutStepLabels,
} from "@/lib/i18n/use-auth-labels";
import { useDashboardCommonLabels } from "@/lib/i18n/use-dashboard-labels";
import {
  invalidateSetupChecklists,
  useBackgroundCheckStatus,
  useConfirmBackgroundCheckReturn,
  useCreateBackgroundCheckCheckout,
  useCreateStripeConnectLink,
  useResendBackgroundCheckInviteEmail,
  useSignupState,
  useStripeConnectStatus,
  useSyncStripeConnect,
} from "@/lib/hooks/use-signup";
import {
  useGuardianConsentStatus,
  useResendGuardianReviewEmail,
  useSubmitGuardianRequest,
} from "@/lib/hooks/use-guardian-consent";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { TextField } from "@welpco/ui/text-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { CheckCircle2 } from "lucide-react";

function useInvalidateSetupChecklist() {
  const queryClient = useQueryClient();
  return () => {
    void invalidateSetupChecklists(queryClient);
    void queryClient.invalidateQueries({ queryKey: ["signup", "state"] });
  };
}

export function WelperProfileBackgroundCheckPanel() {
  const locale = useLocale();
  const localeForStripe = (locale === "fr" ? "fr" : "en") as "en" | "fr";
  const searchParams = useSearchParams();
  const paymentReturn = searchParams.get("payment");
  const checkoutSessionId = searchParams.get("session_id");
  const pendingStripeReturn =
    paymentReturn === "success" && Boolean(checkoutSessionId);
  const t = useTranslations("dashboard.setup.backgroundCheck");
  const tCommon = useTranslations("auth.common");
  const labels = useWelperBackgroundCheckStepLabels();
  const invalidateChecklist = useInvalidateSetupChecklist();

  const { data: state, refetch: refetchSignupState } = useSignupState();
  const bgCheckStatus = useBackgroundCheckStatus(true);
  const createBgCheckout = useCreateBackgroundCheckCheckout();
  const confirmBgReturn = useConfirmBackgroundCheckReturn();
  const resendInviteEmail = useResendBackgroundCheckInviteEmail();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendInviteEmailSent, setResendInviteEmailSent] = useState(false);
  const confirmedStripeSessionRef = useRef<string | null>(null);

  const liteState = {
    completedSteps: state?.completedSteps ?? [],
    filledData: state?.filledData ?? {},
  } as SignupStateLite;

  useEffect(() => {
    void bgCheckStatus.refetch();
    void refetchSignupState();
  }, [bgCheckStatus, refetchSignupState]);

  useEffect(() => {
    if (!pendingStripeReturn || !checkoutSessionId) return;
    if (confirmedStripeSessionRef.current === checkoutSessionId) return;
    confirmedStripeSessionRef.current = checkoutSessionId;

    void (async () => {
      setSubmitError(null);
      try {
        await confirmBgReturn.mutateAsync(checkoutSessionId);
        await bgCheckStatus.refetch();
        invalidateChecklist();
      } catch (err) {
        confirmedStripeSessionRef.current = null;
        setSubmitError(
          err instanceof Error ? err.message : tCommon("somethingWentWrong"),
        );
      }
    })();
  }, [
    pendingStripeReturn,
    checkoutSessionId,
    confirmBgReturn,
    bgCheckStatus,
    tCommon,
    invalidateChecklist,
  ]);

  const bg = bgCheckStatus.data;
  const filledBg = liteState.filledData.welperBackgroundCheck as
    | {
        listPriceCents?: number;
        promoPriceCents?: number;
        promoEnabled?: boolean;
      }
    | undefined;

  return (
    <Flex direction="column" gap="4">
      <Text size="2" color="gray">
        {t("pageSubtitle")}
      </Text>
      <WelperBackgroundCheckStep
        variant="dashboard"
        labels={labels}
        state={liteState}
        loading={
          createBgCheckout.isPending ||
          confirmBgReturn.isPending ||
          resendInviteEmail.isPending
        }
        pricingLoading={bgCheckStatus.isPending && !filledBg}
        error={
          submitError ??
          bgCheckStatus.error?.message ??
          createBgCheckout.error?.message ??
          confirmBgReturn.error?.message ??
          resendInviteEmail.error?.message ??
          null
        }
        listPriceCents={bg?.pricing.listPriceCents ?? filledBg?.listPriceCents}
        promoPriceCents={bg?.pricing.promoPriceCents ?? filledBg?.promoPriceCents}
        promoEnabled={bg?.pricing.promoEnabled ?? filledBg?.promoEnabled ?? true}
        paymentStatus={bg?.paymentStatus ?? null}
        failureReason={bg?.failureReason ?? null}
        signupStepComplete={bg?.signupStepComplete ?? false}
        backgroundCheckStatus={bg?.backgroundCheckStatus ?? null}
        adminReviewPendingMessage={t("adminReviewPending")}
        backgroundCheckApprovedMessage={t("adminApproved")}
        confirmingReturn={confirmBgReturn.isPending}
        resendInviteEmailLoading={resendInviteEmail.isPending}
        resendInviteEmailSent={resendInviteEmailSent}
        onResendInviteEmail={() => {
          setSubmitError(null);
          setResendInviteEmailSent(false);
          void resendInviteEmail.mutateAsync().then(() => {
            setResendInviteEmailSent(true);
          });
        }}
        onPay={() => {
          void createBgCheckout.mutateAsync(localeForStripe).then(({ url }) => {
            window.location.href = url;
          });
        }}
        onContinue={() => {
          invalidateChecklist();
        }}
      />
    </Flex>
  );
}

export function WelperProfilePayoutPanel() {
  const locale = useLocale();
  const localeForStripe = (locale === "fr" ? "fr" : "en") as "en" | "fr";
  const searchParams = useSearchParams();
  const connectReturn = searchParams.get("connect");
  const t = useTranslations("dashboard.setup.payout");
  const common = useDashboardCommonLabels();
  const labelsBase = useWelperPayoutStepLabels();
  const labels = {
    ...labelsBase,
    successDescription: t("connectedSuccess"),
  };
  const invalidateChecklist = useInvalidateSetupChecklist();

  const { data: state, refetch: refetchSignupState } = useSignupState();
  const stripeConnectStatus = useStripeConnectStatus(true);
  const createConnectLink = useCreateStripeConnectLink();
  const syncConnect = useSyncStripeConnect();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const syncedConnectReturnRef = useRef(false);

  const liteState = {
    completedSteps: state?.completedSteps ?? [],
    filledData: state?.filledData ?? {},
  } as SignupStateLite;

  useEffect(() => {
    void stripeConnectStatus.refetch().finally(() => {
      invalidateChecklist();
    });
    void refetchSignupState();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when payout tab opens
  }, []);

  useEffect(() => {
    if (connectReturn !== "return" && connectReturn !== "refresh") return;
    if (syncedConnectReturnRef.current) return;
    syncedConnectReturnRef.current = true;
    void (async () => {
      setSubmitError(null);
      try {
        await syncConnect.mutateAsync();
        await stripeConnectStatus.refetch();
        invalidateChecklist();
      } catch (err) {
        syncedConnectReturnRef.current = false;
        setSubmitError(err instanceof Error ? err.message : common.genericError);
      }
    })();
  }, [connectReturn, syncConnect, stripeConnectStatus, invalidateChecklist]);

  const connect = stripeConnectStatus.data;
  const filledPayout = liteState.filledData.welperPayout as
    | { stripeOnboardingCompleted?: boolean }
    | undefined;
  const onboardingComplete =
    connect?.onboardingComplete === true ||
    filledPayout?.stripeOnboardingCompleted === true;

  return (
    <Flex direction="column" gap="4">
      <Text size="2" color="gray">
        {t("pageSubtitle")}
      </Text>
      <WelperPayoutStep
        labels={labels}
        state={liteState}
        onboardingComplete={onboardingComplete}
        showContinueWhenConnected={false}
        connectLoading={createConnectLink.isPending || syncConnect.isPending}
        loading={syncConnect.isPending}
        error={
          submitError ??
          stripeConnectStatus.error?.message ??
          createConnectLink.error?.message ??
          syncConnect.error?.message ??
          null
        }
        onStripeOnboardingStart={() => {
          void createConnectLink.mutateAsync(localeForStripe).then(({ url }) => {
            window.location.href = url;
          });
        }}
        onSubmit={() => {
          invalidateChecklist();
        }}
      />
    </Flex>
  );
}

type RelationshipOption = "Parent" | "Legal Guardian";

function guardianRelationshipLabel(
  relationshipType: string,
  t: ReturnType<typeof useTranslations<"dashboard.setup.guardian">>,
): string {
  switch (relationshipType) {
    case "Parent":
      return t("relationshipParent");
    case "Legal Guardian":
      return t("relationshipLegalGuardian");
    default:
      return relationshipType;
  }
}

export function WelperProfileGuardianPanel() {
  const t = useTranslations("dashboard.setup.guardian");
  const tSetup = useTranslations("dashboard.setup");
  const tCommon = useTranslations("auth.common");
  const invalidateChecklist = useInvalidateSetupChecklist();
  const { data: status, isLoading } = useGuardianConsentStatus();
  const submitRequest = useSubmitGuardianRequest();
  const resendEmail = useResendGuardianReviewEmail();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState<RelationshipOption>("Parent");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState<string | null>(null);

  useEffect(() => {
    if (!status) return;
    if (status.guardianFullName) setFullName(status.guardianFullName);
    if (status.guardianEmail) setEmail(status.guardianEmail);
    if (status.guardianPhone) setPhone(status.guardianPhone);
    if (status.relationshipType) {
      setRelationship(status.relationshipType as RelationshipOption);
    }
  }, [status]);

  if (isLoading && !status) {
    return (
      <Text size="2" color="gray">
        {tSetup("loading")}
      </Text>
    );
  }

  if (status && !status.required) {
    return (
      <Callout.Root color={SEMANTIC_COLOR.primary} variant="surface">
        <Callout.Text>{t("notRequired")}</Callout.Text>
      </Callout.Root>
    );
  }

  const approved = status?.status === "approved";
  const pending = status?.status === "pending";
  const expired = status?.status === "expired";
  const showForm = !approved && !pending;

  return (
    <Flex direction="column" gap="4" style={{ maxWidth: "640px" }}>
      <Text size="2" color="gray">
        {t("pageSubtitle")}
      </Text>

      {approved ? (
        <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
          <Flex gap="3" align="start">
            <CheckCircle2 size={20} aria-hidden />
            <Box>
              <Text size="2" weight="medium" as="p">
                {t("statusApprovedTitle")}
              </Text>
              <Text size="2" color="gray" as="p" mt="1">
                {t("statusApprovedDescription")}
              </Text>
            </Box>
          </Flex>
        </Callout.Root>
      ) : null}

      {(pending || expired) && status ? (
        <Callout.Root
          color={expired ? SEMANTIC_COLOR.warning : SEMANTIC_COLOR.primary}
          variant="surface"
          role="status"
        >
          <Text size="2" weight="medium" as="p">
            {expired ? t("statusExpiredTitle") : t("statusPendingTitle")}
          </Text>
          <Text size="2" color="gray" as="p" mt="1">
            {expired
              ? t("statusExpiredDescription")
              : t("statusPendingDescription", { email: status.guardianEmail ?? email })}
          </Text>
          {pending ? (
            <Button
              size="2"
              variant="soft"
              mt="3"
              disabled={resendEmail.isPending}
              onClick={() => {
                setResendNote(null);
                void resendEmail.mutateAsync().then(
                  () => {
                    setResendNote(t("resendSent"));
                    invalidateChecklist();
                  },
                  (err: unknown) =>
                    setSubmitError(
                      err instanceof Error ? err.message : tCommon("somethingWentWrong"),
                    ),
                );
              }}
            >
              {resendEmail.isPending ? t("resending") : t("resend")}
            </Button>
          ) : null}
          {resendNote ? (
            <Text size="1" color="gray" as="p" mt="2">
              {resendNote}
            </Text>
          ) : null}
        </Callout.Root>
      ) : null}

      {!showForm ? null : (
        <Card size="2" variant="surface">
          <Text size="3" weight="medium" as="p" mb={FORM_SPACING.titleGap}>
            {t("formTitle")}
          </Text>
          {submitError ? (
            <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" mb="3">
              <Callout.Text>{submitError}</Callout.Text>
            </Callout.Root>
          ) : null}
          <Flex direction="column" gap="3">
            <Box>
              <Text as="label" size="2" weight="bold" htmlFor="guardian-full-name" mb="1">
                {t("fullName")}
              </Text>
              <TextField.Root
                id="guardian-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("fullNamePlaceholder")}
                disabled={submitRequest.isPending}
              />
            </Box>
            <Box>
              <Text as="label" size="2" weight="bold" htmlFor="guardian-email" mb="1">
                {t("email")}
              </Text>
              <TextField.Root
                id="guardian-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                disabled={submitRequest.isPending}
              />
            </Box>
            <Box>
              <Text as="label" size="2" weight="bold" htmlFor="guardian-phone" mb="1">
                {t("phone")}
              </Text>
              <TextField.Root
                id="guardian-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                disabled={submitRequest.isPending}
              />
            </Box>
            <Box>
              <Text as="label" size="2" weight="bold" htmlFor="guardian-relationship" mb="1">
                {t("relationship")}
              </Text>
              <Select
                value={relationship}
                onValueChange={(value) => setRelationship(value as RelationshipOption)}
                disabled={submitRequest.isPending}
              >
                <SelectTrigger id="guardian-relationship" placeholder={t("relationship")} />
                <SelectContent>
                  <SelectItem value="Parent">{t("relationshipParent")}</SelectItem>
                  <SelectItem value="Legal Guardian">{t("relationshipLegalGuardian")}</SelectItem>
                </SelectContent>
              </Select>
            </Box>
            <Button
              size="2"
              color={SEMANTIC_COLOR.primary}
              disabled={submitRequest.isPending || !fullName.trim() || !email.trim() || !phone.trim()}
              onClick={() => {
                setSubmitError(null);
                void submitRequest
                  .mutateAsync({
                    guardianFullName: fullName.trim(),
                    guardianEmail: email.trim(),
                    guardianPhone: phone.trim(),
                    relationshipType: relationship,
                  })
                  .then(() => invalidateChecklist())
                  .catch((err: unknown) =>
                    setSubmitError(
                      err instanceof Error ? err.message : tCommon("somethingWentWrong"),
                    ),
                  );
              }}
            >
              {submitRequest.isPending ? t("submitting") : t("submit")}
            </Button>
          </Flex>
        </Card>
      )}

      {status?.guardianFullName && (approved || pending) ? (
        <Box>
          <Text size="2" weight="medium" as="p" mb="2">
            {t("summaryGuardian")}
          </Text>
          <Text size="2" color="gray" as="p">
            {status.guardianFullName} ·{" "}
            {guardianRelationshipLabel(status.relationshipType ?? "", t)}
          </Text>
          <Text size="2" color="gray" as="p">
            {status.guardianEmail}
          </Text>
          {status.guardianPhone ? (
            <Text size="2" color="gray" as="p">
              {status.guardianPhone}
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Flex>
  );
}
