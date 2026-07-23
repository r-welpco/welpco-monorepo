"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Progress } from "@welpco/ui/progress";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { BookOpen, CheckCircle2, Circle, CircleDashed } from "lucide-react";
import type { WelperSetupTaskDto } from "@welpco/types";
import { localizedPath } from "@/i18n/locale-routes";
import { normalizeWelperSetupChecklist } from "@/lib/dashboard/normalize-welper-setup-checklist";
import {
  buildWelperSetupGroupedView,
  type WelperSetupSectionView,
  type WelperSetupTaskWithStep,
} from "@/lib/dashboard/welper-setup-groups";
import {
  WELPER_SETUP_TASK_LABEL_KEYS,
  welperTaskActionHref,
} from "@/lib/dashboard/setup-checklist-navigation";
import { useSyncEmailVerificationSession } from "@/lib/hooks/use-sync-email-verification-session";
import { useBackgroundCheckStatus, useWelperSetupChecklist } from "@/lib/hooks/use-signup";
import type { BackgroundCheckStatusResponse } from "@/lib/services/background-check-service";
import { useGuardianConsentStatus } from "@/lib/hooks/use-guardian-consent";
import type { GuardianConsentStatusResponse } from "@/lib/services/guardian-consent-service";
import {
  EmailVerificationResendButton,
  EmailVerificationResendExtras,
  EmailVerificationResendProvider,
} from "@/components/features/dashboard/email-verification-resend";

function setupTaskLabel(
  task: WelperSetupTaskDto,
  t: ReturnType<typeof useTranslations<"dashboard.setup">>,
): string {
  return t(WELPER_SETUP_TASK_LABEL_KEYS[task.id]);
}

function isBackgroundCheckLinkSent(bg: BackgroundCheckStatusResponse | undefined): boolean {
  if (!bg || bg.paymentStatus !== "paid") return false;
  return (
    bg.certnInviteSentViaEmail === true ||
    bg.certnInviteReady === true ||
    bg.certnStatus === "invited" ||
    bg.certnStatus === "in_progress"
  );
}

function setupTaskStatusLabel(
  task: WelperSetupTaskDto,
  t: ReturnType<typeof useTranslations<"dashboard.setup">>,
  bg: BackgroundCheckStatusResponse | undefined,
  guardian: GuardianConsentStatusResponse | undefined,
): string {
  if (task.completed) return t("statusDone");
  if (task.id === "welperBackgroundCheck" && isBackgroundCheckLinkSent(bg)) {
    return t("statusLinkSent");
  }
  if (task.id === "welperGuardian" && guardian?.status === "pending") {
    return t("statusGuardianPending");
  }
  return t("statusTodo");
}

function setupTaskOptionalHint(
  task: WelperSetupTaskDto,
  t: ReturnType<typeof useTranslations<"dashboard.setup">>,
  guardian: GuardianConsentStatusResponse | undefined,
): string | undefined {
  if (task.completed) return undefined;
  if (task.id === "welperGuardian") {
    if (guardian?.status === "pending") return undefined;
    return t("optionalHints.welperGuardian");
  }
  return undefined;
}

interface WelperSetupChecklistProps {
  variant?: "full" | "compact";
}

