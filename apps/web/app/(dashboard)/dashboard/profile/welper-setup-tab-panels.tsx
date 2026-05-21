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
  WELPER_SETUP_CHECKLIST_KEY,
  useBackgroundCheckStatus,
  useConfirmBackgroundCheckReturn,
  useCreateBackgroundCheckCheckout,
  useCreateStripeConnectLink,
  useSignupState,
  useStripeConnectStatus,
  useSyncStripeConnect,
} from "@/lib/hooks/use-signup";

function useInvalidateSetupChecklist() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: WELPER_SETUP_CHECKLIST_KEY });
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
  const [submitError, setSubmitError] = useState<string | null>(null);
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
        loading={createBgCheckout.isPending || confirmBgReturn.isPending}
        pricingLoading={bgCheckStatus.isPending && !filledBg}
        error={
          submitError ??
          bgCheckStatus.error?.message ??
          createBgCheckout.error?.message ??
          confirmBgReturn.error?.message ??
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
