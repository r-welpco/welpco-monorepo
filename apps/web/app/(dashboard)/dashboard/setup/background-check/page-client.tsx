"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { WelperBackgroundCheckStep } from "@welpco/ui/platform/user-management";
import { useWelperBackgroundCheckStepLabels } from "@/lib/i18n/use-auth-labels";
import {
  useBackgroundCheckStatus,
  useCompleteWelperBackgroundCheckStep,
  useConfirmBackgroundCheckReturn,
  useCreateBackgroundCheckCheckout,
  useResendBackgroundCheckInviteEmail,
  useSignupState,
} from "@/lib/hooks/use-signup";
import type { SignupStateLite } from "@welpco/ui/platform/user-management";
import { useDashboardCommonLabels } from "@/lib/i18n/use-dashboard-labels";

export default function BackgroundCheckSetupPageClient() {
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
  const common = useDashboardCommonLabels();

  const { data: state } = useSignupState();
  const bgCheckStatus = useBackgroundCheckStatus(true);
  const createBgCheckout = useCreateBackgroundCheckCheckout();
  const confirmBgReturn = useConfirmBackgroundCheckReturn();
  const completeStep = useCompleteWelperBackgroundCheckStep();
  const resendInviteEmail = useResendBackgroundCheckInviteEmail();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendInviteEmailSent, setResendInviteEmailSent] = useState(false);
  const confirmedStripeSessionRef = useRef<string | null>(null);

  const liteState = {
    completedSteps: state?.completedSteps ?? [],
    filledData: state?.filledData ?? {},
  } as SignupStateLite;

  useEffect(() => {
    if (!pendingStripeReturn || !checkoutSessionId) return;
    if (confirmedStripeSessionRef.current === checkoutSessionId) return;
    confirmedStripeSessionRef.current = checkoutSessionId;

    void (async () => {
      setSubmitError(null);
      try {
        await confirmBgReturn.mutateAsync(checkoutSessionId);
        await bgCheckStatus.refetch();
      } catch (err) {
        confirmedStripeSessionRef.current = null;
        setSubmitError(
          err instanceof Error ? err.message : tCommon("somethingWentWrong"),
        );
      }
    })();
  }, [pendingStripeReturn, checkoutSessionId, confirmBgReturn, bgCheckStatus, tCommon]);

  const bg = bgCheckStatus.data;
  const filledBg = liteState.filledData.welperBackgroundCheck as
    | {
        listPriceCents?: number;
        promoPriceCents?: number;
        promoEnabled?: boolean;
      }
    | undefined;

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="5">
        <BoxHeader
          backHref="/dashboard"
          backLabel={common.back}
          title={t("pageTitle")}
          subtitle={t("pageSubtitle")}
        />
        <WelperBackgroundCheckStep
          labels={labels}
          state={liteState}
          loading={
            createBgCheckout.isPending ||
            confirmBgReturn.isPending ||
            completeStep.isPending ||
            resendInviteEmail.isPending
          }
          pricingLoading={bgCheckStatus.isPending && !filledBg}
          error={
            submitError ??
            bgCheckStatus.error?.message ??
            createBgCheckout.error?.message ??
            confirmBgReturn.error?.message ??
            completeStep.error?.message ??
            resendInviteEmail.error?.message ??
            null
          }
          listPriceCents={bg?.pricing.listPriceCents ?? filledBg?.listPriceCents}
          promoPriceCents={bg?.pricing.promoPriceCents ?? filledBg?.promoPriceCents}
          promoEnabled={bg?.pricing.promoEnabled ?? filledBg?.promoEnabled ?? true}
          paymentStatus={bg?.paymentStatus ?? null}
          failureReason={bg?.failureReason ?? null}
          signupStepComplete={bg?.signupStepComplete ?? false}
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
            void completeStep.mutateAsync().then(() => {
              window.location.href = "/dashboard";
            });
          }}
        />
      </Flex>
    </Container>
  );
}

function BoxHeader({
  backHref,
  backLabel,
  title,
  subtitle,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Flex direction="column" gap="2">
      <Button size="2" variant="ghost" asChild style={{ alignSelf: "flex-start" }}>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
      <Heading as="h1" size="7" trim="start">
        {title}
      </Heading>
      <Text size="2" color="gray">
        {subtitle}
      </Text>
    </Flex>
  );
}