export function WelperSetupChecklist({ variant = "full" }: WelperSetupChecklistProps) {
  const t = useTranslations("dashboard.setup");
  const locale = useLocale() as Locale;
  const { data: session, status: sessionStatus } = useSession();
  const sessionRole = session?.user?.role;
  const isWelperSession = sessionRole === "welper";
  const { data: raw, isPending, isError, refetch } = useWelperSetupChecklist(isWelperSession);

  useSyncEmailVerificationSession(isWelperSession);

  useEffect(() => {
    if (isWelperSession && isError) {
      void refetch();
    }
  }, [isWelperSession, isError, refetch]);

  const { data: backgroundCheck } = useBackgroundCheckStatus();
  const { data: guardianConsent } = useGuardianConsentStatus(isWelperSession);

  const emailVerified = session?.user?.emailVerified === true;
  const data = useMemo(
    () => (raw ? normalizeWelperSetupChecklist(raw, emailVerified) : undefined),
    [raw, emailVerified],
  );

  const grouped = useMemo(
    () => (data ? buildWelperSetupGroupedView(data.setupTasks) : undefined),
    [data],
  );

  if (sessionStatus === "authenticated" && !isWelperSession) {
    return (
      <Text size="2" color="gray">
        {t("loading")}
      </Text>
    );
  }

  if (isPending && !raw) {
    return (
      <Text size="2" color="gray">
        {t("loading")}
      </Text>
    );
  }

  if (isError || !data || !grouped) {
    return (
      <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
        <Callout.Text>{t("loadError")}</Callout.Text>
      </Callout.Root>
    );
  }

  if (grouped.allComplete) {
    if (variant === "compact") return null;
    return (
      <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
        <Flex
          align={{ initial: "stretch", sm: "center" }}
          justify="between"
          gap="4"
          wrap="wrap"
          direction={{ initial: "column", sm: "row" }}
        >
          <Callout.Text>
            {t("allCompleteDiscoverable")} {t("welperSections.goLive.sharePrompt")}
          </Callout.Text>
          {/* SHARE-006 — the "you're live" moment offers the share hub. */}
          <Button size="2" color={SEMANTIC_COLOR.success} variant="soft" asChild>
            <Link href="/dashboard/share">{t("welperSections.goLive.shareCta")}</Link>
          </Button>
        </Flex>
      </Callout.Root>
    );
  }

  if (variant === "compact") {
    const nextTask =
      firstPendingFromGrouped(grouped) ??
      data.setupTasks.find((task: WelperSetupTaskDto) => !task.completed);
    const { goLive } = grouped;
    return (
      <Callout.Root
        color={grouped.sectionAComplete ? SEMANTIC_COLOR.primary : SEMANTIC_COLOR.warning}
        variant="surface"
        role="status"
      >
        <Flex
          align={{ initial: "stretch", sm: "center" }}
          justify="between"
          gap="4"
          wrap="wrap"
          direction={{ initial: "column", sm: "row" }}
        >
          <Callout.Text>
            {!grouped.sectionAComplete
              ? t("welperSections.goLive.compactProgress", {
                  done: goLive.completedCount,
                  total: goLive.totalCount,
                })
              : t("welperSections.beyondA.compactProgress")}
          </Callout.Text>
          {nextTask ? (
            <Button
              size="2"
              color={grouped.sectionAComplete ? SEMANTIC_COLOR.primary : SEMANTIC_COLOR.warning}
              variant="soft"
              asChild
            >
              <Link href={welperTaskActionHref(nextTask, locale, session?.user?.email ?? undefined)}>
                {!grouped.sectionAComplete ? t("continueSetup") : t("continueRecommended")}
              </Link>
            </Button>
          ) : null}
        </Flex>
      </Callout.Root>
    );
  }

  const sectionAComplete = grouped.sectionAComplete;

  return (
    <Flex direction="column" gap="4">
      <WelperSetupSectionCard
        section={grouped.goLive}
        title={t("welperSections.goLive.title")}
        completeMessage={`${t("welperSections.goLive.complete")} ${t("welperSections.goLive.sharePrompt")}`}
        completeAction={
          /* SHARE-006 — go-live share prompt: static CTA in the completed
             message (same lifetime as the message itself; no new persistence). */
          <Button size="2" color={SEMANTIC_COLOR.success} variant="soft" asChild>
            <Link href="/dashboard/share">{t("welperSections.goLive.shareCta")}</Link>
          </Button>
        }
        showTasks={!sectionAComplete}
        backgroundCheck={backgroundCheck}
        guardianConsent={guardianConsent}
        locale={locale}
        sessionEmail={session?.user?.email ?? undefined}
      />

      {grouped.payout && !grouped.payout.complete ? (
        <WelperSetupSectionCard
          section={grouped.payout}
          title={t("welperSections.payout.title")}
          subtitle={t("welperSections.payout.subtitle")}
          completeMessage={t("welperSections.payout.complete")}
          showTasks
          backgroundCheck={backgroundCheck}
          guardianConsent={guardianConsent}
          locale={locale}
          sessionEmail={session?.user?.email ?? undefined}
        />
      ) : null}

      {grouped.trust && !grouped.trust.complete ? (
        <WelperSetupSectionCard
          section={grouped.trust}
          title={t("welperSections.trust.title")}
          subtitle={t("welperSections.trust.subtitle")}
          completeMessage={t("welperSections.trust.complete")}
          showTasks
          backgroundCheck={backgroundCheck}
          guardianConsent={guardianConsent}
          locale={locale}
          sessionEmail={session?.user?.email ?? undefined}
        />
      ) : null}

      <Flex justify="start">
        <Button size="1" variant="ghost" color="gray" asChild>
          <Link href={localizedPath("/guides/welper", locale)}>
            <BookOpen size={14} aria-hidden />
            {t("readGuide")}
          </Link>
        </Button>
      </Flex>
    </Flex>
  );
}

