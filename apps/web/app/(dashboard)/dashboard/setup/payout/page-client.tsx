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
import { WelperPayoutStep, type WelperPayoutStepValues } from "@welpco/ui/platform/user-management";
import type { SignupStateLite } from "@welpco/ui/platform/user-management";
import { useWelperPayoutStepLabels } from "@/lib/i18n/use-auth-labels";
import {
  useCompleteWelperPayoutStep,
  useCreateStripeConnectLink,
  useSignupState,
  useStripeConnectStatus,
  useSyncStripeConnect,
} from "@/lib/hooks/use-signup";

export default function PayoutSetupPageClient() {
  const locale = useLocale();
  const localeForStripe = (locale === "fr" ? "fr" : "en") as "en" | "fr";
  const searchParams = useSearchParams();
  const connectReturn = searchParams.get("connect");
  const t = useTranslations("dashboard.setup.payout");
  const labels = useWelperPayoutStepLabels();

  const { data: state } = useSignupState();
  const stripeConnectStatus = useStripeConnectStatus(true);
  const createConnectLink = useCreateStripeConnectLink();
  const syncConnect = useSyncStripeConnect();
  const completeStep = useCompleteWelperPayoutStep();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const syncedConnectReturnRef = useRef(false);

  const liteState: SignupStateLite = {
    completedSteps: state?.completedSteps ?? [],
    filledData: state?.filledData ?? {},
  };

  useEffect(() => {
    if (connectReturn !== "return" && connectReturn !== "refresh") return;
    if (syncedConnectReturnRef.current) return;
    syncedConnectReturnRef.current = true;
    void (async () => {
      setSubmitError(null);
      try {
        await syncConnect.mutateAsync();
      } catch (err) {
        syncedConnectReturnRef.current = false;
        setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      }
    })();
  }, [connectReturn, syncConnect]);

  const connect = stripeConnectStatus.data;
  const filledPayout = liteState.filledData.welperPayout as
    | { stripeOnboardingCompleted?: boolean }
    | undefined;
  const onboardingComplete =
    connect?.onboardingComplete === true ||
    filledPayout?.stripeOnboardingCompleted === true;

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="5">
        <Flex direction="column" gap="2">
          <Button size="2" variant="ghost" asChild style={{ alignSelf: "flex-start" }}>
            <Link href="/dashboard">← Back</Link>
          </Button>
          <Heading as="h1" size="7" trim="start">
            {t("pageTitle")}
          </Heading>
          <Text size="2" color="gray">
            {t("pageSubtitle")}
          </Text>
        </Flex>
        <WelperPayoutStep
          labels={labels}
          state={liteState}
          onboardingComplete={onboardingComplete}
          connectLoading={createConnectLink.isPending || syncConnect.isPending}
          loading={completeStep.isPending}
          error={
            submitError ??
            stripeConnectStatus.error?.message ??
            createConnectLink.error?.message ??
            syncConnect.error?.message ??
            completeStep.error?.message ??
            null
          }
          onStripeOnboardingStart={() => {
            void createConnectLink.mutateAsync(localeForStripe).then(({ url }) => {
              window.location.href = url;
            });
          }}
          onSubmit={(values: WelperPayoutStepValues) => {
            void completeStep.mutateAsync(values).then(() => {
              window.location.href = "/dashboard";
            });
          }}
        />
      </Flex>
    </Container>
  );
}