function firstPendingFromGrouped(
  grouped: ReturnType<typeof buildWelperSetupGroupedView>,
): WelperSetupTaskDto | undefined {
  if (!grouped.sectionAComplete) {
    return grouped.goLive.tasks.find((t) => !t.completed);
  }
  return (
    grouped.payout?.tasks.find((t) => !t.completed) ??
    grouped.trust?.tasks.find((t) => !t.completed)
  );
}

function WelperSetupSectionCard({
  section,
  title,
  subtitle,
  completeMessage,
  completeAction,
  showTasks,
  backgroundCheck,
  guardianConsent,
  locale,
  sessionEmail,
}: {
  section: WelperSetupSectionView;
  title: string;
  subtitle?: string;
  completeMessage?: string;
  /** SHARE-006 — optional CTA rendered inside the completed-state callout. */
  completeAction?: React.ReactNode;
  showTasks: boolean;
  backgroundCheck: BackgroundCheckStatusResponse | undefined;
  guardianConsent: GuardianConsentStatusResponse | undefined;
  locale: Locale;
  sessionEmail?: string;
}) {
  const t = useTranslations("dashboard.setup");
  const showProgress = section.id === "goLive";
  const progressPct = Math.round(
    (section.completedCount / Math.max(section.totalCount, 1)) * 100,
  );

  return (
    <Card size="3" variant="surface">
      <Flex direction="column" gap="3">
        <Box style={{ minWidth: 0 }}>
          <Text size="3" weight="bold" as="p" mb={subtitle && !section.complete ? "1" : "0"}>
            {title}
          </Text>
          {subtitle && !section.complete ? (
            <Text size="2" color="gray" as="p">
              {subtitle}
            </Text>
          ) : null}
        </Box>

        {section.complete && completeMessage ? (
          <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
            {completeAction ? (
              <Flex
                align={{ initial: "stretch", sm: "center" }}
                justify="between"
                gap="4"
                wrap="wrap"
                direction={{ initial: "column", sm: "row" }}
              >
                <Callout.Text>{completeMessage}</Callout.Text>
                {completeAction}
              </Flex>
            ) : (
              <Callout.Text>{completeMessage}</Callout.Text>
            )}
          </Callout.Root>
        ) : null}

        {showTasks && !section.complete ? (
          <>
            {showProgress ? (
              <Box>
                <Text size="2" weight="medium" mb="2" as="p">
                  {t("progress", {
                    done: section.completedCount,
                    total: section.totalCount,
                  })}
                </Text>
                <Progress
                  value={progressPct}
                  size="2"
                  color={SEMANTIC_COLOR.primary}
                  aria-label={t("progressAria", { percent: progressPct })}
                />
              </Box>
            ) : null}
            <Flex direction="column" gap="2" asChild>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {section.tasks
                  .filter((task) => !task.completed)
                  .map((task) => (
                    <SetupTaskRow
                      key={task.id}
                      task={task}
                      stepNumber={task.stepNumber}
                      label={setupTaskLabel(task, t)}
                      statusLabel={setupTaskStatusLabel(
                        task,
                        t,
                        backgroundCheck,
                        guardianConsent,
                      )}
                      optionalHint={setupTaskOptionalHint(task, t, guardianConsent)}
                      locale={locale}
                      sessionEmail={sessionEmail}
                      showDivider={showProgress}
                      showStepNumber={showProgress}
                      showTaskLabel={showProgress}
                    />
                  ))}
              </ul>
            </Flex>
          </>
        ) : null}
      </Flex>
    </Card>
  );
}

function SetupTaskRow({
  task,
  stepNumber,
  label,
  statusLabel,
  optionalHint,
  locale,
  sessionEmail,
  showDivider = true,
  showStepNumber = true,
  showTaskLabel = true,
}: {
  task: WelperSetupTaskWithStep;
  stepNumber: number;
  label: string;
  statusLabel: string;
  optionalHint?: string;
  locale: Locale;
  sessionEmail?: string;
  showDivider?: boolean;
  showStepNumber?: boolean;
  showTaskLabel?: boolean;
}) {
  const t = useTranslations("dashboard.setup");
  const Icon = task.completed
    ? CheckCircle2
    : task.required
      ? Circle
      : CircleDashed;
  const iconColor = task.completed
    ? "var(--green-9)"
    : task.required
      ? "var(--amber-9)"
      : "var(--gray-8)";

  if (task.id === "emailVerification" && !task.completed) {
    return (
      <li>
        <EmailVerificationResendProvider>
          <Flex
            direction="column"
            gap="2"
            py={showDivider ? "2" : "0"}
            style={showDivider ? { borderBottom: "1px solid var(--gray-a5)" } : undefined}
          >
            <Flex align="center" justify="between" gap="3">
              <Flex align="center" gap="3" style={{ minWidth: 0 }}>
                <Icon size={20} color={iconColor} aria-hidden />
                <Box style={{ minWidth: 0 }}>
                  {showTaskLabel ? (
                    <Text size="2" weight="medium" as="p">
                      {showStepNumber ? `${stepNumber}. ${label}` : label}
                    </Text>
                  ) : null}
                  <Text size="1" color="gray" as="p">
                    {statusLabel}
                  </Text>
                  {optionalHint ? (
                    <Text size="2" weight="medium" as="p" mt="1">
                      {optionalHint}
                    </Text>
                  ) : null}
                </Box>
              </Flex>
            </Flex>
            <EmailVerificationResendExtras />
            <Flex justify="end">
              <EmailVerificationResendButton />
            </Flex>
          </Flex>
        </EmailVerificationResendProvider>
      </li>
    );
  }

  return (
    <li>
      <Flex
        align="center"
        justify="between"
        gap="3"
        py={showDivider ? "2" : "0"}
        style={showDivider ? { borderBottom: "1px solid var(--gray-a5)" } : undefined}
      >
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          <Icon size={20} color={iconColor} aria-hidden />
          <Box style={{ minWidth: 0 }}>
            {showTaskLabel ? (
              <Text size="2" weight="medium" as="p">
                {showStepNumber ? `${stepNumber}. ${label}` : label}
              </Text>
            ) : null}
            <Text size="1" color="gray" as="p">
              {statusLabel}
            </Text>
            {optionalHint ? (
              <Text size="2" weight="medium" as="p" mt="1">
                {optionalHint}
              </Text>
            ) : null}
          </Box>
        </Flex>
        {!task.completed ? (
          <Flex gap="2" wrap="wrap" justify="end">
            <Button size="1" variant="soft" asChild>
              <Link href={welperTaskActionHref(task, locale, sessionEmail)}>{t("open")}</Link>
            </Button>
          </Flex>
        ) : null}
      </Flex>
    </li>
  );
}
